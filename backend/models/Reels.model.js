const mongoose = require('mongoose');

const reelSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: ""
    },

    video: {
      type: String,
      required: [true, "Video is required"]
    },

    thumbnail: {
      type: String,
      default: ""
    },

    views: {
      type: Number,
      default: 0
    },

    order: {
      type: Number,
      default: 0
    },

    isActive: {
      type: Boolean,
      default: true
    },

    link: {
      type: String,
      default: "/"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Reel', reelSchema);