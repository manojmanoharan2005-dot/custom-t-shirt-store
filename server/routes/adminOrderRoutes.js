const express = require("express");
const {
  getAllOrders,
  updateOrderStatus,
} = require("../controllers/adminOrderController");
const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");
const router = express.Router();
router.get("/", protect, adminOnly, getAllOrders);
router.put("/:id/status", protect, adminOnly, updateOrderStatus);
module.exports = router;