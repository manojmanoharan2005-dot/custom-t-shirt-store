const dotenv = require("dotenv");

dotenv.config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const designRoutes = require("./routes/designRoutes");
const customizationRoutes = require("./routes/customizationRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const couponRoutes = require("./routes/couponRoutes");
const bannerRoutes = require("./routes/bannerRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const adminRoutes = require("./routes/adminRoutes");
const adminOrderRoutes = require("./routes/adminOrderRoutes");
const adminUserRoutes = require("./routes/adminUserRoutes");

const allowedOrigins = [
  "https://customtee-sable.vercel.app",
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:5000",
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith(".vercel.app") ||
      origin.startsWith("http://localhost:")
    ) {
      return callback(null, true);
    }

    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
  ],
  optionsSuccessStatus: 200,
};

const app = express();

app.use(cors(corsOptions));
app.use(express.json());

app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;

    console.log(`${req.method} ${req.originalUrl} - ${duration}ms`);
  });

  next();
});

connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/designs", designRoutes);
app.use("/api/customizations", customizationRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/payments", paymentRoutes);

app.use("/api/admin", adminRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/admin/customers", adminUserRoutes);

app.get("/api", (req, res) => {
  res.status(200).json({
    success: true,
    message: "CUSTOMTEE API is running",
  });
});

app.get("/", (req, res) => {
  res.send("Custom T-Shirt Store API is running");
});

app.use((err, req, res, next) => {
  console.error("Global server error:", err.message || err);

  if (res.headersSent) {
    return next(err);
  }

  return res.status(err.status || 500).json({
    message: err.message || "Server error",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});