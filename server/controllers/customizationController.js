const mongoose = require("mongoose");

const Customization = require("../models/Customization");
const Product = require("../models/Product");
const Design = require("../models/Design");

const isValidNumber = (value) => {
  return typeof value === "number" && Number.isFinite(value);
};

const validatePosition = (position, fieldName) => {
  if (position === undefined) {
    return null;
  }

  if (!position || typeof position !== "object") {
    return `${fieldName} must be an object`;
  }

  const { x, y } = position;

  if (!isValidNumber(x) || !isValidNumber(y)) {
    return `${fieldName} x and y must be valid numbers`;
  }

  if (x < 0 || x > 100 || y < 0 || y > 100) {
    return `${fieldName} x and y must be between 0 and 100`;
  }

  return null;
};

const validateDesignSize = (designSize) => {
  if (designSize === undefined) {
    return null;
  }

  if (!designSize || typeof designSize !== "object") {
    return "Design size must be an object";
  }

  const { width, height } = designSize;

  if (!isValidNumber(width) || !isValidNumber(height)) {
    return "Design size width and height must be valid numbers";
  }

  if (
    width < 1 ||
    width > 200 ||
    height < 1 ||
    height > 200
  ) {
    return "Design size must be between 1 and 200";
  }

  return null;
};

const isProductColorAvailable = (product, color) => {
  if (!Array.isArray(product.variants)) {
    return false;
  }

  return product.variants.some(
    (variant) => variant.color === color
  );
};

