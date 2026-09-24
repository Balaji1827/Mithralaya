const fs = require('fs');
const path = require('path');
const HeroBanner = require('../models/HeroBanner');

// helper: turn an uploaded file into a public URL path
const toPublicPath = (file) => `/uploads/hero-banners/${file.filename}`;

// helper: best-effort delete of an old uploaded file when it's replaced/removed
const removeUploadedFile = (publicPath) => {
  if (!publicPath || !publicPath.startsWith('/uploads/hero-banners/')) return;
  const filePath = path.join(__dirname, '..', publicPath);
  fs.unlink(filePath, (err) => {
    if (err && err.code !== 'ENOENT') {
      console.error('Failed to remove old hero banner image:', err.message);
    }
  });
};

// @desc    Get all hero banners
// @route   GET /api/hero-banners
// @access  Public
const getHeroBanners = async (req, res) => {
  try {
    const banners = await HeroBanner.find({}).sort({ order: 1 });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single hero banner
// @route   GET /api/hero-banners/:id
// @access  Public
const getHeroBannerById = async (req, res) => {
  try {
    const banner = await HeroBanner.findById(req.params.id);

    if (banner) {
      res.json(banner);
    } else {
      res.status(404).json({ message: 'Banner not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a hero banner
// @route   POST /api/hero-banners  (multipart/form-data — field: image)
// @access  Private/Admin
const createHeroBanner = async (req, res) => {
  try {
    const { title, subtitle, ctaPrimaryLabel, ctaPrimaryLink, order, isActive } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Banner image is required' });
    }

    const banner = new HeroBanner({
      title,
      subtitle,
      image: toPublicPath(req.file),
      ctaPrimaryLabel,
      ctaPrimaryLink,
      order: order || 0,
      isActive: isActive !== undefined ? isActive === 'true' || isActive === true : true
    });

    const createdBanner = await banner.save();
    res.status(201).json(createdBanner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a hero banner
// @route   PUT /api/hero-banners/:id  (multipart/form-data — image optional)
// @access  Private/Admin
const updateHeroBanner = async (req, res) => {
  try {
    const { title, subtitle, ctaPrimaryLabel, ctaPrimaryLink, order, isActive } = req.body;

    const banner = await HeroBanner.findById(req.params.id);

    if (banner) {
      banner.title = title || banner.title;
      banner.subtitle = subtitle || banner.subtitle;
      banner.ctaPrimaryLabel = ctaPrimaryLabel || banner.ctaPrimaryLabel;
      banner.ctaPrimaryLink = ctaPrimaryLink !== undefined ? ctaPrimaryLink : banner.ctaPrimaryLink;
      banner.order = order !== undefined ? order : banner.order;
      banner.isActive = isActive !== undefined ? (isActive === 'true' || isActive === true) : banner.isActive;

      if (req.file) {
        removeUploadedFile(banner.image);
        banner.image = toPublicPath(req.file);
      }

      const updatedBanner = await banner.save();
      res.json(updatedBanner);
    } else {
      res.status(404).json({ message: 'Banner not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a hero banner
// @route   DELETE /api/hero-banners/:id
// @access  Private/Admin
const deleteHeroBanner = async (req, res) => {
  try {
    const banner = await HeroBanner.findById(req.params.id);

    if (banner) {
      removeUploadedFile(banner.image);
      await banner.deleteOne();
      res.json({ message: 'Banner removed' });
    } else {
      res.status(404).json({ message: 'Banner not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle banner status
// @route   PATCH /api/hero-banners/:id
// @access  Private/Admin
const toggleHeroBannerStatus = async (req, res) => {
  try {
    const banner = await HeroBanner.findById(req.params.id);

    if (banner) {
      banner.isActive = !banner.isActive;
      const updatedBanner = await banner.save();
      res.json(updatedBanner);
    } else {
      res.status(404).json({ message: 'Banner not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getHeroBanners,
  getHeroBannerById,
  createHeroBanner,
  updateHeroBanner,
  deleteHeroBanner,
  toggleHeroBannerStatus
};