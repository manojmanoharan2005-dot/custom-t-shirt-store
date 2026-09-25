const Razorpay = require("razorpay");
const crypto = require("crypto");
const mongoose = require("mongoose");

const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createPaymentOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        message: "Order ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        message: "Invalid order ID",
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      user: req.user.userId,
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (order.paymentMethod !== "ONLINE") {
      return res.status(400).json({
        message:
          "This order is not an online payment order",
      });
    }

    if (order.paymentStatus === "PAID") {
      return res.status(400).json({
        message: "Order is already paid",
      });
    }

    if (order.orderStatus === "CANCELLED") {
      return res.status(400).json({
        message: "Cancelled order cannot be paid",
      });
    }

    if (order.razorpayOrderId) {
      return res.status(200).json({
        message: "Payment order already exists",

        paymentOrder: {
          id: order.razorpayOrderId,
          amount: Math.round(
            order.totalAmount * 100
          ),
          currency: "INR",
          orderId: order._id.toString(),
          keyId: process.env.RAZORPAY_KEY_ID,
        },
      });
    }

    const amountInPaise = Math.round(
      order.totalAmount * 100
    );

    if (amountInPaise <= 0) {
      return res.status(400).json({
        message: "Invalid order amount",
      });
    }

    const razorpayOrder =
      await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: order._id.toString(),
      });

    order.razorpayOrderId =
      razorpayOrder.id;

    await order.save();

    return res.status(200).json({
      message:
        "Payment order created successfully",

      paymentOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        orderId: order._id.toString(),
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error(
      "Create payment order error:",
      error.message
    );

    return res.status(500).json({
      message: "Unable to create payment order",
    });
  }
};

