const mongoose = require("mongoose");

const productVariantSchema = new mongoose.Schema(
  {
    color: {
      type: String,
      required: true,
      trim: true,
    },

    image: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    sizes: [
      {
        type: String,
        trim: true,
      },
    ],

    variants: {
      type: [productVariantSchema],
      default: [],
    },

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    customizable: {
      type: Boolean,
      default: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({
  isActive: 1,
  createdAt: -1,
});

const Product = mongoose.model(
  "Product",
  productSchema
);

module.exports = Product;