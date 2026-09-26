const express = require("express");

const {
  createCustomization,
  getCustomizationById,
  updateCustomization,
  deleteCustomization,
} = require("../controllers/customizationController");

const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.post("/", protect, upload.any(), createCustomization);

router.get("/:id", protect, getCustomizationById);

router.put("/:id", protect, upload.any(), updateCustomization);

router.delete("/:id", protect, deleteCustomization);

module.exports = router;