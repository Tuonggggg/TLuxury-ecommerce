import express from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../controllers/CartController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getCart);                 // Lấy giỏ hàng
router.post("/", protect, addToCart);              // Thêm sản phẩm
router.put("/:productId", protect, updateCartItem);// Cập nhật số lượng
router.delete("/:productId", protect, removeFromCart); // Xóa 1 sản phẩm
router.delete("/", protect, clearCart);            // Xóa toàn bộ giỏ

export default router;
