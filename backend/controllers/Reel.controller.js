const fs = require('fs');
const path = require('path');
const Reel = require('../models/Reels.model');

// helper: turn an uploaded file into a public URL path
const toPublicPath = (file) => `/uploads/reels/${file.filename}`;

// helper: best-effort delete of an old uploaded file when it's replaced/removed
const removeUploadedFile = (publicPath) => {
  if (!publicPath || !publicPath.startsWith('/uploads/reels/')) return;
  const filePath = path.join(__dirname, '..', publicPath);
  fs.unlink(filePath, (err) => {
    if (err && err.code !== 'ENOENT') {
      console.error('Failed to remove old reel file:', err.message);
    }
  });
};

// GET /api/reels
const getReels = async (req, res) => {
  try {
    const reels = await Reel.find().sort({ order: 1 });
    res.json(reels);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch reels', error: err.message });
  }
};

// POST /api/reels  (multipart/form-data — fields: title, order, isActive, link, video, thumbnail)
const createReel = async (req, res) => {
  try {
    const { title, order, isActive, link, views } = req.body;
    const videoFile = req.files?.video?.[0];
    const thumbnailFile = req.files?.thumbnail?.[0];

    if (!videoFile) {
      return res.status(400).json({ message: 'Video file is required' });
    }

    const reel = await Reel.create({
      title,
      video: toPublicPath(videoFile),
      thumbnail: thumbnailFile ? toPublicPath(thumbnailFile) : '',
      order,
      isActive,
      link,
      views
    });

    res.status(201).json(reel);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create reel', error: err.message });
  }
};

// PUT /api/reels/:id  (multipart/form-data — video/thumbnail optional, only sent when replaced)
const updateReel = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);

    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    const { title, order, isActive, link, views } = req.body;
    const videoFile = req.files?.video?.[0];
    const thumbnailFile = req.files?.thumbnail?.[0];

    if (title !== undefined) reel.title = title;
    if (order !== undefined) reel.order = order;
    if (isActive !== undefined) reel.isActive = isActive === 'true' || isActive === true;
    if (link !== undefined) reel.link = link;
    if (views !== undefined) reel.views = views;

    if (videoFile) {
      removeUploadedFile(reel.video);
      reel.video = toPublicPath(videoFile);
    }

    if (thumbnailFile) {
      removeUploadedFile(reel.thumbnail);
      reel.thumbnail = toPublicPath(thumbnailFile);
    }

    const updated = await reel.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update reel', error: err.message });
  }
};

// PATCH /api/reels/:id  (used for the quick active/inactive toggle, or any partial JSON update)
const patchReel = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);

    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    Object.assign(reel, req.body);
    const updated = await reel.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update reel', error: err.message });
  }
};

// DELETE /api/reels/:id
const deleteReel = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);

    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    removeUploadedFile(reel.video);
    removeUploadedFile(reel.thumbnail);

    await reel.deleteOne();
    res.json({ message: 'Reel deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete reel', error: err.message });
  }
};

module.exports = {
  getReels,
  createReel,
  updateReel,
  patchReel,
  deleteReel
};