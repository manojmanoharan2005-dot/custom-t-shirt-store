const Design = require("../models/Design");

const uploadToCloudinary = require("../utils/cloudinaryUpload");

const createDesign = async (req, res) => {
  try {
    const {
      name,
      category,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Design name is required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Design image is required",
      });
    }

    const uploadedImage =
      await uploadToCloudinary(
        req.file.buffer,
        "custom-tshirt-store/designs"
      );

    const design = await Design.create({
      name,
      image: uploadedImage.secure_url,
      category,
    });

    return res.status(201).json({
      message: "Design created successfully",
      design,
    });
  } catch (error) {
    console.error(
      "Create design error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const getDesigns = async (req, res) => {
  try {
    const designs = await Design.find({
      isActive: true,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      designs,
    });
  } catch (error) {
    console.error(
      "Get designs error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const updateDesign = async (req, res) => {
  try {
    const design = await Design.findById(
      req.params.id
    );

    if (!design) {
      return res.status(404).json({
        message: "Design not found",
      });
    }

    const {
      name,
      category,
    } = req.body;

    if (name !== undefined) {
      design.name = name;
    }

    if (category !== undefined) {
      design.category = category;
    }

    if (req.file) {
      const uploadedImage =
        await uploadToCloudinary(
          req.file.buffer,
          "custom-tshirt-store/designs"
        );

      design.image =
        uploadedImage.secure_url;
    }

    const updatedDesign =
      await design.save();

    return res.status(200).json({
      message: "Design updated successfully",
      design: updatedDesign,
    });
  } catch (error) {
    console.error(
      "Update design error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const deleteDesign = async (req, res) => {
  try {
    const design = await Design.findById(
      req.params.id
    );

    if (!design) {
      return res.status(404).json({
        message: "Design not found",
      });
    }

    design.isActive = false;

    await design.save();

    return res.status(200).json({
      message: "Design deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete design error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  createDesign,
  getDesigns,
  updateDesign,
  deleteDesign,
};