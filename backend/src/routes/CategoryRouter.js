import express from "express";
import {
  getCategories,
  getCategoryById,
  // Thêm getCategoryBySlug vào đây
  getCategoryBySlug, 
  createCategory,
  addChildCategory,
  updateCategory,
  deleteCategory,
  getProductsByCategory
} from "../controllers/CategoryController.js"; // Đảm bảo đã thêm getCategoryBySlug vào file Controller

import { protect } from "../middlewares/AuthMiddleware.js";
import { authorizeRoles } from "../middlewares/RoleMiddleware.js";

const router = express.Router();

// Public
router.get("/", getCategories);

// PHẦN QUAN TRỌNG: Thêm route tìm kiếm bằng slug và đặt nó lên trước route tìm kiếm bằng ID
router.get("/slug/:slug", getCategoryBySlug); 

// Lấy category theo ID
router.get("/:id", getCategoryById);

// Lấy sản phẩm theo ID category (bao gồm con)
router.get("/:id/products", getProductsByCategory);

// Private (admin)
router.post("/", protect, authorizeRoles("admin"), createCategory);
router.post("/:parentId/child", protect, authorizeRoles("admin"), addChildCategory);
router.put("/:id", protect, authorizeRoles("admin"), updateCategory);
router.delete("/:id", protect, authorizeRoles("admin"), deleteCategory);

export default router;