const mongoose = require('mongoose');

// NOTE: purchaseDate / manufacturingDate were REMOVED from this schema.
// They were never read or written at the product level anywhere in the
// controller — the real per-size dates live on ProductVariant (where the
// fields have now been added). Keeping them here only caused confusion.
const textileProductSchema = new mongoose.Schema(
  {
    name: String,
    slug: String,

    category: String,
    subCategory: String,
    productType: String,
    sleeveOrStyle: String,

    material: String,
    brand: String,

    description: String,

    color: String,
    colors: [String],

    images: [String],

    isNewArrival: Boolean,
    isBestSeller: Boolean,
    isTrending: Boolean,

    status: {
      type: String,
      default: 'ACTIVE'
    },

    averageRating: {
      type: Number,
      default: 0
    },

    totalReviews: {
      type: Number,
      default: 0
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    deletedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('TextileProduct', textileProductSchema);