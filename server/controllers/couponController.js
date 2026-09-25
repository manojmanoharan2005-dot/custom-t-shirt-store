const Coupon = require("../models/Coupon");

const createCoupon = async (req, res) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      minimumOrderAmount,
      maximumDiscount,
      usageLimit,
      expiryDate,
    } = req.body;

    if (
      !code ||
      !discountType ||
      discountValue === undefined ||
      !expiryDate
    ) {
      return res.status(400).json({
        message:
          "Code, discount type, discount value and expiry date are required",
      });
    }

    if (
      !["PERCENTAGE", "FIXED"].includes(
        discountType
      )
    ) {
      return res.status(400).json({
        message: "Invalid discount type",
      });
    }

    if (discountValue <= 0) {
      return res.status(400).json({
        message:
          "Discount value must be greater than 0",
      });
    }

    if (
      discountType === "PERCENTAGE" &&
      discountValue > 100
    ) {
      return res.status(400).json({
        message:
          "Percentage discount cannot exceed 100",
      });
    }

    if (
      new Date(expiryDate) <= new Date()
    ) {
      return res.status(400).json({
        message:
          "Expiry date must be in the future",
      });
    }

    const existingCoupon =
      await Coupon.findOne({
        code: code.toUpperCase(),
      });

    if (existingCoupon) {
      return res.status(400).json({
        message: "Coupon code already exists",
      });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      minimumOrderAmount:
        minimumOrderAmount || 0,
      maximumDiscount,
      usageLimit,
      expiryDate,
    });

    return res.status(201).json({
      message:
        "Coupon created successfully",
      coupon,
    });
  } catch (error) {
    console.error(
      "Create coupon error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({
      createdAt: -1,
    });

    return res.status(200).json({
      coupons,
    });
  } catch (error) {
    console.error(
      "Get coupons error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const updateCoupon = async (req, res) => {
  try {
    const coupon =
      await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        message: "Coupon not found",
      });
    }

    const {
      code,
      discountType,
      discountValue,
      minimumOrderAmount,
      maximumDiscount,
      usageLimit,
      expiryDate,
      isActive,
    } = req.body;

    if (
      discountType &&
      !["PERCENTAGE", "FIXED"].includes(
        discountType
      )
    ) {
      return res.status(400).json({
        message: "Invalid discount type",
      });
    }

    const finalDiscountType =
      discountType ?? coupon.discountType;

    const finalDiscountValue =
      discountValue ?? coupon.discountValue;

    if (finalDiscountValue <= 0) {
      return res.status(400).json({
        message:
          "Discount value must be greater than 0",
      });
    }

    if (
      finalDiscountType === "PERCENTAGE" &&
      finalDiscountValue > 100
    ) {
      return res.status(400).json({
        message:
          "Percentage discount cannot exceed 100",
      });
    }

    if (
      expiryDate &&
      new Date(expiryDate) <= new Date()
    ) {
      return res.status(400).json({
        message:
          "Expiry date must be in the future",
      });
    }

    if (
      code &&
      code.toUpperCase() !== coupon.code
    ) {
      const existingCoupon =
        await Coupon.findOne({
          code: code.toUpperCase(),
          _id: { $ne: coupon._id },
        });

      if (existingCoupon) {
        return res.status(400).json({
          message:
            "Coupon code already exists",
        });
      }

      coupon.code =
        code.toUpperCase();
    }

    coupon.discountType =
      finalDiscountType;

    coupon.discountValue =
      finalDiscountValue;

    coupon.minimumOrderAmount =
      minimumOrderAmount ??
      coupon.minimumOrderAmount;

    coupon.maximumDiscount =
      maximumDiscount ??
      coupon.maximumDiscount;

    coupon.usageLimit =
      usageLimit ??
      coupon.usageLimit;

    coupon.expiryDate =
      expiryDate ??
      coupon.expiryDate;

    coupon.isActive =
      isActive ??
      coupon.isActive;

    const updatedCoupon =
      await coupon.save();

    return res.status(200).json({
      message:
        "Coupon updated successfully",
      coupon: updatedCoupon,
    });
  } catch (error) {
    console.error(
      "Update coupon error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const coupon =
      await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        message: "Coupon not found",
      });
    }

    coupon.isActive = false;

    await coupon.save();

    return res.status(200).json({
      message:
        "Coupon deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete coupon error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

const validateCoupon = async (req, res) => {
  try {
    const {
      code,
      orderAmount,
    } = req.body;

    if (
      !code ||
      orderAmount === undefined
    ) {
      return res.status(400).json({
        message:
          "Coupon code and order amount are required",
      });
    }

    const coupon =
      await Coupon.findOne({
        code: code.toUpperCase(),
        isActive: true,
      });

    if (!coupon) {
      return res.status(404).json({
        message:
          "Invalid coupon code",
      });
    }

    if (
      new Date() > coupon.expiryDate
    ) {
      return res.status(400).json({
        message:
          "Coupon has expired",
      });
    }

    if (
      coupon.usageLimit &&
      coupon.usedCount >=
        coupon.usageLimit
    ) {
      return res.status(400).json({
        message:
          "Coupon usage limit reached",
      });
    }

    if (
      orderAmount <
      coupon.minimumOrderAmount
    ) {
      return res.status(400).json({
        message:
          `Minimum order amount is ${coupon.minimumOrderAmount}`,
      });
    }

    let discountAmount = 0;

    if (
      coupon.discountType ===
      "PERCENTAGE"
    ) {
      discountAmount =
        (orderAmount *
          coupon.discountValue) /
        100;

      if (
        coupon.maximumDiscount
      ) {
        discountAmount =
          Math.min(
            discountAmount,
            coupon.maximumDiscount
          );
      }
    } else {
      discountAmount =
        coupon.discountValue;
    }

    discountAmount =
      Math.min(
        discountAmount,
        orderAmount
      );

    const finalAmount =
      orderAmount -
      discountAmount;

    return res.status(200).json({
      message:
        "Coupon applied successfully",

      coupon: {
        id: coupon._id,
        code: coupon.code,
        discountType:
          coupon.discountType,
        discountValue:
          coupon.discountValue,
        minimumOrderAmount:
          coupon.minimumOrderAmount,

        maximumDiscount:
          coupon.maximumDiscount,
      },

      discountAmount,
      finalAmount,
    });
  } catch (error) {
    console.error(
      "Validate coupon error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  createCoupon,
  getCoupons,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
};