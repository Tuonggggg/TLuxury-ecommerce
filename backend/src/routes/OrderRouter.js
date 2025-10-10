import express from "express";
import {
  createOrder, // Giữ lại import này nếu cần cho mục đích khác
  getMyOrders,
  getOrders,
  getOrderById,
  updateOrderStatus,
  checkout, // HÀM CHÍNH
} from "../controllers/OrderController.js";

import { protect } from "../middlewares/AuthMiddleware.js";
import { authorizeRoles } from "../middlewares/RoleMiddleware.js";

const router = express.Router();

// 1. Checkout từ giỏ hàng (Đường dẫn chính dùng bởi Front-end)
// Front-end đang gọi POST /orders. Ta ánh xạ POST / sang hàm checkout.
router.post("/", protect, checkout); // ✅ Sử dụng 'checkout' thay vì 'createOrder' thủ công

// 2. Đường dẫn /checkout (Dự phòng, có thể dùng để gọi tường minh)
router.post("/checkout", protect, checkout);

// --- USER ROUTES ---
// User: xem đơn hàng của họ
router.get("/my", protect, getMyOrders);

// Chi tiết 1 đơn hàng
router.get("/:id", protect, getOrderById);

// --- ADMIN ROUTES ---
// Admin: xem tất cả đơn hàng
router.get("/", protect, authorizeRoles("admin"), getOrders);

// Admin: cập nhật trạng thái đơn hàng
router.put("/:id/status", protect, authorizeRoles("admin"), updateOrderStatus);

export default router;
