import express from "express";
import {
  // Hàm xử lý logic chính:
  checkout,           // Tạo đơn hàng & khởi tạo thanh toán

  // Hàm xử lý callback cổng thanh toán (PUBLIC):
  momoCallback,       // Nhận IPN từ Momo
  vnpayCallback,     // Nhận kết quả trả về từ VNPAY

  // Hàm quản lý đơn hàng (USER/ADMIN):
  getMyOrders,       
  getOrders,
  getOrderById,
  updateOrderStatus,
  // ✅ IMPORT HÀM XÓA MỚI
  deleteOrder,
  cancelOrder, 
} from "../controllers/OrderController.js";

import { protect } from "../middlewares/AuthMiddleware.js";
import { authorizeRoles } from "../middlewares/RoleMiddleware.js";

const router = express.Router();

// =======================================================
// 1. ROUTES CHÍNH (USER/CHECKOUT)
// =======================================================

// POST /api/orders (Checkout)
router.post("/", protect, checkout); 

// POST /api/orders/checkout (Dự phòng)
router.post("/checkout", protect, checkout);

// GET /api/orders/my (User: xem đơn hàng của họ)
router.get("/my", protect, getMyOrders);

// GET /api/orders/:id (Chi tiết 1 đơn hàng)
router.get("/:id", protect, getOrderById);

// =======================================================
// 2. ROUTES CALLBACK CỔNG THANH TOÁN (PUBLIC)
// =======================================================

// POST /api/orders/momo-callback
router.post("/momo-callback", momoCallback);

// GET /api/orders/vnpay-callback
router.get("/vnpay-callback", vnpayCallback);

// =======================================================
// 3. ADMIN ROUTES
// =======================================================

// GET /api/orders (Admin: xem tất cả đơn hàng)
router.get("/", protect, authorizeRoles("admin"), getOrders);

router.put("/:id/cancel", protect, cancelOrder);

// PUT /api/orders/:id/status (Admin: cập nhật trạng thái)
router.put("/:id/status", protect, authorizeRoles("admin"), updateOrderStatus);

// ✅ THÊM ROUTE XÓA ĐƠN HÀNG
// DELETE /api/orders/:id
router.delete("/:id", protect, authorizeRoles("admin"), deleteOrder);


export default router;