const asyncHandler = require("express-async-handler");

const Review = require("../models/Review");
const TextileProduct = require("../models/TextileProduct");
const ProductVariant = require("../models/ProductVariant");
const Order = require("../models/Order");

// ---------------------------------------------------------------
// Helper — recalculate product's averageRating / totalReviews
// ---------------------------------------------------------------
const updateProductRating = async (productId) => {
    const reviews = await Review.find({
        product: productId,
        status: "Approved"
    });

    const totalReviews = reviews.length;
    const averageRating =
        totalReviews === 0
            ? 0
            : reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

    await TextileProduct.findByIdAndUpdate(productId, {
        averageRating,
        totalReviews
    });
};

// ---------------------------------------------------------------
// Helper — resolve a product/variant id to a TextileProduct
// ---------------------------------------------------------------
const resolveProduct = async (id) => {
    let textileProduct = await TextileProduct.findById(id);
    if (!textileProduct) {
        const variant = await ProductVariant.findById(id);
        if (variant) {
            textileProduct = await TextileProduct.findById(variant.productId);
        }
    }
    return textileProduct;
};

// ---------------------------------------------------------------
// POST /api/reviews  (User OR Admin)
//
// FIX: Admin was hitting this route and getting "Only customers who
// purchased this product can review it" (line 81) because the old
// code threw an error at line 16 for admins, and a later version
// removed that early throw but still ran the purchase check.
//
// Now: if the logged-in user is an admin, we skip the purchase check
// entirely and auto-approve the review — same logic as the dedicated
// POST /api/reviews/admin route, just applied here too so the
// frontend doesn't need any changes.
// ---------------------------------------------------------------
const createReview = asyncHandler(async (req, res) => {
    const { product, rating, title, comment, customerName } = req.body;

    if (!product || !rating || !comment) {
        res.status(400);
        throw new Error("Product, rating and comment are required");
    }
    if (rating < 1 || rating > 5) {
        res.status(400);
        throw new Error("Rating must be between 1 and 5");
    }

    const textileProduct = await resolveProduct(product);
    if (!textileProduct) {
        res.status(404);
        throw new Error(`Product not found (received: ${JSON.stringify(product)})`);
    }

    // Check for duplicate — applies to both admins and customers
    const already = await Review.findOne({
        product: textileProduct._id,
        user: req.user._id
    });
    if (already) {
        res.status(400);
        throw new Error("You have already reviewed this product");
    }


    if (req.user.isAdmin) {
        let review;
        try {
            review = await Review.create({
                product: textileProduct._id,
                user: req.user._id,
                customerName: customerName?.trim() || req.user.name,
                rating,
                title,
                comment,
                verifiedPurchase: false,
                status: "Approved"
            });
        } catch (err) {
            if (err.code === 11000) {
                res.status(400);
                throw new Error("You have already reviewed this product");
            }
            throw err;
        }

        await updateProductRating(textileProduct._id);
        return res.status(201).json(review);
    }


    const variantIds = await ProductVariant.find({
        productId: textileProduct._id
    }).distinct("_id");

    const candidateIds = [textileProduct._id, ...variantIds];

    const hasPurchased = await Order.findOne({
        user: req.user._id,
        $or: [
            { isPaid: true },
            { isDelivered: true },
            { status: "Delivered" }
        ],
        "orderItems.product": { $in: candidateIds }
    });

    // Create review
    const review = await Review.create({
        product: textileProduct._id,
        user: req.user._id,
        customerName: req.user.name,
        rating,
        title,
        comment,
        verifiedPurchase: !!hasPurchased, // true if purchased, false otherwise
        status: "Pending"
    });

    res.status(201).json(review);
});

