const mongoose = require("mongoose");
const Razorpay = require("razorpay");

const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");

const isProductColorAvailable = (product, color) => {
  if (
    !Array.isArray(product?.variants) ||
    !color
  ) {
    return false;
  }

  return product.variants.some(
    (variant) =>
      variant?.color?.trim().toLowerCase() ===
      color.trim().toLowerCase()
  );
};

const isProductSizeAvailable = (product, size) => {
  if (!Array.isArray(product?.sizes)) {
    return false;
  }

  return product.sizes.includes(size);
};

const createOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const {
      shippingAddress,
      paymentMethod,
      couponCode,
    } = req.body;

    if (!shippingAddress) {
      return res.status(400).json({
        message: "Shipping address is required",
      });
    }

    const requiredAddressFields = [
      "fullName",
      "phone",
      "addressLine",
      "city",
      "state",
      "pincode",
    ];

    for (const field of requiredAddressFields) {
      if (
        !shippingAddress[field] ||
        !shippingAddress[field]
          .toString()
          .trim()
      ) {
        return res.status(400).json({
          message: `Shipping ${field} is required`,
        });
      }
    }

    const selectedPaymentMethod =
      paymentMethod || "COD";

    if (
      !["COD", "ONLINE"].includes(
        selectedPaymentMethod
      )
    ) {
      return res.status(400).json({
        message: "Invalid payment method",
      });
    }

    const cart = await Cart.findOne({
      user: req.user.userId,
    }).populate("items.product");

    if (
      !cart ||
      !cart.items ||
      cart.items.length === 0
    ) {
      return res.status(400).json({
        message: "Cart is empty",
      });
    }

    for (const item of cart.items) {
      if (
        !item.product ||
        !item.product.isActive
      ) {
        return res.status(400).json({
          message:
            "One or more products are no longer available",
        });
      }

      if (
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
      ) {
        return res.status(400).json({
          message:
            "Invalid product quantity in cart",
        });
      }

      if (
        item.quantity >
        item.product.stock
      ) {
        return res.status(400).json({
          message: `Insufficient stock for ${item.product.name}`,
        });
      }

      if (
        !item.size ||
        !isProductSizeAvailable(
          item.product,
          item.size
        )
      ) {
        return res.status(400).json({
          message: `Size ${
            item.size || "selected"
          } is no longer available for ${
            item.product.name
          }`,
        });
      }

      if (
        !item.color ||
        !isProductColorAvailable(
          item.product,
          item.color
        )
      ) {
        return res.status(400).json({
          message: `Color ${
            item.color || "selected"
          } is no longer available for ${
            item.product.name
          }`,
        });
      }
    }

    const subtotal = cart.items.reduce(
      (total, item) => {
        return (
          total +
          Number(item.price || 0) *
            Number(item.quantity || 0)
        );
      },
      0
    );

    let discountAmount = 0;
    let appliedCouponCode = null;
    let coupon = null;

    if (couponCode?.trim()) {
      const normalizedCouponCode =
        couponCode
          .trim()
          .toUpperCase();

      coupon = await Coupon.findOne({
        code: normalizedCouponCode,
        isActive: true,
      });

      if (!coupon) {
        return res.status(400).json({
          message: "Invalid coupon code",
        });
      }

      if (
        coupon.expiryDate &&
        new Date() >
          new Date(coupon.expiryDate)
      ) {
        return res.status(400).json({
          message: "Coupon has expired",
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
        subtotal <
        (coupon.minimumOrderAmount || 0)
      ) {
        return res.status(400).json({
          message: `Minimum order amount is ₹${coupon.minimumOrderAmount}`,
        });
      }

      if (
        coupon.discountType ===
        "PERCENTAGE"
      ) {
        discountAmount =
          (subtotal *
            Number(
              coupon.discountValue || 0
            )) /
          100;

        if (
          coupon.maximumDiscount &&
          coupon.maximumDiscount > 0
        ) {
          discountAmount = Math.min(
            discountAmount,
            Number(
              coupon.maximumDiscount
            )
          );
        }
      }

      if (
        coupon.discountType ===
        "FIXED"
      ) {
        discountAmount = Number(
          coupon.discountValue || 0
        );
      }

      discountAmount = Math.min(
        discountAmount,
        subtotal
      );

      appliedCouponCode =
        coupon.code;
    }

    const totalAmount = Math.max(
      0,
      subtotal - discountAmount
    );

    const orderItems =
      cart.items.map((item) => {
        const selectedVariant =
          Array.isArray(
            item.product?.variants
          )
            ? item.product.variants.find(
                (variant) =>
                  variant?.color
                    ?.trim()
                    .toLowerCase() ===
                  item.color
                    ?.trim()
                    .toLowerCase()
              )
            : null;

        const itemImage =
          selectedVariant?.image ||
          item.product?.variants?.[0]
            ?.image ||
          "";

        return {
          product:
            item.product._id,

          customization:
            item.customization,

          size: item.size,

          color: item.color,

          quantity:
            item.quantity,

          price: item.price,

          image: itemImage,
        };
      });

    session.startTransaction();

    const createdOrders =
      await Order.create(
        [
          {
            user:
              req.user.userId,

            items:
              orderItems,

            shippingAddress: {
              fullName:
                shippingAddress.fullName.trim(),

              phone:
                shippingAddress.phone.trim(),

              addressLine:
                shippingAddress.addressLine.trim(),

              city:
                shippingAddress.city.trim(),

              state:
                shippingAddress.state.trim(),

              pincode:
                shippingAddress.pincode.trim(),
            },

            subtotal,

            discountAmount,

            couponCode:
              appliedCouponCode,

            totalAmount,

            paymentMethod:
              selectedPaymentMethod,

            paymentStatus:
              "PENDING",

            orderStatus:
              "PLACED",
          },
        ],
        {
          session,
        }
      );

    const order =
      createdOrders[0];

    if (
      selectedPaymentMethod ===
      "COD"
    ) {
      for (const item of cart.items) {
        const updatedProduct =
          await Product.findOneAndUpdate(
            {
              _id:
                item.product._id,

              isActive: true,

              stock: {
                $gte:
                  item.quantity,
              },
            },
            {
              $inc: {
                stock:
                  -item.quantity,
              },
            },
            {
              new: true,
              session,
            }
          );

        if (!updatedProduct) {
          throw new Error(
            `Insufficient stock for ${item.product.name}`
          );
        }
      }

      if (coupon) {
        const couponQuery = {
          _id:
            coupon._id,

          isActive:
            true,

          usedCount: {
            $gte: 0,
          },
        };

        if (coupon.usageLimit) {
          couponQuery.usedCount = {
            $lt:
              coupon.usageLimit,
          };
        }

        const updatedCoupon =
          await Coupon.findOneAndUpdate(
            couponQuery,
            {
              $inc: {
                usedCount: 1,
              },
            },
            {
              new: true,
              session,
            }
          );

        if (!updatedCoupon) {
          throw new Error(
            "Coupon usage limit reached"
          );
        }
      }

      cart.items = [];
      cart.totalAmount = 0;

      await cart.save({
        session,
      });
    }

    await session.commitTransaction();

    const populatedOrder =
      await Order.findById(
        order._id
      )
        .populate(
          "items.product"
        )
        .populate({
          path: "items.customization",
          populate: {
            path: "design",
          },
        });

    return res.status(201).json({
      message:
        selectedPaymentMethod ===
        "ONLINE"
          ? "Order created. Complete online payment."
          : "Order created successfully",

      order:
        populatedOrder,
    });

  } catch (error) {
    if (
      session.inTransaction()
    ) {
      await session.abortTransaction();
    }

    console.error(
      "Create order error:",
      error
    );

    return res.status(500).json({
      message:
        error.message ||
        "Server error",
    });

  } finally {
    await session.endSession();
  }
};

