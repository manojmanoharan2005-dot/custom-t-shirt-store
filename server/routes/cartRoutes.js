const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} = require("../controllers/cartController");
const router = express.Router();
router.post("/", protect, addToCart);
router.get("/", protect, getCart);
router.put("/:itemId", protect, updateCartItem);
router.delete("/:itemId", protect, removeFromCart);
router.delete("/", protect, clearCart);
module.exports = router;