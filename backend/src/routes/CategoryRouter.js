import express from "express";
import {
  getCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  addChildCategory,
  updateCategory,
  deleteCategory,
  getProductsByCategory,
} from "../controllers/CategoryController.js";

import { protect, authorizeRoles } from "../middlewares/AuthMiddleware.js";
// ✅ 1. IMPORT MIDDLEWARE UPLOAD
import upload from "../middlewares/UploadMiddleware.js";

const router = express.Router();

// =========================================================
// PUBLIC ROUTES
// =========================================================
router.get("/", getCategories);

// Tìm kiếm bằng slug (đặt trước ID để tránh conflict)
router.get("/slug/:slug", getCategoryBySlug);

// Lấy category theo ID
router.get("/:id", getCategoryById);

// Lấy sản phẩm theo ID category
router.get("/:id/products", getProductsByCategory);

// =========================================================
// PRIVATE ROUTES (ADMIN)
// =========================================================

// ✅ 2. THÊM upload.single('image') VÀO CÁC ROUTE TẠO/SỬA

// Tạo danh mục gốc
router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  upload.single("image"), // <-- Thêm ở đây
  createCategory
);

// Tạo danh mục con
router.post(
  "/:parentId/child",
  protect,
  authorizeRoles("admin"),
  upload.single("image"), // <-- Thêm ở đây
  addChildCategory
);

// Cập nhật danh mục
router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  upload.single("image"), // <-- Thêm ở đây
  updateCategory
);

// Xóa danh mục
router.delete("/:id", protect, authorizeRoles("admin"), deleteCategory);

export default router;
