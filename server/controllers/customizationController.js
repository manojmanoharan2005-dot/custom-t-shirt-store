const mongoose = require("mongoose");

const Customization = require("../models/Customization");
const Product = require("../models/Product");
const Design = require("../models/Design");
const uploadToCloudinary = require("../utils/cloudinaryUpload");
const cloudinary = require("../config/cloudinary");

const parseJSONIfNeeded = (val) => {
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch (e) {
      return val;
    }
  }
  return val;
};

const isValidNumber = (value) => {
  const num = typeof value === "string" ? Number(value) : value;
  return typeof num === "number" && Number.isFinite(num);
};

const validatePosition = (position, fieldName) => {
  if (position === undefined) {
    return null;
  }

  const parsedPosition = parseJSONIfNeeded(position);

  if (!parsedPosition || typeof parsedPosition !== "object") {
    return `${fieldName} must be an object`;
  }

  const { x, y } = parsedPosition;

  if (!isValidNumber(x) || !isValidNumber(y)) {
    return `${fieldName} x and y must be valid numbers`;
  }

  const numX = Number(x);
  const numY = Number(y);

  if (numX < 0 || numX > 100 || numY < 0 || numY > 100) {
    return `${fieldName} x and y must be between 0 and 100`;
  }

  return null;
};

const validateDesignSize = (designSize) => {
  if (designSize === undefined) {
    return null;
  }

  const parsedSize = parseJSONIfNeeded(designSize);

  if (!parsedSize || typeof parsedSize !== "object") {
    return "Design size must be an object";
  }

  const { width, height } = parsedSize;

  if (!isValidNumber(width) || !isValidNumber(height)) {
    return "Design size width and height must be valid numbers";
  }

  const numW = Number(width);
  const numH = Number(height);

  if (
    numW < 1 ||
    numW > 200 ||
    numH < 1 ||
    numH > 200
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
  let uploadedPublicId = null;

  try {
    const rawBody = req.body || {};
    const product = rawBody.product;
    const size = rawBody.size;
    const color = rawBody.color;

    const text = rawBody.text;
    const textColor = rawBody.textColor;
    const textPosition = parseJSONIfNeeded(rawBody.textPosition);
    const textSize = rawBody.textSize !== undefined ? Number(rawBody.textSize) : undefined;
    const textScale = rawBody.textScale !== undefined ? Number(rawBody.textScale) : undefined;
    const textRotation = rawBody.textRotation !== undefined ? Number(rawBody.textRotation) : undefined;

    const design = rawBody.design;
    const designPosition = parseJSONIfNeeded(rawBody.designPosition);
    const designSize = parseJSONIfNeeded(rawBody.designSize);
    const designScale = rawBody.designScale !== undefined ? Number(rawBody.designScale) : undefined;
    const designRotation = rawBody.designRotation !== undefined ? Number(rawBody.designRotation) : undefined;

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

    let imageUrl = "";
    let cloudinaryPublicId = "";
    let originalFileName = "";

    if (req.file) {
      const allowedMimeTypes = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp",
      ];

      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          message: "Please upload a PNG, JPG or WEBP image.",
        });
      }

      if (req.file.size > 5 * 1024 * 1024) {
        return res.status(400).json({
          message: "Image must be smaller than 5 MB.",
        });
      }

      const uploaded = await uploadToCloudinary(
        req.file.buffer,
        "custom-tshirt-store/user-designs"
      );

      imageUrl = uploaded.secure_url;
      cloudinaryPublicId = uploaded.public_id;
      uploadedPublicId = uploaded.public_id;
      originalFileName = req.file.originalname || "user-design";
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

        imageUrl,

        cloudinaryPublicId,

        originalFileName,
      });

    return res.status(201).json({
      message:
        "Customization created successfully",
      customization,
    });
  } catch (error) {
    if (uploadedPublicId) {
      cloudinary.uploader.destroy(uploadedPublicId).catch(() => {});
    }

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
  let uploadedPublicId = null;

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

    const rawBody = req.body || {};
    const size = rawBody.size;
    const color = rawBody.color;

    const text = rawBody.text;
    const textColor = rawBody.textColor;
    const textPosition = parseJSONIfNeeded(rawBody.textPosition);
    const textSize = rawBody.textSize !== undefined ? Number(rawBody.textSize) : undefined;
    const textScale = rawBody.textScale !== undefined ? Number(rawBody.textScale) : undefined;
    const textRotation = rawBody.textRotation !== undefined ? Number(rawBody.textRotation) : undefined;

    const design = rawBody.design;
    const designPosition = parseJSONIfNeeded(rawBody.designPosition);
    const designSize = parseJSONIfNeeded(rawBody.designSize);
    const designScale = rawBody.designScale !== undefined ? Number(rawBody.designScale) : undefined;
    const designRotation = rawBody.designRotation !== undefined ? Number(rawBody.designRotation) : undefined;

    if (req.file) {
      const allowedMimeTypes = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp",
      ];

      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          message: "Please upload a PNG, JPG or WEBP image.",
        });
      }

      if (req.file.size > 5 * 1024 * 1024) {
        return res.status(400).json({
          message: "Image must be smaller than 5 MB.",
        });
      }

      const uploaded = await uploadToCloudinary(
        req.file.buffer,
        "custom-tshirt-store/user-designs"
      );

      customization.imageUrl = uploaded.secure_url;
      customization.cloudinaryPublicId = uploaded.public_id;
      uploadedPublicId = uploaded.public_id;
      customization.originalFileName = req.file.originalname || "user-design";
    }

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
    if (uploadedPublicId) {
      cloudinary.uploader.destroy(uploadedPublicId).catch(() => {});
    }

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