const express = require('express');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  createTextileProduct,
  listTextileProducts,
  getTextileProduct,
  getStorefrontTextileProduct,
  updateTextileProduct,
  updateTextileVariant,
  deleteTextileProduct,
  deleteTextileVariant,
  getTextileFilters,
  getProductsCreatedByStats,
  downloadProductsCreatedByExcel,
  downloadProductsPdf
} = require('../controllers/textileProductController');

const router = express.Router();

  router.get('/textile-filters', getTextileFilters);
  router.get('/textile-created-by-stats', protect, adminOnly, getProductsCreatedByStats);
  router.get('/textile-created-by-download', protect, adminOnly, downloadProductsCreatedByExcel);
  // NEW — must stay above router.route('/:id') below, same reason the
  // routes above it do: Express matches top-to-bottom, and '/:id' would
  // otherwise swallow this path and try to cast the literal string
  // "textile-products-download-pdf" as a Mongo ObjectId (the exact error
  // you hit before this route existed).
  router.get('/textile-products-download-pdf', protect, adminOnly, downloadProductsPdf);


router
  .route('/textile')
  .get(listTextileProducts)
  .post(protect, adminOnly, createTextileProduct);

router
  .route('/textile/variants/:variantId')
  .put(protect, adminOnly, updateTextileVariant)
  .delete(protect, adminOnly, deleteTextileVariant);

router.get('/textile-store/:id', getStorefrontTextileProduct);

router
  .route('/textile/:id')
  .get(protect, adminOnly, getTextileProduct)
  .put(protect, adminOnly, updateTextileProduct)
  .delete(protect, adminOnly, deleteTextileProduct);

router
  .route('/')
  .get(getProducts)
  .post(protect, adminOnly, createProduct);

router
  .route('/:id')
  .get(getProductById)
  .put(protect, adminOnly, updateProduct)
  .delete(protect, adminOnly, deleteProduct);


module.exports = router;