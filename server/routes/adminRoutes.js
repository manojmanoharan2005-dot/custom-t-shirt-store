const express = require("express");
const {
  getDashboardStats,
} = require("../controllers/adminController");
const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");
const router = express.Router();
router.get(
  "/dashboard",
  protect,
  adminOnly,
  getDashboardStats
);
module.exports = router;