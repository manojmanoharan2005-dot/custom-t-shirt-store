const express = require("express");

const {
  createDesign,
  getDesigns,
  updateDesign,
  deleteDesign,
} = require("../controllers/designController");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/", getDesigns);

router.post(
  "/",
  protect,
  adminOnly,
  upload.single("image"),
  createDesign
);

router.put(
  "/:id",
  protect,
  adminOnly,
  upload.single("image"),
  updateDesign
);

router.delete(
  "/:id",
  protect,
  adminOnly,
  deleteDesign
);

module.exports = router;