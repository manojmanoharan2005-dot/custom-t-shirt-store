const express = require("express");

const {
  createPaymentOrder,
  verifyPayment,
  markPaymentFailed,
} = require("../controllers/paymentController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/create",
  protect,
  createPaymentOrder
);

router.post(
  "/verify",
  protect,
  verifyPayment
);

router.post(
  "/failed",
  protect,
  markPaymentFailed
);

module.exports = router;