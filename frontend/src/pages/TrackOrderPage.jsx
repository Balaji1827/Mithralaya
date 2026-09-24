

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getOrderByOrderId } from '../services/orderService';
import '../css/product.css';

const TrackOrderPage = () => {
  const [orderId, setOrderId] = useState('');
  const [debounced, setDebounced] = useState(orderId);
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // debounce input
  useEffect(() => {
    const t = setTimeout(() => setDebounced(orderId.trim()), 400);
    return () => clearTimeout(t);
  }, [orderId]);

  // Read query param
  const location = useLocation();
  useEffect(() => {
    const q = new URLSearchParams(location.search).get('orderId');
    if (q) setOrderId(q);
  }, [location.search]);

  // Load order tracking data
  useEffect(() => {
    const load = async () => {
      setError(null);
      setTracking(null);
      if (!debounced) return;

      setLoading(true);
      try {
        const data = await getOrderByOrderId(debounced);
        setTracking(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Order not found');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [debounced]);

  // Estimate delivery date logic (same as account page)
  const getEstimatedDeliveryDate = (order) => {
    if (!order) return null;
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

  return (
    <div className="track-page">
      <div className="track-container">
        <h1>Track Your Order</h1>
        <p className="subtitle">Enter your Order ID below to check your order status.</p>

        <input
          type="text"
          placeholder="Example: ORD-20251201-1234"
          className="track-input"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
        />

        {loading && <p className="loading">Fetching tracking details...</p>}
        {error && <p className="error">{error}</p>}

        {tracking && (
          <div className="tracking-wrapper">

            {/* ORDER SUMMARY */}
            <div className="card order-summary">
              <h2>Order Overview</h2>
              <p><strong>Order ID:</strong> {tracking.orderId}</p>
              <p><strong>Status:</strong>
                <span className={`status-badge ${tracking.status.toLowerCase()}`}>
                  {tracking.status}
                </span>
              </p>
              <p><strong>Paid:</strong> {tracking.isPaid ? "Yes" : "No"}</p>
              <p><strong>Delivered:</strong> {tracking.isDelivered ? "Yes" : "No"}</p>
              <p><strong>Order Date:</strong> {new Date(tracking.createdAt).toLocaleString()}</p>
              {tracking.isDelivered && tracking.deliveredAt ? (
                <p><strong>Delivered on:</strong> {new Date(tracking.deliveredAt).toLocaleString()}</p>
              ) : (
                <p><strong>Est. delivery by:</strong> {getEstimatedDeliveryDate(tracking).toLocaleDateString()}</p>
              )}
              <p><strong>Items Price:</strong> ₹{tracking.itemsPrice}</p>
              <p><strong>Shipping Price:</strong> ₹{tracking.shippingPrice}</p>
              <p><strong>GST:</strong> ₹{tracking.taxPrice}</p>
              <p><strong>Grand Total:</strong> ₹{tracking.totalPrice}</p>
            </div>

            {/* ITEMS */}
            <div className="card item-card">
              <h2>Items in Order</h2>
              {tracking.orderItems.map((item, i) => (
                <div key={i} className="item-row">
                  <img src={item.image} alt={item.name} />
                  <div>
                    <h4>{item.name}</h4>
                    <p>Qty: {item.qty}</p>
                    <p>Price: ₹{item.price}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* SHIPPING */}
            {tracking.shippingAddress && (
              <div className="card shipping-card">
                <h2>Shipping Address</h2>
                <p>{tracking.shippingAddress.fullName}</p>
                <p>{tracking.shippingAddress.mobile}, {tracking.shippingAddress.locality}</p>
                <p>{tracking.shippingAddress.city} - {tracking.shippingAddress.pincode}</p>
                <p>{tracking.shippingAddress.state}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackOrderPage;
