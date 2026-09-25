const express = require("express");
const {
  getAllCustomers,
  getCustomerById,
  deleteCustomer,
} = require("../controllers/adminUserController");
const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");
const router = express.Router();
router.get(
  "/",
  protect,
  adminOnly,
  getAllCustomers
);
router.get(
  "/:id",
  protect,
  adminOnly,
  getCustomerById
);
router.delete(
  "/:id",
  protect,
  adminOnly,
  deleteCustomer
);

module.exports = router;