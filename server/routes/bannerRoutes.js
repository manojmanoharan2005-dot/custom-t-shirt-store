const express = require("express");

const {
  createBanner,
  getActiveBanners,
  getAllBanners,
  updateBanner,
  deleteBanner,
} = require("../controllers/bannerController");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/", getActiveBanners);

router.get(
  "/all",
  protect,
  adminOnly,
  getAllBanners
);

router.post(
  "/",
  protect,
  adminOnly,
  upload.fields([
    {
      name: "leftImage",
      maxCount: 1,
    },
    {
      name: "rightImage",
      maxCount: 1,
    },
  ]),
  createBanner
);

router.put(
  "/:id",
  protect,
  adminOnly,
  upload.fields([
    {
      name: "leftImage",
      maxCount: 1,
    },
    {
      name: "rightImage",
      maxCount: 1,
    },
  ]),
  updateBanner
);

router.delete(
  "/:id",
  protect,
  adminOnly,
  deleteBanner
);

module.exports = router;