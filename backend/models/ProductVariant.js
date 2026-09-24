const mongoose = require('mongoose');

// ============================================================
// ProductVariant — one document per size of a TextileProduct.
//
// FIX (purchase date / manufacture date not showing):
// createTextileProduct and updateTextileVariant were already writing
// variant.purchaseDate / variant.manufacturingDate, but these two fields
// were never declared in THIS schema — they only existed (unused) on
// TextileProduct. Mongoose strict mode silently drops undeclared fields,
// so the dates were discarded on save and came back blank everywhere
// (edit form, PDF, Excel). Declaring them here is the whole fix.
// ============================================================
const productVariantSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TextileProduct',
      required: true,
      index: true
    },

    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    barcode: {
      type: String,
      trim: true
    },

    size: {
      type: String,
      required: true,
      trim: true
    },

    quantity: {
      type: Number,
      default: 0,
      min: 0
    },

    stockAvailable: {
      type: Number,
      default: 0,
      min: 0
    },

    purchasePrice: {
      type: Number,
      default: 0,
      min: 0
    },

    wholesalePrice: {
      type: Number,
      default: 0,
      min: 0
    },

    retailPrice: {
      type: Number,
      default: 0,
      min: 0
    },

    mrp: {
      type: Number,
      default: 0,
      min: 0
    },

    gst: {
      type: Number,
      default: 0,
      min: 0,
      max: 28
    },

    // 👇 THE TWO MISSING FIELDS — this is the fix
    purchaseDate: {
      type: Date
    },

    manufacturingDate: {
      type: Date
    },

    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier'
    },

    supplierName: {
      type: String,
      trim: true,
      default: ''
    },

    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse'
    },

    warehouseName: {
      type: String,
      trim: true,
      default: ''
    },

    rackLocation: {
      type: String,
      trim: true,
      default: ''
    },

    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'DELETED'],
      default: 'ACTIVE'
    },

    deletedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProductVariant', productVariantSchema);