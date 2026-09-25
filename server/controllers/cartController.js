const mongoose = require("mongoose");

const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Customization = require("../models/Customization");

const addToCart = async (req, res) => {
  try {
    const {
      product,
      customization,
      size,
      color,
      quantity,
    } = req.body;

    if (!product || !size || !color) {
      return res.status(400).json({
        message:
          "Product, size and color are required",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(product)
    ) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    if (
      customization &&
      !mongoose.Types.ObjectId.isValid(
        customization
      )
    ) {
      return res.status(400).json({
        message: "Invalid customization ID",
      });
    }

    const requestedQuantity =
      quantity ?? 1;

    if (
      !Number.isInteger(
        requestedQuantity
      ) ||
      requestedQuantity < 1
    ) {
      return res.status(400).json({
        message:
          "Quantity must be a positive integer",
      });
    }

    const productData =
      await Product.findOne({
        _id: product,
        isActive: true,
      });

    if (!productData) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    if (
      !productData.sizes.includes(size)
    ) {
      return res.status(400).json({
        message:
          "Selected size is not available",
      });
    }

    const selectedVariant =
      productData.variants.find(
        (variant) =>
          variant.color.toLowerCase() ===
          color.toLowerCase()
      );

    if (!selectedVariant) {
      return res.status(400).json({
        message:
          "Selected color is not available",
      });
    }

    if (customization) {
      const customizationData =
        await Customization.findOne({
          _id: customization,
          user: req.user.userId,
          product: product,
        });

      if (!customizationData) {
        return res.status(404).json({
          message:
            "Customization not found",
        });
      }
    }

    let cart = await Cart.findOne({
      user: req.user.userId,
    });

    if (!cart) {
      cart = new Cart({
        user: req.user.userId,
        items: [],
        totalAmount: 0,
      });
    }

    const existingItem =
      cart.items.find((item) => {
        const sameProduct =
          item.product.toString() ===
          product;

        const sameSize =
          item.size === size;

        const sameColor =
          item.color.toLowerCase() ===
          color.toLowerCase();

        const existingCustomization =
          item.customization
            ? item.customization.toString()
            : null;

        const newCustomization =
          customization || null;

        const sameCustomization =
          existingCustomization ===
          newCustomization;

        return (
          sameProduct &&
          sameSize &&
          sameColor &&
          sameCustomization
        );
      });

    if (existingItem) {
      const newQuantity =
        existingItem.quantity +
        requestedQuantity;

      if (
        newQuantity >
        productData.stock
      ) {
        return res.status(400).json({
          message: "Insufficient stock",
        });
      }

      existingItem.quantity =
        newQuantity;
    } else {
      if (
        requestedQuantity >
        productData.stock
      ) {
        return res.status(400).json({
          message: "Insufficient stock",
        });
      }

      cart.items.push({
        product,
        customization:
          customization || undefined,
        size,
        color:
          selectedVariant.color,
        quantity:
          requestedQuantity,
        price: productData.price,
      });
    }

    cart.totalAmount =
      cart.items.reduce(
        (total, item) =>
          total +
          item.price *
            item.quantity,
        0
      );

    await cart.save();

    const updatedCart =
      await Cart.findById(cart._id)
        .populate("items.product")
        .populate(
          "items.customization"
        );

    return res.status(200).json({
      message:
        "Product added to cart",
      cart: updatedCart,
    });
  } catch (error) {
    console.error(
      "Add to cart error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const getCart = async (req, res) => {
  try {
    const cart =
      await Cart.findOne({
        user: req.user.userId,
      })
        .populate("items.product")
        .populate(
          "items.customization"
        );

    if (!cart) {
      return res.status(200).json({
        cart: {
          items: [],
          totalAmount: 0,
        },
      });
    }

    return res.status(200).json({
      cart,
    });
  } catch (error) {
    console.error(
      "Get cart error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const updateCartItem = async (
  req,
  res
) => {
  try {
    const { quantity } =
      req.body;

    if (
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      return res.status(400).json({
        message:
          "Quantity must be a positive integer",
      });
    }

    const cart =
      await Cart.findOne({
        user: req.user.userId,
      });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found",
      });
    }

    const item =
      cart.items.id(
        req.params.itemId
      );

    if (!item) {
      return res.status(404).json({
        message:
          "Cart item not found",
      });
    }

    const product =
      await Product.findOne({
        _id: item.product,
        isActive: true,
      });

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    if (
      quantity >
      product.stock
    ) {
      return res.status(400).json({
        message:
          "Insufficient stock",
      });
    }

    item.quantity =
      quantity;

    cart.totalAmount =
      cart.items.reduce(
        (total, cartItem) =>
          total +
          cartItem.price *
            cartItem.quantity,
        0
      );

    await cart.save();

    const updatedCart =
      await Cart.findById(
        cart._id
      )
        .populate("items.product")
        .populate(
          "items.customization"
        );

    return res.status(200).json({
      message:
        "Cart updated successfully",
      cart: updatedCart,
    });
  } catch (error) {
    console.error(
      "Update cart error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const removeFromCart = async (
  req,
  res
) => {
  try {
    const cart =
      await Cart.findOne({
        user: req.user.userId,
      });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found",
      });
    }

    const item =
      cart.items.id(
        req.params.itemId
      );

    if (!item) {
      return res.status(404).json({
        message:
          "Cart item not found",
      });
    }

    item.deleteOne();

    cart.totalAmount =
      cart.items.reduce(
        (total, cartItem) =>
          total +
          cartItem.price *
            cartItem.quantity,
        0
      );

    await cart.save();

    const updatedCart =
      await Cart.findById(
        cart._id
      )
        .populate("items.product")
        .populate(
          "items.customization"
        );

    return res.status(200).json({
      message:
        "Item removed from cart",
      cart: updatedCart,
    });
  } catch (error) {
    console.error(
      "Remove cart item error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const clearCart = async (
  req,
  res
) => {
  try {
    const cart =
      await Cart.findOne({
        user: req.user.userId,
      });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found",
      });
    }

    cart.items = [];
    cart.totalAmount = 0;

    await cart.save();

    return res.status(200).json({
      message:
        "Cart cleared successfully",
      cart,
    });
  } catch (error) {
    console.error(
      "Clear cart error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};