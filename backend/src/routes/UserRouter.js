import express from "express";
import {
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
} from "../controllers/UserController.js";
import { protect, admin } from "../middlewares/AuthMiddleware.js";

const router = express.Router();

// Profile của user hiện tại
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);

// Admin
router.get("/", protect, admin, getUsers);
router.delete("/:id", protect, admin, deleteUser);

export default router;
