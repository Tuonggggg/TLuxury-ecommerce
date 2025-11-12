import express from "express";
import {
  // Hàm xử lý logic chính:
  checkout, // Tạo đơn hàng & khởi tạo thanh toán // Hàm xử lý callback cổng thanh toán (PUBLIC):
  vnpayCallback, // Nhận kết quả trả về từ VNPAY // Hàm quản lý đơn hàng (USER/ADMIN):
  getMyOrders,
  getOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  cancelOrder,
} from "../controllers/OrderController.js";

// [GUEST] Import thêm middleware 'checkOptionalAuth'
import {
  protect,
  authorizeRoles,
  checkOptionalAuth, // <-- THÊM VÀO
} from "../middlewares/authMiddleware.js"; // Đảm bảo đúng tên file

const router = express.Router();

// =======================================================
// 1. ROUTES CHÍNH (USER/CHECKOUT)
// =======================================================

// POST /api/orders (Checkout)
// [GUEST] Thay 'protect' bằng 'checkOptionalAuth'
router.post("/", checkOptionalAuth, checkout);

// POST /api/orders/checkout (Dự phòng)
// [GUEST] Thay 'protect' bằng 'checkOptionalAuth'
router.post("/checkout", checkOptionalAuth, checkout);

// GET /api/orders/my (User: xem đơn hàng của họ)
// (Giữ nguyên 'protect' - Chỉ user đăng nhập mới có "my orders")
router.get("/my", protect, getMyOrders);

// GET /api/orders/:id (Chi tiết 1 đơn hàng)
// [GUEST] Thay 'protect' bằng 'checkOptionalAuth'
// (Để khách có thể xem đơn hàng của họ bằng ID)
router.get("/:id", checkOptionalAuth, getOrderById);

// =======================================================
// 2. ROUTES CALLBACK CỔNG THANH TOÁN (PUBLIC)
// =======================================================

// GET /api/orders/vnpay-callback (Không đổi, vẫn public)
router.get("/vnpay-callback", vnpayCallback);

// =======================================================
// 3. ADMIN & USER ROUTES (ĐÃ BẢO VỆ)
// =======================================================

// GET /api/orders (Admin: xem tất cả đơn hàng)
// (Giữ nguyên 'protect' + 'admin')
router.get("/", protect, authorizeRoles("admin"), getOrders);

// PUT /api/orders/:id/cancel (User: Hủy đơn hàng)
// (Giữ nguyên 'protect' - Chỉ user đăng nhập mới được hủy)
router.put("/:id/cancel", protect, cancelOrder);

// PUT /api/orders/:id/status (Admin: cập nhật trạng thái)
// (Giữ nguyên 'protect' + 'admin')
router.put("/:id/status", protect, authorizeRoles("admin"), updateOrderStatus);

// DELETE /api/orders/:id (Admin: Xóa đơn hàng)
// (Giữ nguyên 'protect' + 'admin')
router.delete("/:id", protect, authorizeRoles("admin"), deleteOrder);

export default router;