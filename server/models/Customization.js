const mongoose = require("mongoose");

const customizationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    size: {
      type: String,
      required: true,
      trim: true,
    },

    color: {
      type: String,
      required: true,
      trim: true,
    },

    text: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    textColor: {
      type: String,
      default: "#000000",
      trim: true,
    },

    textPosition: {
      x: {
        type: Number,
        default: 50,
        min: 0,
        max: 100,
      },
      y: {
        type: Number,
        default: 50,
        min: 0,
        max: 100,
      },
    },

    textSize: {
      type: Number,
      default: 24,
      min: 12,
      max: 60,
    },

    textScale: {
      type: Number,
      default: 1,
      min: 0.5,
      max: 2,
    },

    textRotation: {
      type: Number,
      default: 0,
      min: -180,
      max: 180,
    },

    design: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Design",
    },

    designPosition: {
      x: {
        type: Number,
        default: 50,
        min: 0,
        max: 100,
      },
      y: {
        type: Number,
        default: 65,
        min: 0,
        max: 100,
      },
    },

    designSize: {
      width: {
        type: Number,
        default: 100,
        min: 1,
        max: 200,
      },
      height: {
        type: Number,
        default: 100,
        min: 1,
        max: 200,
      },
    },

    designScale: {
      type: Number,
      default: 1,
      min: 0.5,
      max: 2,
    },

    designRotation: {
      type: Number,
      default: 0,
      min: -180,
      max: 180,
    },

    imageUrl: {
      type: String,
      trim: true,
      default: "",
    },

    cloudinaryPublicId: {
      type: String,
      trim: true,
      default: "",
    },

    originalFileName: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Customization = mongoose.model(
  "Customization",
  customizationSchema
);

module.exports = Customization;