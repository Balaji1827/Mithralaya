import api from './api';

export const getCart = async () => {
  const { data } = await api.get('/cart');
  return data;
};

export const addToCart = async (payload) => {
  const { data } = await api.post('/cart', payload);
  return data;
};

export const updateCartItem = async (payload) => {
  const { data } = await api.put('/cart', payload);
  return data;
};

export const clearCart = async () => {
  const { data } = await api.delete('/cart');
  return data;
};

// ============================================================
// Razorpay online payment — ONLY payment path (no Cash on Delivery).
//
// Flow:
//   1. createRazorpayOrder({ addressId, discount }) → backend creates a
//      Razorpay order for the current cart total and returns the info
//      needed to open Razorpay Checkout (razorpayOrderId, amount, keyId).
//   2. Razorpay Checkout modal collects the payment.
//   3. On success, verifyRazorpayPayment(...) sends the payment
//      id/order id/signature to the backend, which verifies the
//      signature and ONLY THEN creates the actual Order.
// ============================================================
export const createRazorpayOrder = async (payload) => {
  const { data } = await api.post('/orders/razorpay/order', payload);
  return data;
};

export const verifyRazorpayPayment = async (payload) => {
  const { data } = await api.post('/orders/razorpay/verify', payload);
  return data;
};

export const getMyOrders = async () => {
  const { data } = await api.get('/orders/myorders');
  return data;
};

export const getAllOrders = async (params = {}) => {
  const { data } = await api.get('/orders', { params });
  return data;
};

export const updateOrderStatus = async (id, payload) => {
  const { data } = await api.put(`/orders/${id}`, payload);
  return data;
};

export const cancelOrder = async (id, reason) => {
  const { data } = await api.put(`/orders/${id}/cancel`, { reason });
  return data;
};

export const deleteMyOrder = async (id) => {
  const { data } = await api.delete(`/orders/my/${id}`);
  return data;
};

export const clearMyOrders = async () => {
  const { data } = await api.delete('/orders/my');
  return data;
};

export const deleteOrder = async (id) => {
  const { data } = await api.delete(`/orders/${id}`);
  return data;
};

export const getOrderByOrderId = async (orderId) => {
  const { data } = await api.get(`/orders/track/${orderId}`);
  return data;
};

export const downloadOrdersExcel = async (params = {}) => {
  const response = await api.get('/orders/download', {
    params,
    responseType: 'blob'
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'orders.xlsx');
  document.body.appendChild(link);
  link.click();
  link.remove();
};

// Downloads the "Order Report" PDF (Order ID / Customer / Items / Payment /
// Status / Total / Date). Same blob-download pattern as the Excel export
// above, and accepts the same params (search/date/month) so the PDF export
// matches whatever's currently searched/filtered on screen — mirrors
// downloadProductsPdf's behavior in productService.js.
export const downloadOrdersPdf = async (params = {}) => {
  const response = await api.get('/orders/download-pdf', {
    params,
    responseType: 'blob'
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'orders.pdf');
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};