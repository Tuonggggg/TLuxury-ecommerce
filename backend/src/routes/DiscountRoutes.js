import express from "express";
import {
  applyDiscount,
  createDiscount, // Import hàm mới
  updateDiscount, // Import hàm mới
  deleteDiscount, // Import hàm mới
  getDiscounts, // Import hàm mới
} from "../controllers/DiscountController.js";
import { protect, authorizeRoles } from "../middlewares/AuthMiddleware.js";

const router = express.Router();

// PUBLIC/USER: Áp dụng mã
router.post("/apply", applyDiscount);

// 🔒 ADMIN: CRUD
router.get("/", protect, authorizeRoles("admin"), getDiscounts); // Lấy tất cả mã
router.post("/", protect, authorizeRoles("admin"), createDiscount); // Tạo mã mới
router.put("/:id", protect, authorizeRoles("admin"), updateDiscount); // Cập nhật mã
router.delete("/:id", protect, authorizeRoles("admin"), deleteDiscount); // Xóa mã

export default router;
