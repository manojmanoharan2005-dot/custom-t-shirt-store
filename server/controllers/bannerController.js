const Banner = require("../models/Banner");
const uploadToCloudinary = require("../utils/cloudinaryUpload");

const createBanner = async (req, res) => {
  try {
    const {
      title,
      subtitle,
      buttonText,
      buttonLink,
      rightTitle,
      rightSubtitle,
      rightButtonText,
      rightButtonLink,
      displayOrder,
    } = req.body;

    if (!title) {
      return res.status(400).json({
        message: "Banner title is required",
      });
    }

    const leftImageFile =
      req.files?.leftImage?.[0];

    const rightImageFile =
      req.files?.rightImage?.[0];

    if (!leftImageFile || !rightImageFile) {
      return res.status(400).json({
        message:
          "Both left and right banner images are required",
      });
    }

    const uploadedLeftImage =
      await uploadToCloudinary(
        leftImageFile.buffer,
        "custom-tshirt-store/banners"
      );

    const uploadedRightImage =
      await uploadToCloudinary(
        rightImageFile.buffer,
        "custom-tshirt-store/banners"
      );

    const banner = await Banner.create({
      title,
      subtitle,
      buttonText,
      buttonLink,

      leftImage:
        uploadedLeftImage.secure_url,

      rightTitle,
      rightSubtitle,
      rightButtonText,
      rightButtonLink,

      rightImage:
        uploadedRightImage.secure_url,

      displayOrder:
        displayOrder !== undefined
          ? Number(displayOrder)
          : 0,
    });

    return res.status(201).json({
      message: "Banner created successfully",
      banner,
    });
  } catch (error) {
    console.error(
      "Create banner error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const getActiveBanners = async (req, res) => {
  try {
    const { limit } = req.query;

    let query = Banner.find({
      isActive: true,
    })
      .select(
        "_id title subtitle buttonText buttonLink leftImage rightTitle rightSubtitle rightButtonText rightButtonLink rightImage displayOrder"
      )
      .sort({
        displayOrder: 1,
        createdAt: -1,
      });

    if (limit !== undefined) {
      const parsedLimit = Number(limit);
      if (Number.isInteger(parsedLimit) && parsedLimit > 0) {
        query = query.limit(parsedLimit);
      }
    }

    const banners = await query.lean();

    return res.status(200).json({
      banners,
    });
  } catch (error) {
    console.error(
      "Get banners error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({
      displayOrder: 1,
      createdAt: -1,
    });

    return res.status(200).json({
      banners,
    });
  } catch (error) {
    console.error(
      "Get all banners error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(
      req.params.id
    );

    if (!banner) {
      return res.status(404).json({
        message: "Banner not found",
      });
    }

    const {
      title,
      subtitle,
      buttonText,
      buttonLink,
      rightTitle,
      rightSubtitle,
      rightButtonText,
      rightButtonLink,
      displayOrder,
      isActive,
    } = req.body;

    if (title !== undefined) {
      banner.title = title;
    }

    if (subtitle !== undefined) {
      banner.subtitle = subtitle;
    }

    if (buttonText !== undefined) {
      banner.buttonText = buttonText;
    }

    if (buttonLink !== undefined) {
      banner.buttonLink = buttonLink;
    }

    if (rightTitle !== undefined) {
      banner.rightTitle = rightTitle;
    }

    if (rightSubtitle !== undefined) {
      banner.rightSubtitle =
        rightSubtitle;
    }

    if (rightButtonText !== undefined) {
      banner.rightButtonText =
        rightButtonText;
    }

    if (rightButtonLink !== undefined) {
      banner.rightButtonLink =
        rightButtonLink;
    }

    if (displayOrder !== undefined) {
      banner.displayOrder =
        Number(displayOrder);
    }

    if (isActive !== undefined) {
      banner.isActive =
        isActive === true ||
        isActive === "true";
    }

    const leftImageFile =
      req.files?.leftImage?.[0];

    if (leftImageFile) {
      const uploadedLeftImage =
        await uploadToCloudinary(
          leftImageFile.buffer,
          "custom-tshirt-store/banners"
        );

      banner.leftImage =
        uploadedLeftImage.secure_url;
    }

    const rightImageFile =
      req.files?.rightImage?.[0];

    if (rightImageFile) {
      const uploadedRightImage =
        await uploadToCloudinary(
          rightImageFile.buffer,
          "custom-tshirt-store/banners"
        );

      banner.rightImage =
        uploadedRightImage.secure_url;
    }

    const updatedBanner =
      await banner.save();

    return res.status(200).json({
      message: "Banner updated successfully",
      banner: updatedBanner,
    });
  } catch (error) {
    console.error(
      "Update banner error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(
      req.params.id
    );

    if (!banner) {
      return res.status(404).json({
        message: "Banner not found",
      });
    }

    await Banner.findByIdAndDelete(
      req.params.id
    );

    return res.status(200).json({
      message: "Banner deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete banner error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  createBanner,
  getActiveBanners,
  getAllBanners,
  updateBanner,
  deleteBanner,
};