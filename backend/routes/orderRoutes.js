const express = require('express');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  trackOrder,
  cancelOrder,
  deleteMyOrder,
  deleteMyOrderHistory,
  deleteOrder,
  downloadOrdersExcel,
  downloadOrdersPdf
} = require('../controllers/orderController');

const router = express.Router();

// Online payment only (Razorpay) — no Cash on Delivery.
// Step 1: create a Razorpay order for the current cart total.
router.post('/razorpay/order', protect, createRazorpayOrder);
// Step 2: verify the payment signature and, only on success, create the Order.
router.post('/razorpay/verify', protect, verifyRazorpayPayment);

// Public tracking endpoint
router.get('/track/:orderId', trackOrder);
router.get('/myorders', protect, getMyOrders);
router.get('/', protect, adminOnly, getAllOrders);
router.put('/:id', protect, adminOnly, updateOrderStatus);
router.put('/:id/cancel', protect, cancelOrder);
router.delete('/my/:id', protect, deleteMyOrder);
router.delete('/my', protect, deleteMyOrderHistory);
router.delete('/:id', protect, adminOnly, deleteOrder);
router.get('/download', protect, adminOnly, downloadOrdersExcel);
router.get('/download-pdf', protect, adminOnly, downloadOrdersPdf);

module.exports = router;