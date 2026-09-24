const express = require('express');
const router = express.Router();
const reelUpload = require('../middleware/Reelupload.middleware');
const {
  getReels,
  createReel,
  updateReel,
  patchReel,
  deleteReel
} = require('../controllers/Reel.controller');

router.route('/')
  .get(getReels)
  .post(reelUpload, createReel);

router.route('/:id')
  .put(reelUpload, updateReel)
  .patch(patchReel)
  .delete(deleteReel);

module.exports = router;