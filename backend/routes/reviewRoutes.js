const express = require("express");

const router = express.Router();

const {
    createReview,
    createAdminReview,
    getProductReviews,
    getMyReviews,
    getAllReviews,
    approveReview,
    rejectReview,
    replyReview,
    deleteReview
} = require("../controllers/reviewController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

// ---------- Admin review post ----------
// Must be placed BEFORE router.post("/") so Express matches this
// literal path first, rather than letting "/" catch it.
router.post("/admin", protect, adminOnly, createAdminReview);

// ---------- User ----------
router.post("/", protect, createReview);            // create review (verified purchase)
router.get("/my", protect, getMyReviews);           // my reviews (any status)

// ---------- Public ----------
router.get("/product/:productId", getProductReviews); // approved reviews of a product

// ---------- Admin ----------
router.get("/admin", protect, adminOnly, getAllReviews);
router.put("/approve/:id", protect, adminOnly, approveReview);
router.put("/reject/:id", protect, adminOnly, rejectReview);
router.put("/reply/:id", protect, adminOnly, replyReview);
router.delete("/:id", protect, adminOnly, deleteReview);

module.exports = router;