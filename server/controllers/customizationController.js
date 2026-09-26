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

    const userDesignPosition = parseJSONIfNeeded(rawBody.userDesignPosition) || designPosition;
    const userDesignScale = rawBody.userDesignScale !== undefined ? Number(rawBody.userDesignScale) : designScale;
    const adminDesignPosition = parseJSONIfNeeded(rawBody.adminDesignPosition) || designPosition;
    const adminDesignScale = rawBody.adminDesignScale !== undefined ? Number(rawBody.adminDesignScale) : designScale;

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

    let parsedTexts = parseJSONIfNeeded(rawBody.texts);
    if (!Array.isArray(parsedTexts)) {
      parsedTexts = [];
    }

    if (parsedTexts.length === 0 && (rawBody.text || rawBody.textPosition)) {
      parsedTexts.push({
        id: "text_legacy",
        text: typeof text === "string" ? text.trim() : "",
        fontFamily: rawBody.fontFamily || "Inter",
        textColor: textColor || "#000000",
        fontSize: textSize !== undefined ? Number(textSize) : 24,
        textScale: textScale !== undefined ? Number(textScale) : 1,
        textRotation: textRotation !== undefined ? Number(textRotation) : 0,
        textPosition: textPosition || { x: 50, y: 50 },
      });
    }

    let parsedUserDesignsMeta = parseJSONIfNeeded(rawBody.userDesignsMeta);
    if (!Array.isArray(parsedUserDesignsMeta)) {
      parsedUserDesignsMeta = [];
    }

    const filesMap = {};
    if (Array.isArray(req.files)) {
      req.files.forEach((f) => {
        filesMap[f.fieldname] = f;
      });
    } else if (req.file) {
      filesMap[req.file.fieldname || "userDesign"] = req.file;
    }

    const processedUserDesigns = [];
    const createdPublicIds = [];

    if (parsedUserDesignsMeta.length > 0) {
      for (let i = 0; i < parsedUserDesignsMeta.length; i++) {
        const meta = parsedUserDesignsMeta[i];
        const fieldName = meta.fieldName || `userDesignFile_${i}`;
        const fileObj = filesMap[fieldName] || (i === 0 ? filesMap["userDesign"] : null);

        let udImageUrl = meta.imageUrl || "";
        let udPublicId = meta.cloudinaryPublicId || "";
        let udOrigName = meta.originalFileName || "";

        if (fileObj) {
          const allowedMimeTypes = [
            "image/png",
            "image/jpeg",
            "image/jpg",
            "image/webp",
          ];

          if (!allowedMimeTypes.includes(fileObj.mimetype)) {
            return res.status(400).json({
              message: "Please upload a PNG, JPG or WEBP image.",
            });
          }

          if (fileObj.size > 5 * 1024 * 1024) {
            return res.status(400).json({
              message: "Image must be smaller than 5 MB.",
            });
          }

          const uploaded = await uploadToCloudinary(
            fileObj.buffer,
            "custom-tshirt-store/user-designs"
          );

          udImageUrl = uploaded.secure_url;
          udPublicId = uploaded.public_id;
          udOrigName = fileObj.originalname || "user-design";
          createdPublicIds.push(uploaded.public_id);
        }

        if (udImageUrl) {
          processedUserDesigns.push({
            id: meta.id || `ud_${i}`,
            imageUrl: udImageUrl,
            cloudinaryPublicId: udPublicId,
            originalFileName: udOrigName,
            userDesignPosition: meta.userDesignPosition || meta.position || { x: 50, y: 40 },
            userDesignScale: meta.userDesignScale !== undefined ? Number(meta.userDesignScale) : (meta.scale !== undefined ? Number(meta.scale) : 1),
            userDesignRotation: meta.userDesignRotation !== undefined ? Number(meta.userDesignRotation) : (meta.rotation !== undefined ? Number(meta.rotation) : 0),
          });
        }
      }
    } else if (req.file || filesMap["userDesign"]) {
      const singleFile = req.file || filesMap["userDesign"];
      const allowedMimeTypes = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp",
      ];

      if (!allowedMimeTypes.includes(singleFile.mimetype)) {
        return res.status(400).json({
          message: "Please upload a PNG, JPG or WEBP image.",
        });
      }

      if (singleFile.size > 5 * 1024 * 1024) {
        return res.status(400).json({
          message: "Image must be smaller than 5 MB.",
        });
      }

      const uploaded = await uploadToCloudinary(
        singleFile.buffer,
        "custom-tshirt-store/user-designs"
      );

      imageUrl = uploaded.secure_url;
      cloudinaryPublicId = uploaded.public_id;
      createdPublicIds.push(uploaded.public_id);
      originalFileName = singleFile.originalname || "user-design";

      processedUserDesigns.push({
        id: "ud_legacy",
        imageUrl,
        cloudinaryPublicId,
        originalFileName,
        userDesignPosition: userDesignPosition || { x: 50, y: 40 },
        userDesignScale: userDesignScale !== undefined ? Number(userDesignScale) : 1,
        userDesignRotation: 0,
      });
    }

    if (processedUserDesigns.length > 0) {
      imageUrl = processedUserDesigns[0].imageUrl;
      cloudinaryPublicId = processedUserDesigns[0].cloudinaryPublicId;
      originalFileName = processedUserDesigns[0].originalFileName;
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

    const firstTextObj = parsedTexts[0] || {};
    const effectiveText = firstTextObj.text !== undefined ? firstTextObj.text : (typeof text === "string" ? text.trim() : "");
    const effectiveTextColor = firstTextObj.textColor || textColor || "#000000";
    const effectiveTextPosition = firstTextObj.textPosition || textPosition || { x: 50, y: 50 };
    const effectiveTextSize = firstTextObj.fontSize !== undefined ? Number(firstTextObj.fontSize) : (textSize !== undefined ? Number(textSize) : 24);
    const effectiveTextScale = firstTextObj.textScale !== undefined ? Number(firstTextObj.textScale) : (textScale !== undefined ? Number(textScale) : 1);
    const effectiveTextRotation = firstTextObj.textRotation !== undefined ? Number(firstTextObj.textRotation) : (textRotation !== undefined ? Number(textRotation) : 0);

    const firstUserDesignObj = processedUserDesigns[0] || {};
    const effectiveUserDesignPosition = firstUserDesignObj.userDesignPosition || userDesignPosition || { x: 50, y: 40 };
    const effectiveUserDesignScale = firstUserDesignObj.userDesignScale !== undefined ? Number(firstUserDesignObj.userDesignScale) : (userDesignScale !== undefined ? Number(userDesignScale) : 1);

    const customization = await Customization.create({
      user: req.user.userId,
      product,
      size,
      color,
      text: effectiveText,
      textColor: effectiveTextColor,
      textPosition: effectiveTextPosition,
      textSize: effectiveTextSize,
      textScale: effectiveTextScale,
      textRotation: effectiveTextRotation,
      texts: parsedTexts,
      userDesigns: processedUserDesigns,
      design: design || undefined,
      designPosition,
      designSize,
      designScale,
      designRotation,
      userDesignPosition: effectiveUserDesignPosition,
      userDesignScale: effectiveUserDesignScale,
      adminDesignPosition,
      adminDesignScale,
      imageUrl,
      cloudinaryPublicId,
      originalFileName,
    });

    return res.status(201).json({
      message: "Customization created successfully",
      customization,
    });
  } catch (error) {
    if (createdPublicIds && createdPublicIds.length > 0) {
      createdPublicIds.forEach((pid) => {
        cloudinary.uploader.destroy(pid).catch(() => {});
      });
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

    if (rawBody.texts !== undefined) {
      let parsedTexts = parseJSONIfNeeded(rawBody.texts);
      if (Array.isArray(parsedTexts)) {
        customization.texts = parsedTexts;
        if (parsedTexts.length > 0) {
          const firstText = parsedTexts[0];
          customization.text = firstText.text || "";
          customization.textColor = firstText.textColor || "#000000";
          customization.textSize = firstText.fontSize || 24;
          customization.textScale = firstText.textScale || 1;
          customization.textRotation = firstText.textRotation || 0;
          customization.textPosition = firstText.textPosition || { x: 50, y: 50 };
        }
      }
    }

    if (rawBody.userDesignsMeta !== undefined || (req.files && req.files.length > 0) || req.file) {
      let parsedUserDesignsMeta = parseJSONIfNeeded(rawBody.userDesignsMeta);
      if (!Array.isArray(parsedUserDesignsMeta)) {
        parsedUserDesignsMeta = [];
      }

      const filesMap = {};
      if (Array.isArray(req.files)) {
        req.files.forEach((f) => {
          filesMap[f.fieldname] = f;
        });
      } else if (req.file) {
        filesMap[req.file.fieldname || "userDesign"] = req.file;
      }

      const updatedUserDesigns = [];
      for (let i = 0; i < parsedUserDesignsMeta.length; i++) {
        const meta = parsedUserDesignsMeta[i];
        const fieldName = meta.fieldName || `userDesignFile_${i}`;
        const fileObj = filesMap[fieldName] || (i === 0 ? filesMap["userDesign"] : null);

        let udImageUrl = meta.imageUrl || "";
        let udPublicId = meta.cloudinaryPublicId || "";
        let udOrigName = meta.originalFileName || "";

        if (fileObj) {
          const uploaded = await uploadToCloudinary(
            fileObj.buffer,
            "custom-tshirt-store/user-designs"
          );
          udImageUrl = uploaded.secure_url;
          udPublicId = uploaded.public_id;
          udOrigName = fileObj.originalname || "user-design";
        }

        if (udImageUrl) {
          updatedUserDesigns.push({
            id: meta.id || `ud_${i}`,
            imageUrl: udImageUrl,
            cloudinaryPublicId: udPublicId,
            originalFileName: udOrigName,
            userDesignPosition: meta.userDesignPosition || meta.position || { x: 50, y: 40 },
            userDesignScale: meta.userDesignScale !== undefined ? Number(meta.userDesignScale) : (meta.scale !== undefined ? Number(meta.scale) : 1),
            userDesignRotation: meta.userDesignRotation !== undefined ? Number(meta.userDesignRotation) : (meta.rotation !== undefined ? Number(meta.rotation) : 0),
          });
        }
      }

      if (updatedUserDesigns.length > 0) {
        customization.userDesigns = updatedUserDesigns;
        customization.imageUrl = updatedUserDesigns[0].imageUrl;
        customization.cloudinaryPublicId = updatedUserDesigns[0].cloudinaryPublicId;
        customization.originalFileName = updatedUserDesigns[0].originalFileName;
        customization.userDesignPosition = updatedUserDesigns[0].userDesignPosition;
        customization.userDesignScale = updatedUserDesigns[0].userDesignScale;
      }
    }

    if (size !== undefined) {
      customization.size = size;
    }

    if (color !== undefined) {
      customization.color = color;
    }

    if (text !== undefined && rawBody.texts === undefined) {
      customization.text =
        typeof text === "string"
          ? text.trim()
          : text;
    }

    if (textColor !== undefined && rawBody.texts === undefined) {
      customization.textColor = textColor;
    }

    if (textPosition !== undefined && rawBody.texts === undefined) {
      customization.textPosition =
        textPosition;
    }

    if (textSize !== undefined && rawBody.texts === undefined) {
      customization.textSize = textSize;
    }

    if (textScale !== undefined && rawBody.texts === undefined) {
      customization.textScale = textScale;
    }

    if (textRotation !== undefined && rawBody.texts === undefined) {
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