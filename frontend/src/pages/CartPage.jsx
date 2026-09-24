import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import formatPrice from "../utils/formatPrice";
import api from "../services/api";
import "../css/cart.css";

import {
  getActiveCoupons,
  applyCoupon,
} from "../services/couponService";

import {
  ToastContainer,
  toast,
} from "react-toastify";

import "react-toastify/dist/ReactToastify.css";


const CartPage = () => {
  const {
    items,
    updateCartItem,
    removeFromCart,
  } = useCart();

  const navigate = useNavigate();

  const [couponInput, setCouponInput] = React.useState("");
  const [coupons, setCoupons] = React.useState([]);
  const [appliedCoupon, setAppliedCoupon] = React.useState(null);
  const [discount, setDiscount] = React.useState(0);


  // =========================================================
  // LOAD COUPONS
  // =========================================================

  React.useEffect(() => {
    loadCoupons();
  }, []);


  const loadCoupons = async () => {
    try {
      const data = await getActiveCoupons();
      setCoupons(data);
    } catch (err) {
      console.log("Coupon loading error:", err);
    }
  };


  // =========================================================
  // CART ERROR MESSAGE - TAMIL
  // =========================================================


  const getCartErrorMessage = (error) => {
    const backendMessage =
      error?.response?.data?.message ||
      error?.message ||
      "";

    switch (backendMessage) {
      case "Selected size is not available":
        return "Selected size is not available.";

      case "Requested quantity is not available":
        return "Requested quantity is not available.";

      case "Selected color is not available":
        return "Selected color is not available.";

      case "Product not found":
        return "Product not found.";

      case "Item not found in cart":
        return "This product is not available in your cart.";

      case "Cart not found":
        return "Cart not found.";

      default:
        return "Unable to update cart. Please try again.";
    }
  };




  // =========================================================
  // APPLY COUPON
  // =========================================================

  const handleApplyCoupon = async (code) => {
    if (!code?.trim()) {
      toast.error("Please enter a coupon code.");
      return;
    }

    try {
      const res = await applyCoupon(code, itemsPrice);

      setAppliedCoupon({
        code,
        discount: res.discount,
      });

      setDiscount(res.discount);

      toast.success("Coupon Applied Successfully");
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Invalid Coupon"
      );
    }
  };


  // =========================================================
  // CART PRICE
  // =========================================================

  const itemsPrice = items.reduce((sum, item) => {
    const price = Number(item?.product?.price) || 0;
    const qty = Number(item?.qty) || 0;

    return sum + price * qty;
  }, 0);


  // =========================================================
  // UPDATE QUANTITY
  // =========================================================

  const handleQtyChange = async (item, qty) => {
    if (qty < 1 || isNaN(qty)) {
      return;
    }

    try {
      await updateCartItem({
        productId: item.product._id,
        size: item.size,
        color: item.color,
        qty,
      });
    } catch (error) {
      console.error("Quantity update error:", error);

      toast.error(getCartErrorMessage(error));
    }
  };


  // =========================================================
  // UPDATE SIZE
  // =========================================================

  const handleSizeChange = async (item, size) => {
    try {
      await updateCartItem({
        productId: item.product._id,
        size,
        color: item.color,
        qty: item.qty,
      });
    } catch (error) {
      console.error("Size update error:", error);

      toast.error(getCartErrorMessage(error));
    }
  };


  // =========================================================
  // REMOVE COUPON
  // =========================================================

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    setCouponInput("");

    toast.success("Coupon Removed Successfully");
  };


  // =========================================================
  // PLACE ORDER
  // =========================================================

  const handlePlaceOrder = () => {
    navigate("/checkout", {
      state: {
        coupon: appliedCoupon,
        discount,
        grandTotal,
      },
    });
  };


  // =========================================================
  // PRICE CALCULATION
  // =========================================================

  const shipping = itemsPrice < 999 ? 49 : 0;

  const gst = Math.round(itemsPrice * 0.05);

  const grandTotal =
    itemsPrice +
    shipping +
    gst -
    discount;


  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="cart-page">

      {/* =====================================================
          TOAST CONTAINER
      ====================================================== */}

      <ToastContainer
        position="top-right"
        autoClose={2500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
      />


      {/* =====================================================
          EMPTY CART
      ====================================================== */}

      {items.length === 0 ? (

        <div className="empty-cart">

          <div className="empty-cart-inner">

            <img
              className="empty-cart-image"
              src="https://png.pngtree.com/png-vector/20250802/ourlarge/pngtree-3d-cartoon-man-shopping-for-clothes-with-cart-png-image_16954800.webp"
              alt="Empty shopping bag"
            />

            <div className="empty-cart-quote">

              <div className="empty-cart-quote-inner">

                <div className="empty-cart-quote-main">
                  Uh oh… your cart is empty!
                </div>

                <div className="empty-cart-quote-sub">
                  Add a few Bullrise favorites to get started.
                </div>

              </div>

            </div>


            <button
              className="empty-cart-btn"
              onClick={() => navigate("/products")}
            >
              Continue Shopping
            </button>

          </div>

        </div>

      ) : (

        <>
          {/* =================================================
              CART TITLE
          ================================================== */}

          <h1 className="cart-title">
            Shopping Cart ({items.length})
          </h1>


          {/* =================================================
              PROGRESS
          ================================================== */}

          <div className="cart-progress">

            <div className="step active">

              <div className="circle">
                1
              </div>

              <p>
                Order Summary
              </p>

            </div>


            <div className="line"></div>


            <div className="step">

              <div className="circle">
                2
              </div>

              <p>
                Address
              </p>

            </div>


            <div className="line"></div>


            <div className="step">

              <div className="circle">
                3
              </div>

              <p>
                Payment
              </p>

            </div>

          </div>


          {/* =================================================
              CART LAYOUT
          ================================================== */}

          <div className="cart-layout">


            {/* =================================================
                LEFT SIDE
            ================================================== */}

            <div className="cart-left">


              {/* OFFER BAR */}

              <div className="offer-bar">

                <div className="offer-item">

                  <span className="offer-check">
                    ✓
                  </span>

                  <span>
                    Free Shipping
                  </span>

                </div>


                <div className="offer-item">

                  <span className="offer-check">
                    ✓
                  </span>

                  <span>
                    ₹250 off
                  </span>

                </div>


                <div className="offer-item">

                  <span className="offer-check">
                    ✓
                  </span>

                  <span>
                    ₹500 off
                  </span>

                </div>


                <div className="offer-item">

                  <span className="offer-check">
                    ✓
                  </span>

                  <span>
                    10% off Above ₹1499 (on 1st or...)
                  </span>

                </div>

              </div>


              {/* FREE DELIVERY */}

              <div className="free-delivery-line">

                <span className="truck-icon">
                  🚚
                </span>

                <span>
                  Free Delivery by 3–5 days.
                </span>

              </div>


              {/* =================================================
                  CART ITEMS
              ================================================== */}

              <div className="cart-items">

                {items.map((item, idx) => {

                  const price =
                    Number(item?.product?.price) || 0;

                  const qty =
                    Number(item?.qty) || 0;

                  const lineTotal =
                    price * qty;


                  return (

                    <div
                      key={idx}
                      className="cart-item"
                    >


                      {/* PRODUCT IMAGE */}

                      <img
                        src={
                          item?.product?.images?.[0] ||
                          "/placeholder.png"
                        }
                        alt={
                          item?.product?.name ||
                          "Product"
                        }
                        className="cart-item-image"
                      />


                      {/* PRODUCT INFO */}

                      <div className="cart-item-info">


                        {/* PRODUCT TOP */}

                        <div className="cart-item-top">

                          <div className="cart-item-name">

                            {(
                              item?.product?.name ||
                              "Product"
                            ).toUpperCase()}

                          </div>


                          <div className="cart-item-price">

                            {formatPrice(price)}

                          </div>

                        </div>


                        {/* SIZE + QUANTITY */}

                        <div className="cart-item-controls-row">


                          {/* SIZE */}

                          <select
                            className="size-select"
                            value={item.size || ""}
                            onChange={(e) =>
                              handleSizeChange(
                                item,
                                e.target.value
                              )
                            }
                          >

                            {[
                              "S",
                              "M",
                              "L",
                              "XL",
                              "XXL",
                            ].map((s) => (

                              <option
                                key={s}
                                value={s}
                              >
                                Size:{s}
                              </option>

                            ))}

                          </select>


                          {/* QUANTITY */}

                          <div className="qty-control">


                            <button
                              onClick={() =>
                                handleQtyChange(
                                  item,
                                  qty - 1
                                )
                              }
                            >
                              −
                            </button>


                            <input
                              type="number"
                              min="1"
                              value={qty}
                              onChange={(e) =>
                                handleQtyChange(
                                  item,
                                  Number(e.target.value)
                                )
                              }
                            />


                            <button
                              onClick={() =>
                                handleQtyChange(
                                  item,
                                  qty + 1
                                )
                              }
                            >
                              +
                            </button>


                          </div>

                        </div>


                        {/* REMOVE */}

                        <button
                          className="cart-remove-btn"
                          onClick={() =>
                            removeFromCart(
                              item.product._id,
                              item.size,
                              item.color
                            )
                          }
                        >
                          REMOVE
                        </button>


                        {/* NOTE */}

                        <div className="cart-item-note">

                          Sale items are not eligible
                          for additional discounts.

                        </div>


                      </div>

                    </div>

                  );

                })}

              </div>

            </div>


            {/* =================================================
                RIGHT SIDE
            ================================================== */}

            <div className="cart-right">


              {/* =================================================
                  COUPON BOX
              ================================================== */}

              <div className="coupon-box">


                <div className="coupon-box-header">

                  <h3>
                    Apply Coupon
                  </h3>

                  <Link
                    to="/coupons"
                    className="view-all-coupons-link"
                  >
                    View All
                  </Link>

                </div>


                {/* COUPON INPUT */}

                <div className="coupon-input-row">

                  <input
                    type="text"
                    placeholder="Enter Code"
                    value={couponInput}
                    onChange={(e) =>
                      setCouponInput(
                        e.target.value.toUpperCase()
                      )
                    }
                  />


                  <button
                    onClick={() =>
                      handleApplyCoupon(couponInput)
                    }
                  >
                    Apply
                  </button>

                </div>


                {/* COUPON STATUS */}

                <div className="coupon-status">

                  {appliedCoupon
                    ? `${appliedCoupon.code} Applied`
                    : "No Coupon Applied"}

                </div>


                <hr />


                {/* COUPON LIST */}

                <div className="coupon-list">

                  {coupons.map((c) => (

                    <div
                      className="coupon-list-item"
                      key={c.code}
                    >

                      <span className="coupon-check">
                        %
                      </span>


                      <div className="coupon-list-text">

                        <div className="coupon-code">
                          {c.code}
                        </div>

                        <div className="coupon-label">
                          {c.title}
                        </div>

                      </div>


                      <button
                        className="coupon-apply-btn"
                        onClick={() =>
                          handleApplyCoupon(c.code)
                        }
                      >
                        Apply
                      </button>

                    </div>

                  ))}

                </div>

              </div>


              {/* =================================================
                  ORDER SUMMARY
              ================================================== */}

              <div className="cart-summary">

                <h3>
                  Order Summary
                </h3>


                {/* SUBTOTAL */}

                <div className="summary-row">

                  <span>
                    Subtotal
                  </span>

                  <span>
                    {formatPrice(itemsPrice)}
                  </span>

                </div>


                {/* SHIPPING */}

                <div className="summary-row">

                  <span>
                    Shipping
                  </span>

                  <span>

                    {shipping === 0
                      ? "Free Delivery"
                      : formatPrice(shipping)}

                  </span>

                </div>


                {/* GST */}

                <div className="summary-row">

                  <span>
                    GST (5%)
                  </span>

                  <span>
                    {formatPrice(gst)}
                  </span>

                </div>


                {/* COUPON */}

                {appliedCoupon && (

                  <>

                    <div className="summary-row">

                      <span>
                        Coupon
                      </span>


                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >

                        <span
                          style={{
                            color: "green",
                            fontWeight: "600",
                          }}
                        >
                          {appliedCoupon.code}
                        </span>


                        <button
                          className="remove-coupon-btn"
                          onClick={handleRemoveCoupon}
                        >
                          Remove
                        </button>

                      </div>

                    </div>


                    <div className="summary-row">

                      <span>
                        Coupon Discount
                      </span>


                      <span
                        style={{
                          color: "green",
                          fontWeight: "600",
                        }}
                      >
                        -{formatPrice(discount)}
                      </span>

                    </div>

                  </>

                )}


                <hr />


                {/* TOTAL */}

                <div className="summary-row total">

                  <span>
                    Order Total
                  </span>

                  <span>
                    {formatPrice(grandTotal)}
                  </span>

                </div>


                {/* CHECKOUT */}

                <button
                  className="btn-secure-checkout"
                  onClick={handlePlaceOrder}
                >
                  🔒 Secure Checkout
                </button>

              </div>

            </div>

          </div>

        </>

      )}

    </div>
  );
};


export default CartPage;