const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    subtitle: {
      type: String,
      trim: true,
    },

    buttonText: {
      type: String,
      trim: true,
    },

    buttonLink: {
      type: String,
      trim: true,
    },

    leftImage: {
      type: String,
      required: false,
    },

    rightTitle: {
      type: String,
      trim: true,
    },

    rightSubtitle: {
      type: String,
      trim: true,
    },

    rightButtonText: {
      type: String,
      trim: true,
    },

    rightButtonLink: {
      type: String,
      trim: true,
    },

    rightImage: {
      type: String,
      required: false,
    },

    image: {
      type: String,
      required: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

bannerSchema.index({
  isActive: 1,
  displayOrder: 1,
  createdAt: -1,
});

const Banner = mongoose.model(
  "Banner",
  bannerSchema
);

module.exports = Banner;