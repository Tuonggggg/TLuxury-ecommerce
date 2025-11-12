import express from "express";
import {
  createPost,
  getPosts,
  getPostBySlug,
  updatePost,
  deletePost,
  getAllPostsForAdmin,
} from "../controllers/BlogController.js";
import { protect, authorizeRoles } from "../middlewares/AuthMiddleware.js";
import upload from "../middlewares/UploadMiddleware.js";

const router = express.Router();

// 🟢 PUBLIC ROUTES (người dùng xem bài viết public)
router.get("/", getPosts); // không cần JWT
router.get("/slug/:slug", getPostBySlug);

// 🔒 ADMIN ROUTES (chỉ admin được phép)
router.get("/all", protect, authorizeRoles("admin"), getAllPostsForAdmin);

router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  upload.single("featuredImage"),
  createPost
);

router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  upload.single("featuredImage"),
  updatePost
);

router.delete("/:id", protect, authorizeRoles("admin"), deletePost);

export default router;
