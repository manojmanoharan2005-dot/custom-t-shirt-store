const Category = require("../models/Category");
const Product = require("../models/Product");
const uploadToCloudinary = require("../utils/cloudinaryUpload");

const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    const categoryName = name?.trim();

    if (!categoryName) {
      return res.status(400).json({
        message: "Category name is required",
      });
    }

    const existingCategory = await Category.findOne({
      name: categoryName,
    });

    if (existingCategory) {
      if (!existingCategory.isActive) {
        existingCategory.isActive = true;

        if (description !== undefined) {
          existingCategory.description =
            description.trim();
        }

        if (req.file) {
          const uploadResult = await uploadToCloudinary(
            req.file.buffer,
            "custom-tshirt-store/categories"
          );

          existingCategory.image =
            uploadResult.secure_url;
        }

        const restoredCategory =
          await existingCategory.save();

        return res.status(200).json({
          message: "Category restored successfully",
          category: restoredCategory,
        });
      }

      return res.status(400).json({
        message: "Category already exists",
      });
    }

    let imageUrl = "";

    if (req.file) {
      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        "custom-tshirt-store/categories"
      );

      imageUrl = uploadResult.secure_url;
    }

    const category = await Category.create({
      name: categoryName,
      description: description?.trim() || "",
      image: imageUrl,
      isActive: true,
    });

    return res.status(201).json({
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error(
      "Create category error:",
      error
    );

    return res.status(500).json({
      message:
        error.message ||
        "Server error",
    });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({
      isActive: true,
    })
      .select("_id name description image")
      .sort({
        createdAt: -1,
      })
      .lean();

    return res.status(200).json({
      categories,
    });
  } catch (error) {
    console.error(
      "Get categories error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(
      req.params.id
    );

    if (!category || !category.isActive) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    return res.status(200).json({
      category,
    });
  } catch (error) {
    console.error(
      "Get category error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(
      req.params.id
    );

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    const { name, description } = req.body;

    const oldCategoryName = category.name;

    if (name !== undefined) {
      const categoryName = name.trim();

      if (!categoryName) {
        return res.status(400).json({
          message: "Category name is required",
        });
      }

      const existingCategory =
        await Category.findOne({
          name: categoryName,
          _id: { $ne: req.params.id },
        });

      if (existingCategory) {
        return res.status(400).json({
          message: "Category already exists",
        });
      }

      category.name = categoryName;
    }

    if (description !== undefined) {
      category.description =
        description.trim();
    }

    if (req.file) {
      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        "custom-tshirt-store/categories"
      );

      category.image =
        uploadResult.secure_url;
    }

    const updatedCategory =
      await category.save();

    if (
      name !== undefined &&
      oldCategoryName !== category.name
    ) {
      await Product.updateMany(
        {
          category: oldCategoryName,
        },
        {
          $set: {
            category: category.name,
          },
        }
      );
    }

    return res.status(200).json({
      message:
        "Category updated successfully",
      category: updatedCategory,
    });
  } catch (error) {
    console.error(
      "Update category error:",
      error
    );

    return res.status(500).json({
      message:
        error.message ||
        "Server error",
    });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(
      req.params.id
    );

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    category.isActive = false;

    await category.save();

    await Product.updateMany(
      {
        category: category.name,
        isActive: true,
      },
      {
        $set: {
          isActive: false,
        },
      }
    );

    return res.status(200).json({
      message:
        "Category and related products deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete category error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};