const getMyOrders = async (
  req,
  res
) => {
  try {
    const orders =
      await Order.find({
        user:
          req.user.userId,
      })
        .populate(
          "items.product"
        )
        .populate({
          path: "items.customization",
          populate: {
            path: "design",
          },
        })
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      orders,
    });

  } catch (error) {
    console.error(
      "Get orders error:",
      error
    );

    return res.status(500).json({
      message:
        "Server error",
    });
  }
};

const getOrderById = async (
  req,
  res
) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid order ID",
      });
    }

    const order =
      await Order.findOne({
        _id:
          req.params.id,

        user:
          req.user.userId,
      })
        .populate(
          "items.product"
        )
        .populate({
          path: "items.customization",
          populate: {
            path: "design",
          },
        });

    if (!order) {
      return res.status(404).json({
        message:
          "Order not found",
      });
    }

    return res.status(200).json({
      order,
    });

  } catch (error) {
    console.error(
      "Get order error:",
      error
    );

    return res.status(500).json({
      message:
        "Server error",
    });
  }
};

const cancelOrder = async (
  req,
  res
) => {
  const session =
    await mongoose.startSession();

  try {
    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid order ID",
      });
    }

    const reason =
      req.body?.reason?.trim();

    if (!reason) {
      return res.status(400).json({
        message:
          "Cancellation reason is required",
      });
    }

    if (reason.length < 5) {
      return res.status(400).json({
        message:
          "Cancellation reason must be at least 5 characters",
      });
    }

    if (reason.length > 500) {
      return res.status(400).json({
        message:
          "Cancellation reason cannot exceed 500 characters",
      });
    }

    const order =
      await Order.findOne({
        _id:
          req.params.id,

        user:
          req.user.userId,
      });

    if (!order) {
      return res.status(404).json({
        message:
          "Order not found",
      });
    }

    if (
      order.orderStatus ===
      "CANCELLED"
    ) {
      return res.status(400).json({
        message:
          "Order is already cancelled",
      });
    }

    if (
      ![
        "PLACED",
        "CONFIRMED",
      ].includes(
        order.orderStatus
      )
    ) {
      return res.status(400).json({
        message:
          "Order cannot be cancelled at this stage",
      });
    }

    if (
      order.paymentMethod ===
      "ONLINE"
    ) {

      if (
        order.paymentStatus ===
        "PAID"
      ) {

        if (!order.paymentId) {
          return res.status(400).json({
            message:
              "Razorpay payment ID is missing. Refund cannot be processed.",
          });
        }

        if (
          !process.env.RAZORPAY_KEY_ID ||
          !process.env.RAZORPAY_KEY_SECRET
        ) {
          return res.status(500).json({
            message:
              "Razorpay configuration is missing on server.",
          });
        }

        const razorpay =
          new Razorpay({
            key_id:
              process.env.RAZORPAY_KEY_ID,

            key_secret:
              process.env.RAZORPAY_KEY_SECRET,
          });

        let razorpayPayment;

        try {
          razorpayPayment =
            await razorpay.payments.fetch(
              order.paymentId
            );

        } catch (paymentError) {
          console.error(
            "Razorpay payment fetch error:",
            paymentError
          );

          return res.status(400).json({
            message:
              paymentError?.error?.description ||
              paymentError?.description ||
              paymentError?.message ||
              "Unable to verify Razorpay payment.",
          });
        }

        if (
          razorpayPayment?.status !==
          "captured"
        ) {
          return res.status(400).json({
            message:
              `Razorpay payment is not captured. Current status: ${
                razorpayPayment?.status ||
                "unknown"
              }`,
          });
        }

        const refundAmount =
          Math.round(
            Number(
              order.totalAmount
            ) * 100
          );

        if (
          !Number.isFinite(
            refundAmount
          ) ||
          refundAmount <= 0
        ) {
          return res.status(400).json({
            message:
              "Invalid refund amount.",
          });
        }

        const paymentAmount =
          Number(
            razorpayPayment?.amount ||
              0
          );

        const alreadyRefunded =
          Number(
            razorpayPayment?.amount_refunded ||
              0
          );

        if (
          paymentAmount > 0 &&
          alreadyRefunded >=
            paymentAmount
        ) {

          console.log(
            "Payment already fully refunded:",
            order.paymentId
          );

        } else {

          try {
            await razorpay.payments.refund(
              order.paymentId,
              {
                amount:
                  refundAmount,
              }
            );

          } catch (refundError) {
            console.error(
              "Razorpay refund error:",
              refundError
            );

            return res.status(400).json({
              message:
                refundError?.error?.description ||
                refundError?.description ||
                refundError?.message ||
                "Failed to process Razorpay refund. Order was not cancelled.",
            });
          }
        }

        session.startTransaction();

        for (
          const item of order.items
        ) {
          await Product.findByIdAndUpdate(
            item.product,
            {
              $inc: {
                stock:
                  item.quantity,
              },
            },
            {
              session,
            }
          );
        }

        if (
          order.couponCode
        ) {
          await Coupon.findOneAndUpdate(
            {
              code:
                order.couponCode,

              usedCount: {
                $gt: 0,
              },
            },
            {
              $inc: {
                usedCount: -1,
              },
            },
            {
              session,
            }
          );
        }

        order.orderStatus =
          "CANCELLED";

        order.cancellationReason =
          reason;

        await order.save({
          session,
        });

        await session.commitTransaction();

        return res.status(200).json({
          message:
            "Order cancelled and refund processed successfully.",
          order,
        });
      }

      session.startTransaction();

      order.orderStatus =
        "CANCELLED";

      order.cancellationReason =
        reason;

      await order.save({
        session,
      });

      await session.commitTransaction();

      return res.status(200).json({
        message:
          "Online order cancelled successfully.",
        order,
      });
    }

    session.startTransaction();

    for (
      const item of order.items
    ) {
      await Product.findByIdAndUpdate(
        item.product,
        {
          $inc: {
            stock:
              item.quantity,
          },
        },
        {
          session,
        }
      );
    }

    if (
      order.couponCode
    ) {
      await Coupon.findOneAndUpdate(
        {
          code:
            order.couponCode,

          usedCount: {
            $gt: 0,
          },
        },
        {
          $inc: {
            usedCount: -1,
          },
        },
        {
          session,
        }
      );
    }

    order.orderStatus =
      "CANCELLED";

    order.cancellationReason =
      reason;

    await order.save({
      session,
    });

    await session.commitTransaction();

    return res.status(200).json({
      message:
        "Order cancelled successfully.",
      order,
    });

  } catch (error) {

    if (
      session.inTransaction()
    ) {
      await session.abortTransaction();
    }

    console.error(
      "Cancel order error:",
      error
    );

    return res.status(500).json({
      message:
        error.message ||
        "Unable to cancel order",
    });

  } finally {
    await session.endSession();
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
};