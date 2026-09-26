const mongoose = require("mongoose");
const Product = require("../models/Product");
const uploadToCloudinary = require("../utils/cloudinaryUpload");

const generateBaseSlug = (text) => {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const generateUniqueSlug = async (name, currentProductId = null) => {
  let baseSlug = generateBaseSlug(name) || "product";
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await Product.findOne({
      slug,
      ...(currentProductId ? { _id: { $ne: currentProductId } } : {}),
    });

    if (!existing) {
      return slug;
    }

    counter++;
    slug = `${baseSlug}-${counter}`;
  }
};

const ensureSlugsExist = async () => {
  try {
    const productsWithoutSlug = await Product.find({
      $or: [{ slug: { $exists: false } }, { slug: null }, { slug: "" }],
    });

    for (const product of productsWithoutSlug) {
      const slug = await generateUniqueSlug(product.name, product._id);
      product.slug = slug;
      await product.save();
    }
  } catch (error) {
    console.error("Backfill slugs error:", error.message);
  }
};

const normalizeArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === undefined || value === null || value === "") {
    return [];
  }

  return [value];
};

const parseBoolean = (value, defaultValue = true) => {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  if (typeof value === "boolean") {
    return value;
  }

  return value === "true";
};

const parseVariants = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  try {
    const parsed = JSON.parse(value);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      sizes,
      variants,
      stock,
      customizable,
    } = req.body;

    if (
      !name ||
      !description ||
      price === undefined ||
      !category
    ) {
      return res.status(400).json({
        message:
          "Name, description, price and category are required",
      });
    }

    const parsedVariants = parseVariants(variants);

    if (parsedVariants.length === 0) {
      return res.status(400).json({
        message:
          "At least one color variant with an image is required",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message:
          "At least one product image is required",
      });
    }

    const uploadedImages = await Promise.all(
      req.files.map((file) =>
        uploadToCloudinary(
          file.buffer,
          "custom-tshirt-store/products"
        )
      )
    );

    const productVariants = parsedVariants
      .map((variant) => {
        const color =
          typeof variant.color === "string"
            ? variant.color.trim()
            : "";

        const imageIndex = Number(
          variant.imageIndex
        );

        if (
          !color ||
          Number.isNaN(imageIndex) ||
          !uploadedImages[imageIndex]
        ) {
          return null;
        }

        return {
          color,
          image:
            uploadedImages[imageIndex].secure_url,
        };
      })
      .filter(Boolean);

    if (productVariants.length === 0) {
      return res.status(400).json({
        message:
          "Valid color and image combinations are required",
      });
    }

    const colors = productVariants.map(
      (variant) => variant.color.toLowerCase()
    );

    const hasDuplicateColors =
      new Set(colors).size !== colors.length;

    if (hasDuplicateColors) {
      return res.status(400).json({
        message:
          "Duplicate colors are not allowed",
      });
    }

    const slug = await generateUniqueSlug(name.trim());

    const product = await Product.create({
      name: name.trim(),
      slug,
      description: description.trim(),
      price: Number(price),
      category: category.trim(),
      sizes: normalizeArray(sizes),
      variants: productVariants,
      stock:
        stock === undefined ||
        stock === ""
          ? 0
          : Number(stock),
      customizable: parseBoolean(
        customizable,
        true
      ),
    });

    return res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error(
      "Create product error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const getProducts = async (req, res) => {
  try {
    await ensureSlugsExist();

    const {
      search,
      category,
      size,
      color,
      minPrice,
      maxPrice,
      sort,
      limit,
      page,
      view,
    } = req.query;

    const filter = {
      isActive: true,
    };

    if (search) {
      filter.name = {
        $regex: search,
        $options: "i",
      };
    }

    if (category) {
      filter.category = {
        $regex: `^${category}$`,
        $options: "i",
      };
    }

    if (size) {
      filter.sizes = {
        $in: [size],
      };
    }

    if (color) {
      filter["variants.color"] = {
        $regex: `^${color}$`,
        $options: "i",
      };
    }

    if (
      minPrice !== undefined ||
      maxPrice !== undefined
    ) {
      filter.price = {};

      if (minPrice !== undefined) {
        filter.price.$gte = Number(minPrice);
      }

      if (maxPrice !== undefined) {
        filter.price.$lte = Number(maxPrice);
      }
    }

    let sortOption = {
      createdAt: -1,
    };

    if (sort === "price_asc") {
      sortOption = {
        price: 1,
      };
    }

    if (sort === "price_desc") {
      sortOption = {
        price: -1,
      };
    }

    if (sort === "newest") {
      sortOption = {
        createdAt: -1,
      };
    }

    if (sort === "oldest") {
      sortOption = {
        createdAt: 1,
      };
    }

    let query = Product
      .find(filter)
      .sort(sortOption);

    if (view === "card") {
      query = query.select("_id name slug price category variants");
    }

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    let parsedLimit = 12;

    if (limit !== undefined) {
      const customLimit = parseInt(limit, 10);
      if (!isNaN(customLimit) && customLimit > 0) {
        parsedLimit = Math.min(customLimit, 50);
      }
    } else if (page === undefined && view === undefined) {
      parsedLimit = 50;
    }

    const skip = (parsedPage - 1) * parsedLimit;

    query = query.skip(skip).limit(parsedLimit);

    const [totalCount, products] = await Promise.all([
      Product.countDocuments(filter),
      query.lean(),
    ]);

    const totalPages = Math.ceil(totalCount / parsedLimit) || 1;

    return res.status(200).json({
      products,
      count: totalCount,
      page: parsedPage,
      limit: parsedLimit,
      totalPages,
    });
  } catch (error) {
    console.error(
      "Get products error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const getProductById = async (req, res) => {
  try {
    await ensureSlugsExist();

    const param = req.params.id || req.params.slug;

    let product = await Product.findOne({ slug: param });

    if (!product && mongoose.Types.ObjectId.isValid(param)) {
      product = await Product.findById(param);
    }

    if (!product || !product.isActive) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    if (!product.slug) {
      product.slug = await generateUniqueSlug(product.name, product._id);
      await product.save();
    }

    return res.status(200).json({
      product,
    });
  } catch (error) {
    console.error(
      "Get product error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(
      req.params.id
    );

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const {
      name,
      description,
      price,
      category,
      sizes,
      variants,
      stock,
      customizable,
    } = req.body;

    if (name !== undefined) {
      const newName = name.trim();
      if (newName !== product.name) {
        const oldBase = generateBaseSlug(product.name);
        const currentBase = generateBaseSlug(product.slug || "");
        if (
          !product.slug ||
          currentBase === oldBase ||
          currentBase.startsWith(oldBase)
        ) {
          product.slug = await generateUniqueSlug(newName, product._id);
        }
      }
      product.name = newName;
    }

    if (!product.slug) {
      product.slug = await generateUniqueSlug(product.name, product._id);
    }

    if (description !== undefined) {
      product.description =
        description.trim();
    }

    if (price !== undefined) {
      product.price = Number(price);
    }

    if (category !== undefined) {
      product.category = category.trim();
    }

    if (sizes !== undefined) {
      product.sizes = normalizeArray(sizes);
    }

    if (stock !== undefined) {
      product.stock =
        stock === ""
          ? 0
          : Number(stock);
    }

    if (customizable !== undefined) {
      product.customizable =
        parseBoolean(
          customizable,
          product.customizable
        );
    }

    if (variants !== undefined) {
      const parsedVariants =
        parseVariants(variants);

      if (parsedVariants.length === 0) {
        return res.status(400).json({
          message:
            "At least one color variant is required",
        });
      }

      let uploadedImages = [];

      if (
        req.files &&
        req.files.length > 0
      ) {
        uploadedImages =
          await Promise.all(
            req.files.map((file) =>
              uploadToCloudinary(
                file.buffer,
                "custom-tshirt-store/products"
              )
            )
          );
      }

      const updatedVariants =
        parsedVariants
          .map((variant) => {
            const color =
              typeof variant.color ===
              "string"
                ? variant.color.trim()
                : "";

            if (!color) {
              return null;
            }

            if (
              variant.imageIndex !==
                undefined &&
              variant.imageIndex !==
                null &&
              variant.imageIndex !== ""
            ) {
              const imageIndex =
                Number(
                  variant.imageIndex
                );

              if (
                !Number.isNaN(
                  imageIndex
                ) &&
                uploadedImages[
                  imageIndex
                ]
              ) {
                return {
                  color,
                  image:
                    uploadedImages[
                      imageIndex
                    ].secure_url,
                };
              }
            }

            if (
              typeof variant.image ===
                "string" &&
              variant.image.trim()
            ) {
              return {
                color,
                image:
                  variant.image.trim(),
              };
            }

            return null;
          })
          .filter(Boolean);

      if (
        updatedVariants.length === 0
      ) {
        return res.status(400).json({
          message:
            "Valid color and image combinations are required",
        });
      }

      const colors =
        updatedVariants.map(
          (variant) =>
            variant.color.toLowerCase()
        );

      const hasDuplicateColors =
        new Set(colors).size !==
        colors.length;

      if (hasDuplicateColors) {
        return res.status(400).json({
          message:
            "Duplicate colors are not allowed",
        });
      }

      product.variants =
        updatedVariants;
    }

    const updatedProduct =
      await product.save();

    return res.status(200).json({
      message:
        "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error(
      "Update product error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(
      req.params.id
    );

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    product.isActive = false;

    await product.save();

    return res.status(200).json({
      message:
        "Product deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete product error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};