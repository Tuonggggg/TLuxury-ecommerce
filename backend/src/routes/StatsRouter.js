import express from "express";
import {
  getDashboardSummary,
  getChartStats,
  getSuccessfulOrders,
} from "../controllers/StatsController.js";
import { protect, authorizeRoles } from "../middlewares/AuthMiddleware.js";

const router = express.Router();

router.get("/summary", protect, authorizeRoles("admin"), getDashboardSummary);
router.get("/chart", protect, authorizeRoles("admin"), getChartStats);

// ✅ Route mới: Danh sách đơn hàng thành công
router.get("/orders/success", protect, authorizeRoles("admin"), getSuccessfulOrders);

export default router;
