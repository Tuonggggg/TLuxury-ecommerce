import express from "express";
import { payOrder } from "../controllers/PaymentController.js";
import { protect } from "../middlewares/AuthMiddleware.js";

const router = express.Router();

// Thanh toán đơn hàng
router.post("/:orderId", protect, payOrder);

export default router;
