const express = require("express");
const router = express.Router();

const {
  createCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  getActiveCoupons,
  applyCoupon,
} = require("../controllers/couponController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");



// Get all active coupons (Public)
router.get("/active", getActiveCoupons);

// Apply coupon (Logged-in User)
router.post("/apply", protect, applyCoupon);


router.post("/", protect, adminOnly, createCoupon);

// Get All Coupons
router.get("/", protect, adminOnly, getCoupons);

// Get Single Coupon
router.get("/:id", protect, adminOnly, getCouponById);

// Update Coupon
router.put("/:id", protect, adminOnly, updateCoupon);

// Delete Coupon
router.delete("/:id", protect, adminOnly, deleteCoupon);

module.exports = router;