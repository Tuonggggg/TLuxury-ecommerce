import express from "express";
import dotenv from "dotenv";
import cors from "cors";
dotenv.config();

import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import cookieParser from "cookie-parser";

import connectDB from "./config/db.js";
import productRoutes from "./routes/ProductsRouter.js";
import authRoutes from "./routes/AuthRouter.js";
import categoryRoutes from "./routes/CategoryRouter.js";
import cartRoutes from "./routes/CartRouter.js";
import orderRoutes from "./routes/OrderRouter.js";
import statsRoutes from "./routes/StatsRouter.js";
import paymentRoutes from "./routes/PaymentRoutes.js";
import userRoutes from "./routes/UserRouter.js";
import blogRoutes from "./routes/BlogRouter.js";
import discountRoutes from "./routes/DiscountRoutes.js";

import { notFound, errorHandler } from "./middlewares/ErrorMiddleware.js";

// 1. IMPORT LOGIC CRON JOB
import runStockCleanup from "./cron/stockCleanup.js";

connectDB(); // Kết nối DB

const app = express();

// Basic security middlewares
app.use(helmet());
app.use(xss());
app.use(mongoSanitize());
app.use(cookieParser());

// CORS
const whitelist = (process.env.CORS_ORIGIN || "http://localhost:5173").split(
  ","
);
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "2mb" }));

// ✅ FIX LỖI "TOO MANY REQUESTS" (429)
// Chỉ áp dụng giới hạn request khi chạy ở môi trường production
if (process.env.NODE_ENV === "production") {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 100, // Tối đa 100 requests mỗi 15 phút
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);
  console.log("Rate Limiter: Đã kích hoạt (Production Mode)");
} else {
  console.log("Rate Limiter: Đã tắt (Development Mode)");
}
// ❌ Xóa dòng app.use(limiter); cũ ở đây

// 2. KHỞI CHẠY LOGIC CRON JOB
// runStockCleanup();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/discounts", discountRoutes);


// 404 + error handler
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server chạy trên port ${PORT}`));