// ---------------------------------------------------------------
// POST /api/reviews/admin  (Admin only) — explicit admin route
// kept for completeness; createReview above now handles admins too
// so both routes work correctly regardless of which one the
// frontend calls.
// ---------------------------------------------------------------
const createAdminReview = asyncHandler(async (req, res) => {
    const { product, rating, title, comment, customerName } = req.body;

    if (!product || !rating || !comment) {
        res.status(400);
        throw new Error("Product, rating and comment are required");
    }
    if (rating < 1 || rating > 5) {
        res.status(400);
        throw new Error("Rating must be between 1 and 5");
    }

    const textileProduct = await resolveProduct(product);
    if (!textileProduct) {
        res.status(404);
        throw new Error(`Product not found (received: ${JSON.stringify(product)})`);
    }

    const already = await Review.findOne({
        product: textileProduct._id,
        user: req.user._id
    });
    if (already) {
        res.status(400);
        throw new Error("You have already reviewed this product");
    }

    let review;
    try {
        review = await Review.create({
            product: textileProduct._id,
            user: req.user._id,
            customerName: customerName?.trim() || req.user.name,
            rating,
            title,
            comment,
            verifiedPurchase: false,
            status: "Approved"
        });
    } catch (err) {
        if (err.code === 11000) {
            res.status(400);
            throw new Error("You have already reviewed this product");
        }
        throw err;
    }

    await updateProductRating(textileProduct._id);
    res.status(201).json(review);
});

// ---------------------------------------------------------------
// GET /api/reviews/product/:productId  (Public) — approved reviews
// ---------------------------------------------------------------
const getProductReviews = asyncHandler(async (req, res) => {

    const reviews = await Review.find({
        product: req.params.productId,
        status: "Approved"
    });


    res.json(reviews);
});

// ---------------------------------------------------------------
// GET /api/reviews/my  (User) — my reviews, any status
// ---------------------------------------------------------------
const getMyReviews = asyncHandler(async (req, res) => {
    const reviews = await Review.find({ user: req.user._id })
        .populate("product", "name images")
        .sort({ createdAt: -1 });

    res.json(reviews);
});

// ---------------------------------------------------------------
// GET /api/reviews/admin  (Admin) — all reviews for moderation
const getAllReviews = async (req, res) => {
  try {

    const reviews = await Review.find()
      .populate("product")
      .populate("user")
      .sort({ createdAt: -1 });


    return res.status(200).json({
      success: true,
      data: reviews
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ---------------------------------------------------------------
// PUT /api/reviews/approve/:id  (Admin)
// ---------------------------------------------------------------
const approveReview = asyncHandler(async (req, res) => {
    const review = await Review.findById(req.params.id);
    if (!review) {
        res.status(404);
        throw new Error("Review not found");
    }

    review.status = "Approved";
    await review.save();
    await updateProductRating(review.product);

    res.json(review);
});

// ---------------------------------------------------------------
// PUT /api/reviews/reject/:id  (Admin)
// ---------------------------------------------------------------
const rejectReview = asyncHandler(async (req, res) => {
    const review = await Review.findById(req.params.id);
    if (!review) {
        res.status(404);
        throw new Error("Review not found");
    }

    review.status = "Rejected";
    await review.save();
    await updateProductRating(review.product);

    res.json(review);
});

// ---------------------------------------------------------------
// PUT /api/reviews/reply/:id  (Admin)
// ---------------------------------------------------------------
const replyReview = asyncHandler(async (req, res) => {
    const review = await Review.findById(req.params.id);
    if (!review) {
        res.status(404);
        throw new Error("Review not found");
    }

    review.adminReply = req.body.reply;
    await review.save();

    res.json(review);
});

// ---------------------------------------------------------------
// DELETE /api/reviews/:id  (Admin)
// ---------------------------------------------------------------
const deleteReview = asyncHandler(async (req, res) => {
    const review = await Review.findById(req.params.id);
    if (!review) {
        res.status(404);
        throw new Error("Review not found");
    }

    const productId = review.product;
    await review.deleteOne();
    await updateProductRating(productId);

    res.json({ message: "Review Deleted" });
});

module.exports = {
    createReview,
    createAdminReview,
    getProductReviews,
    getMyReviews,
    getAllReviews,
    approveReview,
    rejectReview,
    replyReview,
    deleteReview
};