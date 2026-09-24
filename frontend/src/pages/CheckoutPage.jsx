import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import formatPrice from '../utils/formatPrice';
import { getAddresses } from '../services/addressService';
import { createRazorpayOrder, verifyRazorpayPayment } from '../services/orderService';
import '../css/checkout.css';
import '../css/checkout-payment.css';
import { useLocation } from "react-router-dom";

// Loads the Razorpay Checkout script on demand (only once) instead of
// requiring a <script> tag in public/index.html.
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const existing = document.getElementById('razorpay-checkout-js');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.id = 'razorpay-checkout-js';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const CheckoutPage = () => {
  const { items, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [step, setStep] = useState('address'); // 'address' or 'payment'

  const location = useLocation();

  const discount = location.state?.discount || 0;
  const appliedCoupon = location.state?.coupon || null;

  const itemsPrice = items.reduce((sum, i) => {
    const price = Number(i?.product?.price) || 0;
    const qty = Number(i?.qty) || 0;
    return sum + price * qty;
  }, 0);

  useEffect(() => {
    const load = async () => {
      try {
        const list = await getAddresses();
        setAddresses(list || []);
        // preselect default
        const def = (list || []).find((a) => a.isDefault) || (list || [])[0];
        if (def) setSelectedAddressId(def._id);
      } catch (err) {
        console.error('Failed to load addresses', err);
      } finally {
        setLoadingAddresses(false);
      }
    };
    load();
  }, []);

  const handleContinueToPayment = () => {
    if (!selectedAddressId) {
      alert('Please select a shipping address first');
      return;
    }
    setStep('payment');
  };

  // Online payment only — Razorpay. There is no Cash on Delivery path:
  // the Order document is only ever created inside verifyRazorpayPayment,
  // after the backend has verified a real, successful payment.
  const handlePayWithRazorpay = async () => {
    if (placing) return;
    if (!selectedAddressId) {
      alert('Please select a shipping address first');
      return;
    }

    setPlacing(true);

    try {
      const sdkReady = await loadRazorpayScript();
      if (!sdkReady) {
        alert('Unable to load the payment gateway. Please check your internet connection and try again.');
        setPlacing(false);
        return;
      }

      const rpOrder = await createRazorpayOrder({
        addressId: selectedAddressId,
        discount
      });

      const options = {
        key: rpOrder.keyId,
        amount: rpOrder.amount,
        currency: rpOrder.currency,
        name: 'Mithralaiya',
        description: 'Order Payment',
        // Brand logo shown at the top of the Razorpay popup. Put your logo at
        // frontend/public/logo192.png (or change this path to wherever your
        // bull logo lives, e.g. '/images/bullrise-logo.png').
        image: `${window.location.origin}/logo192.png`,
        order_id: rpOrder.razorpayOrderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || ''
        },
        theme: { color: '#8a5a2a' },
        modal: {
          // User closed the popup without paying — nothing was created, so
          // there's nothing to undo, just re-enable the button.
          ondismiss: () => setPlacing(false)
        },
        handler: async (response) => {
          try {
            const order = await verifyRazorpayPayment({
              addressId: selectedAddressId,
              discount,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });

            try {
              await clearCart();
            } catch (cartErr) {
              console.error('Failed to clear cart after order:', cartErr);
            }

            const oid = order.orderId || order._id;
            navigate(`/order-success/${encodeURIComponent(oid)}`);
          } catch (err) {
            console.error('Payment verification failed', err);
            const msg =
              err.response?.data?.message ||
              'Payment succeeded but we could not confirm your order. If any amount was deducted, please contact support with your payment ID.';
            alert(msg);
          } finally {
            setPlacing(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => {
        console.error('Razorpay payment failed', resp?.error);
        alert(`Payment failed: ${resp?.error?.description || 'Please try again.'}`);
        setPlacing(false);
      });
      rzp.open();
    } catch (err) {
      console.error('Failed to start payment', err);
      const msg = err.response?.data?.message || 'Failed to start payment';
      alert(msg);
      if (msg.includes('shipping address')) {
        navigate('/account', { state: { activeTab: 'address' } });
      }
      setPlacing(false);
    }
  };

  const shipping = itemsPrice < 999 ? 49 : 0;
  const gst = Math.round(itemsPrice * 0.05);

  const grandTotal = itemsPrice + shipping + gst - discount;

  return (
    <div className="checkout-page">
      <h1 className="page-title">Checkout</h1>

      {/* PROGRESS STEPPER: Order Summary is always done by the time you reach
            checkout (it happened on the cart page). Address / Payment reflect
            the current `step`. */}
      <div className="checkout-progress">
        <div className="checkout-step completed">
          <div className="checkout-circle">✓</div>
          <p>Order Summary</p>
        </div>

        <div className="checkout-line active"></div>

        <div className={`checkout-step ${step === 'address' ? 'active' : 'completed'}`}>
          <div className="checkout-circle">{step === 'payment' ? '✓' : '2'}</div>
          <p>Address</p>
        </div>

        <div className={`checkout-line ${step === 'payment' ? 'active' : ''}`}></div>

        <div className={`checkout-step ${step === 'payment' ? 'active' : ''}`}>
          <div className="checkout-circle">3</div>
          <p>Payment</p>
        </div>
      </div>

      <div className="checkout-layout">
        <div className="checkout-left">
          {step === 'address' && (
            <section className="checkout-addresses">
              <h2>Shipping Address</h2>

              {loadingAddresses ? (
                <div>Loading addresses…</div>
              ) : addresses.length === 0 ? (
                <div>
                  <p>No shipping addresses found.</p>
                  <button
                    className="btn-add-address"
                    onClick={() => navigate('/account', { state: { activeTab: 'address' } })}
                  >
                    Add Address +
                  </button>
                </div>
              ) : (
                <div className="address-list">
                  {addresses.map((a) => (
                    <label key={a._id} className={`address-card ${a.isDefault ? 'default' : ''}`}>
                      <input
                        type="radio"
                        name="shippingAddress"
                        checked={selectedAddressId === a._id}
                        onChange={() => setSelectedAddressId(a._id)}
                      />

                      <div className="address-body">
                        <div className="address-top">
                          <strong>{a.fullName}</strong>
                          {a.suggestedName && (
                            <span className="address-label">{a.suggestedName}</span>
                          )}
                          {a.isDefault && <span className="address-default">Default</span>}
                        </div>

                        <div className="address-line">{a.address}</div>
                        {a.locality && <div className="address-line">{a.locality}</div>}
                        <div className="address-meta">{a.city} - {a.pincode}</div>
                        <div className="address-meta">{a.state}</div>
                        <div className="address-meta">Phone: {a.phone}</div>
                      </div>
                    </label>
                  ))}

                  <div style={{ marginTop: 12 }}>
                    <button
                      className="addeditcheckaddress"
                      onClick={() => navigate('/account', { state: { activeTab: 'address' } })}
                    >
                      Add or Edit Addresses
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {step === 'payment' && (
            <section className="checkout-payment">
              <h2>Payment</h2>

              <div className="pay-online-card">
                <div className="pay-online-head">
                  <div className="pay-online-title">
                    <span className="pay-online-badge">100% Secure</span>
                    <strong>Pay Online</strong>
                    <p>Choose from UPI, Cards, Netbanking, Wallets &amp; EMI in the next step</p>
                  </div>
                </div>

                <div className="pay-methods-grid">
                  <div className="pay-method">
                    <span className="pay-method-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 3l5 9-5 9" /><path d="M13 3l5 9-5 9" />
                      </svg>
                    </span>
                    <div>
                      <strong>UPI</strong>
                      <small>GPay, PhonePe, Paytm &amp; more</small>
                    </div>
                  </div>

                  <div className="pay-method">
                    <span className="pay-method-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" />
                      </svg>
                    </span>
                    <div>
                      <strong>Cards</strong>
                      <small>Credit &amp; Debit — Visa, Mastercard, RuPay</small>
                    </div>
                  </div>

                  <div className="pay-method">
                    <span className="pay-method-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 21h18" /><path d="M4 10h16" /><path d="M12 3L4 10h16L12 3z" /><path d="M6 10v8M10 10v8M14 10v8M18 10v8" />
                      </svg>
                    </span>
                    <div>
                      <strong>Netbanking</strong>
                      <small>All major Indian banks</small>
                    </div>
                  </div>

                  <div className="pay-method">
                    <span className="pay-method-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="6" width="20" height="13" rx="2" /><path d="M16 12.5h2" /><path d="M2 9h20" opacity="0" /><path d="M6 6V5a2 2 0 012-2h8a2 2 0 012 2v1" />
                      </svg>
                    </span>
                    <div>
                      <strong>Wallets &amp; EMI</strong>
                      <small>Mobikwik, Freecharge &amp; EMI options</small>
                    </div>
                  </div>
                </div>

                <div className="pay-online-foot">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 018 0v3" />
                  </svg>
                  <span>Payments are encrypted and processed securely by Razorpay. Cash on Delivery is not available.</span>
                </div>
              </div>
            </section>
          )}
        </div>

        <aside className="checkout-right">
          <h2>Order Summary</h2>

          <div className="summary-row">
            <span>Items</span>
            <span>{items.reduce((s, it) => s + Number(it.qty || 0), 0)}</span>
          </div>

          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatPrice(itemsPrice)}</span>
          </div>

          <div className="summary-row">
            <span>Shipping</span>
            <span>{itemsPrice < 999 ? formatPrice(49) : 'Free'}</span>
          </div>

          <div className="summary-row">
            <span>GST</span>
            <span>{formatPrice(Math.round(itemsPrice * 0.05))}</span>
          </div>
          {discount > 0 && (
            <div className="summary-row">
              <span>Coupon Discount</span>
              <span style={{ color: "green" }}>
                - {formatPrice(discount)}
              </span>
            </div>
          )}

          <hr />

          <div className="summary-row total">
            <span>Grand Total</span>
            <span>{formatPrice(grandTotal)}</span>
          </div>

          {step === 'address' && (
            <button
              className="btn-continue-payment"
              onClick={handleContinueToPayment}
            >
              Continue to Payment
            </button>
          )}

          {step === 'payment' && (
            <>
              <button
                className="btn-back-to-address"
                onClick={() => setStep('address')}
                style={{ marginBottom: 10 }}
                disabled={placing}
              >
                Back to Address
              </button>
              <button
                className="btn-place-order wide pay-razorpay-btn"
                onClick={handlePayWithRazorpay}
                disabled={placing}
              >
                {placing ? (
                  <span className="pay-btn-inner">
                    <span className="pay-btn-spinner" aria-hidden="true"></span>
                    Processing Payment...
                  </span>
                ) : (
                  <span className="pay-btn-inner">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 018 0v3" />
                    </svg>
                    Pay {formatPrice(grandTotal)} Securely
                  </span>
                )}
              </button>
              <p className="pay-secure-note">
                <span className="pay-secure-dot"></span>
                Secured by Razorpay · 256-bit encryption
              </p>
            </>
          )}
        </aside>
      </div>
    </div>
  );
};

export default CheckoutPage;
