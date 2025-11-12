import express from "express";
import {
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
} from "../controllers/UserController.js";
// ✅ Import đúng
import { protect, authorizeRoles } from "../middlewares/AuthMiddleware.js";

const router = express.Router();

// Profile của user hiện tại
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);

// Admin
// ✅ FIX: Sửa 'admin' thành 'authorizeRoles("admin")'
router.get("/", protect, authorizeRoles("admin"), getUsers);
// ✅ FIX: Sửa 'admin' thành 'authorizeRoles("admin")'
router.delete("/:id", protect, authorizeRoles("admin"), deleteUser);

export default router;
