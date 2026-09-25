const Order = require("../models/Order");

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email phone")
      .populate("items.product", "name price images")
      .populate("items.customization")
      .sort({ createdAt: -1 });

    res.status(200).json({
      orders,
    });
  } catch (error) {
    console.error(
      "Get all orders error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, cancellationReason } =
      req.body;

    const allowedStatuses = [
      "PLACED",
      "CONFIRMED",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
    ];

    if (!allowedStatuses.includes(orderStatus)) {
      return res.status(400).json({
        message: "Invalid order status",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    const currentStatus = order.orderStatus;

    if (currentStatus === "CANCELLED") {
      return res.status(400).json({
        message:
          "Cancelled order status cannot be changed",
      });
    }

    if (currentStatus === orderStatus) {
      return res.status(400).json({
        message:
          `Order is already in ${currentStatus} status`,
      });
    }

    if (orderStatus === "CANCELLED") {
      const reason =
        typeof cancellationReason === "string"
          ? cancellationReason.trim()
          : "";

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

      order.orderStatus = "CANCELLED";
      order.cancellationReason = reason;

      await order.save();

      return res.status(200).json({
        message: "Order cancelled successfully",
        order,
      });
    }

    const allowedNextStatus = {
      PLACED: "CONFIRMED",
      CONFIRMED: "PROCESSING",
      PROCESSING: "SHIPPED",
      SHIPPED: "DELIVERED",
    };

    const expectedNextStatus =
      allowedNextStatus[currentStatus];

    if (!expectedNextStatus) {
      return res.status(400).json({
        message:
          `Order cannot be moved from ${currentStatus} status`,
      });
    }

    if (orderStatus !== expectedNextStatus) {
      return res.status(400).json({
        message:
          `Invalid status transition: ${currentStatus} → ${orderStatus}. ` +
          `Order must move to ${expectedNextStatus}.`,
      });
    }

    order.orderStatus = orderStatus;

    await order.save();

    return res.status(200).json({
      message:
        "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error(
      "Update order status error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  getAllOrders,
  updateOrderStatus,
};