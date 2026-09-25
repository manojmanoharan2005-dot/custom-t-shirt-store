const User = require("../models/User");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Order = require("../models/Order");

const getDashboardStats = async (req, res) => {
  try {
    const totalCustomers = await User.countDocuments({
      role: "customer",
    });

    const totalProducts = await Product.countDocuments({
      isActive: true,
    });
    const totalCategories = await Category.countDocuments({
      isActive: true,
    });

    const totalOrders = await Order.countDocuments();

    const pendingOrders = await Order.countDocuments({
      orderStatus: {
        $in: [
          "PLACED",
          "CONFIRMED",
          "PROCESSING",
        ],
      },
    });

    const completedOrders = await Order.countDocuments({
      orderStatus: "DELIVERED",
    });

    const lowStockProducts = await Product.countDocuments({
      isActive: true,
      stock: {
        $lte: 5,
      },
    });

    const revenueResult = await Order.aggregate([
      {
        $match: {
          paymentStatus: "PAID",
          orderStatus: {
            $ne: "CANCELLED",
          },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: "$totalAmount",
          },
        },
      },
    ]);

    const totalRevenue =
      revenueResult.length > 0
        ? revenueResult[0].totalRevenue
        : 0;

    const recentOrders = await Order.find()
      .populate(
        "user",
        "name email"
      )
      .sort({
        createdAt: -1,
      })
      .limit(5);

    res.status(200).json({
      dashboard: {
        totalCustomers,
        totalProducts,
        totalCategories,
        totalOrders,
        totalRevenue,
        pendingOrders,
        completedOrders,
        lowStockProducts,
        recentOrders,
      },
    });
  } catch (error) {
    console.error(
      "Get dashboard stats error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  getDashboardStats,
};