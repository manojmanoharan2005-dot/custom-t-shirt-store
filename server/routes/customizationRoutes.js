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

router.post("/", protect, upload.single("userDesign"), createCustomization);

router.get("/:id", protect, getCustomizationById);

router.put("/:id", protect, upload.single("userDesign"), updateCustomization);

router.delete("/:id", protect, deleteCustomization);

module.exports = router;