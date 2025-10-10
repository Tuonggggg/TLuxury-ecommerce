import express from "express";
import dotenv from "dotenv";
import cors from "cors";
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
import paymentRoutes from "./routes/PaymentRoutes.js";
import userRoutes from "./routes/UserRouter.js";

import { notFound, errorHandler } from "./middlewares/ErrorMiddleware.js";

dotenv.config();

connectDB();

const app = express();

// Basic security middlewares (Giữ nguyên)
app.use(helmet());
app.use(xss());
app.use(mongoSanitize());
app.use(cookieParser());

// CORS (Giữ nguyên)
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

// Rate limiter (Giữ nguyên)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);

// 404 + error handler (Giữ nguyên)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server chạy trên port ${PORT}`));