const verifyPayment = async (req, res) => {
  const session =
    await mongoose.startSession();

  try {
    const {
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    if (
      !orderId ||
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature
    ) {
      await session.endSession();

      return res.status(400).json({
        message:
          "Payment verification details are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      await session.endSession();

      return res.status(400).json({
        message: "Invalid order ID",
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      user: req.user.userId,
    });

    if (!order) {
      await session.endSession();

      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (order.paymentMethod !== "ONLINE") {
      await session.endSession();

      return res.status(400).json({
        message:
          "This order is not an online payment order",
      });
    }

    if (order.paymentStatus === "PAID") {
      await session.endSession();

      return res.status(400).json({
        message: "Order is already paid",
      });
    }

    if (order.orderStatus === "CANCELLED") {
      await session.endSession();

      return res.status(400).json({
        message:
          "Cancelled order cannot be paid",
      });
    }

    if (
      !order.razorpayOrderId ||
      razorpayOrderId !==
        order.razorpayOrderId
    ) {
      await session.endSession();

      return res.status(400).json({
        message: "Invalid Razorpay order",
      });
    }

    const secretKey = (
      process.env.RAZORPAY_KEY_SECRET || ""
    ).trim();

    const generatedSignature =
      crypto
        .createHmac(
          "sha256",
          secretKey
        )
        .update(
          `${razorpayOrderId}|${razorpayPaymentId}`
        )
        .digest("hex");

    const generatedBuffer =
      Buffer.from(
        generatedSignature,
        "utf8"
      );

    const receivedBuffer =
      Buffer.from(
        razorpaySignature,
        "utf8"
      );

    if (
      generatedBuffer.length !==
      receivedBuffer.length
    ) {
      order.paymentStatus = "FAILED";

      await order.save();

      await session.endSession();

      return res.status(400).json({
        message:
          "Payment verification failed",
      });
    }

    const signaturesMatch =
      crypto.timingSafeEqual(
        generatedBuffer,
        receivedBuffer
      );

    if (!signaturesMatch) {
      order.paymentStatus = "FAILED";

      await order.save();

      await session.endSession();

      return res.status(400).json({
        message:
          "Payment verification failed",
      });
    }

    session.startTransaction();

    const transactionOrder =
      await Order.findOne({
        _id: orderId,
        user: req.user.userId,
      }).session(session);

    if (!transactionOrder) {
      throw new Error(
        "Order not found during transaction"
      );
    }

    if (
      transactionOrder.paymentStatus ===
      "PAID"
    ) {
      await session.abortTransaction();
      await session.endSession();

      return res.status(400).json({
        message: "Order is already paid",
      });
    }

    if (
      transactionOrder.orderStatus ===
      "CANCELLED"
    ) {
      await session.abortTransaction();
      await session.endSession();

      return res.status(400).json({
        message:
          "Cancelled order cannot be paid",
      });
    }

    for (const item of transactionOrder.items) {
      const updatedProduct =
        await Product.findOneAndUpdate(
          {
            _id: item.product,
            isActive: true,
            stock: {
              $gte: item.quantity,
            },
          },
          {
            $inc: {
              stock: -item.quantity,
            },
          },
          {
            new: true,
            session,
          }
        );

      if (!updatedProduct) {
        throw new Error(
          "Insufficient stock or product is no longer available"
        );
      }
    }

    if (transactionOrder.couponCode) {
      const coupon =
        await Coupon.findOne({
          code:
            transactionOrder.couponCode,
          isActive: true,
        }).session(session);

      if (!coupon) {
        throw new Error(
          "Coupon is no longer available"
        );
      }

      if (
        coupon.expiryDate &&
        new Date() >
          new Date(coupon.expiryDate)
      ) {
        throw new Error(
          "Coupon has expired"
        );
      }

      const couponFilter = {
        _id: coupon._id,
        isActive: true,
      };

      if (coupon.usageLimit) {
        couponFilter.usedCount = {
          $lt: coupon.usageLimit,
        };
      }

      const updatedCoupon =
        await Coupon.findOneAndUpdate(
          couponFilter,
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

    transactionOrder.paymentStatus =
      "PAID";

    transactionOrder.paymentId =
      razorpayPaymentId;

    await transactionOrder.save({
      session,
    });

    await Cart.findOneAndUpdate(
      {
        user: req.user.userId,
      },
      {
        $set: {
          items: [],
          totalAmount: 0,
        },
      },
      {
        session,
      }
    );

    await session.commitTransaction();
    await session.endSession();

    const updatedOrder =
      await Order.findById(
        transactionOrder._id
      )
        .populate("items.product")
        .populate("items.customization");

    return res.status(200).json({
      message:
        "Payment verified successfully",

      order: updatedOrder,
    });
  } catch (error) {
    try {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
    } catch (transactionError) {
      console.error(
        "Transaction rollback error:",
        transactionError.message
      );
    }

    await session.endSession();

    console.error(
      "Verify payment error:",
      error.message
    );

    const knownErrors = [
      "Insufficient stock or product is no longer available",
      "Coupon is no longer available",
      "Coupon has expired",
      "Coupon usage limit reached",
    ];

    if (knownErrors.includes(error.message)) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message:
        "Payment verification failed",
    });
  }
};

const markPaymentFailed = async (
  req,
  res
) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        message: "Order ID is required",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        orderId
      )
    ) {
      return res.status(400).json({
        message: "Invalid order ID",
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      user: req.user.userId,
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (order.paymentMethod !== "ONLINE") {
      return res.status(400).json({
        message:
          "This order is not an online payment order",
      });
    }

    if (order.paymentStatus === "PAID") {
      return res.status(400).json({
        message:
          "Paid order cannot be marked as failed",
      });
    }

    if (
      order.orderStatus ===
      "CANCELLED"
    ) {
      return res.status(200).json({
        message:
          "Order is already cancelled",
        order,
      });
    }

    order.paymentStatus = "FAILED";
    order.orderStatus = "CANCELLED";

    await order.save();

    return res.status(200).json({
      message:
        "Payment failed and order cancelled",
      order,
    });
  } catch (error) {
    console.error(
      "Mark payment failed error:",
      error.message
    );

    return res.status(500).json({
      message:
        "Unable to update payment status",
    });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  markPaymentFailed,
};