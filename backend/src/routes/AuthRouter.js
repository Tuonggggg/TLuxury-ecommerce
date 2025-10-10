import express from "express";
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logout,
  forgotPassword,
  resetPassword,
} from "../controllers/AuthController.js";

const router = express.Router();

// @route   POST /api/auth/register
router.post("/register", registerUser);

// @route   POST /api/auth/login
router.post("/login", loginUser);

// @route   POST /api/auth/refresh (Làm mới Access Token)
router.post("/refresh", refreshAccessToken);

// @route   POST /api/auth/logout
router.post("/logout", logout);

router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:resetToken", resetPassword);

export default router;