const createCustomization = async (req, res) => {
  try {
    const {
      product,
      size,
      color,

      text,
      textColor,
      textPosition,
      textSize,
      textScale,
      textRotation,

      design,
      designPosition,
      designSize,
      designScale,
      designRotation,
    } = req.body;

    if (!product || !size || !color) {
      return res.status(400).json({
        message: "Product, size and color are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(product)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    if (
      design &&
      !mongoose.Types.ObjectId.isValid(design)
    ) {
      return res.status(400).json({
        message: "Invalid design ID",
      });
    }

    const productData = await Product.findOne({
      _id: product,
      isActive: true,
    });

    if (!productData) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    if (!productData.customizable) {
      return res.status(400).json({
        message: "This product cannot be customized",
      });
    }

    if (
      !Array.isArray(productData.sizes) ||
      !productData.sizes.includes(size)
    ) {
      return res.status(400).json({
        message: "Selected size is not available",
      });
    }

    if (!isProductColorAvailable(productData, color)) {
      return res.status(400).json({
        message: "Selected color is not available",
      });
    }

    if (design) {
      const designData = await Design.findOne({
        _id: design,
        isActive: true,
      });

      if (!designData) {
        return res.status(404).json({
          message: "Design not found",
        });
      }
    }

    const textPositionError = validatePosition(
      textPosition,
      "Text position"
    );

    if (textPositionError) {
      return res.status(400).json({
        message: textPositionError,
      });
    }

    const designPositionError = validatePosition(
      designPosition,
      "Design position"
    );

    if (designPositionError) {
      return res.status(400).json({
        message: designPositionError,
      });
    }

    const designSizeError =
      validateDesignSize(designSize);

    if (designSizeError) {
      return res.status(400).json({
        message: designSizeError,
      });
    }

    if (
      textSize !== undefined &&
      (!isValidNumber(textSize) ||
        textSize < 12 ||
        textSize > 60)
    ) {
      return res.status(400).json({
        message: "Text size must be between 12 and 60",
      });
    }

    if (
      textScale !== undefined &&
      (!isValidNumber(textScale) ||
        textScale < 0.5 ||
        textScale > 2)
    ) {
      return res.status(400).json({
        message: "Text scale must be between 0.5 and 2",
      });
    }

    if (
      textRotation !== undefined &&
      (!isValidNumber(textRotation) ||
        textRotation < -180 ||
        textRotation > 180)
    ) {
      return res.status(400).json({
        message:
          "Text rotation must be between -180 and 180",
      });
    }

    if (
      designScale !== undefined &&
      (!isValidNumber(designScale) ||
        designScale < 0.5 ||
        designScale > 2)
    ) {
      return res.status(400).json({
        message:
          "Design scale must be between 0.5 and 2",
      });
    }

    if (
      designRotation !== undefined &&
      (!isValidNumber(designRotation) ||
        designRotation < -180 ||
        designRotation > 180)
    ) {
      return res.status(400).json({
        message:
          "Design rotation must be between -180 and 180",
      });
    }

    const customization =
      await Customization.create({
        user: req.user.userId,

        product,

        size,

        color,

        text:
          typeof text === "string"
            ? text.trim()
            : "",

        textColor,

        textPosition,

        textSize,

        textScale,

        textRotation,

        design: design || undefined,

        designPosition,

        designSize,

        designScale,

        designRotation,
      });

    return res.status(201).json({
      message:
        "Customization created successfully",
      customization,
    });
  } catch (error) {
    console.error(
      "Create customization error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const getCustomizationById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid customization ID",
      });
    }

    const customization =
      await Customization.findOne({
        _id: id,
        user: req.user.userId,
      })
        .populate("product")
        .populate("design");

    if (!customization) {
      return res.status(404).json({
        message: "Customization not found",
      });
    }

    return res.status(200).json({
      customization,
    });
  } catch (error) {
    console.error(
      "Get customization error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const updateCustomization = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid customization ID",
      });
    }

    const customization =
      await Customization.findOne({
        _id: id,
        user: req.user.userId,
      });

    if (!customization) {
      return res.status(404).json({
        message: "Customization not found",
      });
    }

    const {
      size,
      color,

      text,
      textColor,
      textPosition,
      textSize,
      textScale,
      textRotation,

      design,
      designPosition,
      designSize,
      designScale,
      designRotation,
    } = req.body;

    const product =
      await Product.findOne({
        _id: customization.product,
        isActive: true,
      });

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    if (!product.customizable) {
      return res.status(400).json({
        message:
          "This product cannot be customized",
      });
    }

    if (
      size !== undefined &&
      (
        !Array.isArray(product.sizes) ||
        !product.sizes.includes(size)
      )
    ) {
      return res.status(400).json({
        message: "Selected size is not available",
      });
    }

    if (
      color !== undefined &&
      !isProductColorAvailable(product, color)
    ) {
      return res.status(400).json({
        message: "Selected color is not available",
      });
    }

    if (
      design !== undefined &&
      design !== null
    ) {
      if (
        !mongoose.Types.ObjectId.isValid(design)
      ) {
        return res.status(400).json({
          message: "Invalid design ID",
        });
      }

      const designData =
        await Design.findOne({
          _id: design,
          isActive: true,
        });

      if (!designData) {
        return res.status(404).json({
          message: "Design not found",
        });
      }
    }

    const textPositionError =
      validatePosition(
        textPosition,
        "Text position"
      );

    if (textPositionError) {
      return res.status(400).json({
        message: textPositionError,
      });
    }

    const designPositionError =
      validatePosition(
        designPosition,
        "Design position"
      );

    if (designPositionError) {
      return res.status(400).json({
        message: designPositionError,
      });
    }

    const designSizeError =
      validateDesignSize(designSize);

    if (designSizeError) {
      return res.status(400).json({
        message: designSizeError,
      });
    }

    if (
      textSize !== undefined &&
      (!isValidNumber(textSize) ||
        textSize < 12 ||
        textSize > 60)
    ) {
      return res.status(400).json({
        message:
          "Text size must be between 12 and 60",
      });
    }

    if (
      textScale !== undefined &&
      (!isValidNumber(textScale) ||
        textScale < 0.5 ||
        textScale > 2)
    ) {
      return res.status(400).json({
        message:
          "Text scale must be between 0.5 and 2",
      });
    }

    if (
      textRotation !== undefined &&
      (!isValidNumber(textRotation) ||
        textRotation < -180 ||
        textRotation > 180)
    ) {
      return res.status(400).json({
        message:
          "Text rotation must be between -180 and 180",
      });
    }

    if (
      designScale !== undefined &&
      (!isValidNumber(designScale) ||
        designScale < 0.5 ||
        designScale > 2)
    ) {
      return res.status(400).json({
        message:
          "Design scale must be between 0.5 and 2",
      });
    }

    if (
      designRotation !== undefined &&
      (!isValidNumber(designRotation) ||
        designRotation < -180 ||
        designRotation > 180)
    ) {
      return res.status(400).json({
        message:
          "Design rotation must be between -180 and 180",
      });
    }

    if (size !== undefined) {
      customization.size = size;
    }

    if (color !== undefined) {
      customization.color = color;
    }

    if (text !== undefined) {
      customization.text =
        typeof text === "string"
          ? text.trim()
          : text;
    }

    if (textColor !== undefined) {
      customization.textColor = textColor;
    }

    if (textPosition !== undefined) {
      customization.textPosition =
        textPosition;
    }

    if (textSize !== undefined) {
      customization.textSize = textSize;
    }

    if (textScale !== undefined) {
      customization.textScale = textScale;
    }

    if (textRotation !== undefined) {
      customization.textRotation =
        textRotation;
    }

    if (design !== undefined) {
      customization.design =
        design === null ? undefined : design;
    }

    if (designPosition !== undefined) {
      customization.designPosition =
        designPosition;
    }

    if (designSize !== undefined) {
      customization.designSize =
        designSize;
    }

    if (designScale !== undefined) {
      customization.designScale =
        designScale;
    }

    if (designRotation !== undefined) {
      customization.designRotation =
        designRotation;
    }

    const updatedCustomization =
      await customization.save();

    return res.status(200).json({
      message:
        "Customization updated successfully",
      customization: updatedCustomization,
    });
  } catch (error) {
    console.error(
      "Update customization error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const deleteCustomization = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid customization ID",
      });
    }

    const customization =
      await Customization.findOne({
        _id: id,
        user: req.user.userId,
      });

    if (!customization) {
      return res.status(404).json({
        message: "Customization not found",
      });
    }

    await customization.deleteOne();

    return res.status(200).json({
      message:
        "Customization deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete customization error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  createCustomization,
  getCustomizationById,
  updateCustomization,
  deleteCustomization,
};