const express = require('express');
const router = express.Router();
const {
  getHeroBanners,
  getHeroBannerById,
  createHeroBanner,
  updateHeroBanner,
  deleteHeroBanner,
  toggleHeroBannerStatus
} = require('../controllers/heroBannerController');

const heroBannerUpload = require('../middleware/heroBannerUpload.middleware');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Public – frontend can read banners
router.get('/', getHeroBanners);
router.get('/:id', getHeroBannerById);

// Admin only — multipart/form-data with an "image" file field
router.post('/', protect, adminOnly, heroBannerUpload, createHeroBanner);
router.put('/:id', protect, adminOnly, heroBannerUpload, updateHeroBanner);
router.patch('/:id', protect, adminOnly, toggleHeroBannerStatus);
router.delete('/:id', protect, adminOnly, deleteHeroBanner);

module.exports = router;