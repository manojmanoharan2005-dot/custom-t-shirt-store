const express = require("express");

const {
  createCustomization,
  getCustomizationById,
  updateCustomization,
  deleteCustomization,
} = require("../controllers/customizationController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createCustomization);

router.get("/:id", protect, getCustomizationById);

router.put("/:id", protect, updateCustomization);

router.delete("/:id", protect, deleteCustomization);

module.exports = router;