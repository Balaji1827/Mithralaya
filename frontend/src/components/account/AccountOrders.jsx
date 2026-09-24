import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getMyOrders,
  cancelOrder,
  deleteMyOrder,
  clearMyOrders
} from '../../services/orderService';
import '../../css/userOrders.css';
import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import QRCode from 'qrcode';

const STATUS_STEPS = [
  { key: 'Placed', label: 'Order Placed' },
  { key: 'Processing', label: 'Processing' },
  { key: 'Shipped', label: 'Shipped' },
  { key: 'Delivered', label: 'Delivered' }
];

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

// 🔹 Simple ETA logic
const getEstimatedDeliveryDate = (order) => {
  if (order.status === 'Delivered' && order.deliveredAt) {
    return new Date(order.deliveredAt);
  }

  let daysToAdd = 5;
  if (order.status === 'Processing') daysToAdd = 4;
  if (order.status === 'Shipped') daysToAdd = 2;

  const base = new Date(order.createdAt);
  base.setDate(base.getDate() + daysToAdd);
  return base;
};

const AccountOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // cancel state
  const [cancelOrderId, setCancelOrderId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const navigate = useNavigate();

  const loadOrders = async () => {
    try {
      const data = await getMyOrders();
      const sorted = data.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setOrders(sorted);
    } catch (err) {
      console.error(err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const openCancelForm = (orderId) => {
    setCancelOrderId(orderId);
    setCancelReason('');
  };

  const closeCancelForm = () => {
    setCancelOrderId(null);
    setCancelReason('');
  };

  const handleSubmitCancel = async (orderId) => {
    if (!cancelReason.trim()) {
      alert('Please tell us why you are cancelling this order.');
      return;
    }
    setCancelling(true);
    try {
      await cancelOrder(orderId, cancelReason.trim());
      await loadOrders();
      closeCancelForm();
    } catch (err) {
      console.error(err);
      alert('Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  // ✅ Delete a single order from history
  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Delete this order from your history?')) return;
    try {
      await deleteMyOrder(orderId);
      setOrders((prev) => prev.filter((o) => o._id !== orderId));
    } catch (err) {
      console.error(err);
      alert('Failed to delete this order');
    }
  };

  // ✅ Delete entire order history
  const handleClearHistory = async () => {
    if (
      !window.confirm(
        'Delete your entire order history? This action cannot be undone.'
      )
    ) {
      return;
    }
    try {
      await clearMyOrders();
      setOrders([]);
    } catch (err) {
      console.error(err);
      alert('Failed to delete order history');
    }
  };

  // ✅ Download invoice PDF
  const downloadInvoice = async (order) => {
    if (!order) return;

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    /* ---------------- HEADER ---------------- */
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('MetroMensWear', pageWidth - 15, 22, { align: 'right' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Order Invoice', pageWidth - 15, 28, { align: 'right' });
    doc.text('metromenswear01@gmail.com', pageWidth - 15, 34, { align: 'right' });

    doc.setDrawColor(220);
    doc.line(15, 48, pageWidth - 15, 48);

    /* ---------------- ORDER INFO ---------------- */
    doc.setFontSize(10);
    doc.text(`Invoice No: ${order.orderId || order._id}`, 15, 58);
    doc.text(`Order Date: ${formatDate(order.createdAt)}`, 15, 64);
    doc.text(`Status: ${order.status}`, 15, 70);

    /* ---------------- SHIPPING ADDRESS ---------------- */
    const address = order.shippingAddress || {};

    doc.setFont('helvetica', 'bold');
    doc.text('Shipping Address', 15, 82);

    doc.setFont('helvetica', 'normal');
    doc.text(
      [
        address.fullName,
        address.addressLine1,
        address.addressLine2,
        `${address.city}, ${address.state} - ${address.pincode}`,
        `Phone: ${address.mobile || address.phone}`
      ].filter(Boolean),
      15,
      88
    );

    /* ---------------- QR CODE ---------------- */
    
    const qrText = `Order ID: ${order.orderId || order._id}`;
    const qrDataUrl = await QRCode.toDataURL(qrText);

    doc.addImage(qrDataUrl, 'PNG', pageWidth - 45, 82, 30, 30);

    /* ---------------- ITEMS TABLE ---------------- */
    const tableBody = (order.orderItems || []).map((item, i) => [
      i + 1,
      item.name,
      item.qty,
      `₹${item.price}`,
      `₹${item.qty * item.price}`
    ]);

    autoTable(doc, {
      startY: 125,
      head: [['#', 'Item', 'Qty', 'Price', 'Total']],
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 10,
        cellPadding: 6
      },
      columnStyles: {
        0: { cellWidth: 10 },
        2: { cellWidth: 20 },
        3: { cellWidth: 25 },
        4: { cellWidth: 30 }
      }
    });

    /* ---------------- PRICE SUMMARY ---------------- */
    const finalY = doc.lastAutoTable.finalY + 10;

    autoTable(doc, {
      startY: finalY,
      body: [
        ['Items Price', `₹${order.itemsPrice || 0}`],
        ['Shipping', `₹${order.shippingPrice || 0}`],
        ['GST', `₹${order.taxPrice || 0}`],
        [
          { content: 'Grand Total', styles: { fontStyle: 'bold' } },
          { content: `₹${order.totalPrice}`, styles: { fontStyle: 'bold' } }
        ]
      ],
      theme: 'plain',
      styles: {
        fontSize: 11,
        cellPadding: 4
      },
      columnStyles: {
        0: { halign: 'right' },
        1: { halign: 'right' }
      },
      margin: { left: pageWidth - 90 }
    });

    /* ---------------- FOOTER ---------------- */
    const footerY = doc.internal.pageSize.getHeight() - 20;

    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(
      'Thank you for shopping with MetroMensWear !!!',
      pageWidth / 2,
      footerY,
      { align: 'center' }
    );
    doc.text(
      "This is a system-generated invoice.",
      pageWidth / 2,
      290,
      { align: "center" }
    );

    doc.save(`Invoice_${order.orderId || order._id}.pdf`);
  };
  if (loading) {
    return <div className="user-section-loading">Loading orders…</div>;
  }

  if (error) {
    return <div className="user-empty-state">{error}</div>;
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="user-card-block">
        <div className="user-empty-state">
          <div className="no-order-wrapper">
            <div className="no-order-top-bg"></div>

            <div className="no-order-card">
              <img
                src="https://images.vexels.com/media/users/3/146451/isolated/preview/d03c9de18db226a823d5adb337782f89-open-box-with-package-signs.png"
                alt="No orders"
                className="no-order-img"
              />

              <h2>NO ORDER FOUND</h2>
              <p>Looks like you haven’t made your order yet</p>

              <button className="no-order-btn" onClick={() => navigate("/products")}>
                Browse Products
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-list-wrapper">
      {/* ✅ Header with delete history button */}
      <div className="orders-list-header">
        <h2>My Orders</h2>
        {orders.length > 0 && (
          <button
            type="button"
            className="order-history-delete-btn"
            onClick={handleClearHistory}
          >
            Delete Order History
          </button>
        )}
      </div>

      {orders.map((order) => {
        const currentStepIndex = STATUS_STEPS.findIndex(
          (s) => s.key === order.status
        );
        const isCancelled = order.status === 'Cancelled';
        const etaDate = getEstimatedDeliveryDate(order);

        const items = order.orderItems || [];
        const firstItem = items[0];

        return (
          <div key={order._id} className="order-card">
            <div className="order-card-header">
              <div>
                <div className="order-id">
                  Order ID: {order.orderId || order._id}
                  {' '}
                  {/* <a
                    href={`/track-order?orderId=${encodeURIComponent(
                      order.orderId || order._id
                    )}`}
                    className="order-track-link"
                    style={{ marginLeft: 8 }}
                  >
                    Track
                  </a> */}
                  <button onClick={() => downloadInvoice(order)} className="btn-order-invoice">
                    Download Invoice
                  </button>
                </div>

                <div className="order-date">
                  Placed on {formatDate(order.createdAt)}
                </div>
              </div>
              <div className="order-summary-right">
                <div className="order-total">Grand Total: ₹{order.totalPrice}</div>
                <div className="order-status-text">
                  {isCancelled ? 'Cancelled' : order.status}
                </div>
              </div>
            </div>

            {/* ✅ Product items preview */}
            {firstItem && (
              <div className="order-items-preview">
                <div className="order-item-main">
                  <div className="order-item-image-wrap">
                    <img
                      src={
                        firstItem.image ||
                        firstItem.product?.images?.[0] ||
                        ''
                      }
                      alt={firstItem.name || firstItem.product?.name || 'Product'}
                      className="order-item-image"
                    />
                  </div>
                  <div className="order-item-info">
                    <div className="order-item-name">
                      {firstItem.name || firstItem.product?.name}
                    </div>
                    <div className="order-item-meta">
                      {firstItem.size && <span>Size: {firstItem.size}</span>}
                      {firstItem.color && <span>Color: {firstItem.color}</span>}
                    </div>
                    <div className="order-item-qty">
                      Qty: {firstItem.qty}
                    </div>
                  </div>
                </div>

                {items.length > 1 && (
                  <div className="order-item-more">
                    + {items.length - 1} more item
                    {items.length - 1 > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            )}

            {/* 🔹 Timeline / Stepper */}
            <div className={`order-tracker ${isCancelled ? 'cancelled' : ''}`}>
              {STATUS_STEPS.map((step, idx) => {
                const isCompleted = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;

                const stepClass = [
                  'order-step',
                  `step-${step.key.toLowerCase()}`,
                  isCompleted ? 'completed' : '',
                  isCurrent ? 'current' : ''
                ]
                  .join(' ')
                  .trim();

                return (
                  <div key={step.key} className={stepClass}>
                    <div className="step-circle">
                      {isCompleted ? '✓' : idx + 1}
                    </div>
                    <div className="step-label">{step.label}</div>

                    {/* Extra info below labels */}
                    {step.key === 'Placed' && (
                      <div className="step-meta">
                        {formatDate(order.createdAt)}
                      </div>
                    )}

                    {step.key === 'Delivered' && (
                      <div className="step-meta">
                        {order.status === 'Delivered' && order.deliveredAt ? (
                          <>Delivered on {formatDate(order.deliveredAt)}</>
                        ) : (
                          <>Est. delivery by {formatDate(etaDate.toISOString())}</>
                        )}
                      </div>
                    )}

                  </div>

                );
              })}
            </div>

            {/* 🔹 Cancel info & action + delete button */}
            <div className="order-footer">
              {isCancelled && order.cancelReason && (
                <div className="order-cancel-reason">
                  <strong>Cancelled:</strong> {order.cancelReason}
                </div>
              )}

              <div className="order-footer-actions">
                {/* User can cancel if not cancelled / delivered / shipped */}
                {!isCancelled &&
                  order.status !== 'Delivered' &&
                  order.status !== 'Shipped' && (
                    <div className="order-actions">
                      {cancelOrderId === order._id ? (
                        <div className="cancel-form">
                          <label className="cancel-label">
                            Reason for cancellation
                          </label>
                          <textarea
                            className="cancel-textarea"
                            value={cancelReason}
                            onChange={(e) =>
                              setCancelReason(e.target.value)
                            }
                            rows={3}
                            placeholder="Tell us what went wrong..."
                          />
                          <div className="cancel-buttons">
                            <button
                              type="button"
                              className="cancel-btn-light"
                              onClick={closeCancelForm}
                              disabled={cancelling}
                            >
                              Close
                            </button>
                            <button
                              type="button"
                              className="cancel-btn-primary"
                              onClick={() => handleSubmitCancel(order._id)}
                              disabled={cancelling}
                            >
                              {cancelling ? 'Cancelling…' : 'Confirm Cancel'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="cancel-btn-link"
                          onClick={() => openCancelForm(order._id)}
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  )}

                {/* ✅ Delete single order record */}
                <button
                  type="button"
                  className="order-delete-btn"
                  onClick={() => handleDeleteOrder(order._id)}
                >
                  Delete Record
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AccountOrders;
