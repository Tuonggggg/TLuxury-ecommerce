import asyncHandler from "express-async-handler";
import Blog from "../models/blogModel.js";
import { cloudinary } from "../config/cloudinary.js";
import { removeVietnameseSigns } from "../utils/stringUtils.js";

// =========================================================
// 🌍 PUBLIC: LẤY DANH SÁCH BÀI VIẾT CHO NGƯỜI DÙNG
// =========================================================
export const getPosts = asyncHandler(async (req, res) => {
  const { status, limit } = req.query;
  const max = parseInt(limit) || 20;

  // 🧑‍💼 Nếu có JWT và là admin → có thể xem tất cả (draft, public,...)
  if (req.user && req.user.role === "admin") {
    const query = status && status !== "all" ? { status } : {};
    const blogs = await Blog.find(query)
      .populate("author", "username")
      .sort({ createdAt: -1 })
      .limit(max);
    return res.status(200).json({ posts: blogs });
  }

  // 🌍 Người dùng chỉ xem bài có status = "public"
  const blogs = await Blog.find({ status: "published" })
    .populate("author", "username")
    .sort({ createdAt: -1 })
    .limit(max);

  return res.status(200).json({ posts: blogs });
});

// =========================================================
// 🧑‍💼 ADMIN: LẤY TẤT CẢ BÀI VIẾT (DÙ LÀ DRAFT HAY PUBLIC)
// =========================================================
export const getAllPostsForAdmin = async (req, res) => {
  try {
    console.log("👑 Admin user:", req.user);
    const posts = await Blog.find({})
      .populate("author", "username")
      .sort({ createdAt: -1 });

    console.log("📝 Tổng số bài viết tìm thấy:", posts.length);
    res.json({ posts });
  } catch (err) {
    console.error("❌ Lỗi lấy bài viết Admin:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// =========================================================
// 📄 PUBLIC: LẤY BÀI VIẾT THEO SLUG
// =========================================================
export const getPostBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const post = await Blog.findOne({ slug }).populate("author", "username");

  if (!post) {
    res.status(404);
    throw new Error("Không tìm thấy bài viết.");
  }

  // 🌍 Nếu bài chưa public và không phải admin → cấm truy cập
  if (post.status !== "published" && (!req.user || req.user.role !== "admin")) {
    res.status(403);
    throw new Error("Bạn không có quyền xem bài viết này.");
  }

  // ✅ Chỉ tăng views nếu bài public
  if (post.status === "published") {
    await post.updateOne({ $inc: { views: 1 } });
  }

  res.status(200).json(post);
});

// =========================================================
// 🔒 ADMIN: TẠO BÀI VIẾT
// =========================================================
export const createPost = asyncHandler(async (req, res) => {
  const { title, excerpt, content, status, tags } = req.body;
  const author = req.user?._id; // có thể null nếu public cho tất cả

  if (!title || !excerpt || !content) {
    res.status(400);
    throw new Error("Vui lòng điền đầy đủ tiêu đề, tóm tắt và nội dung.");
  }

  let uploadedFile = req.file;
  if (!uploadedFile && Array.isArray(req.files) && req.files.length > 0) {
    uploadedFile = req.files[0];
  }

  if (!uploadedFile) {
    res.status(400);
    throw new Error("Vui lòng tải lên ảnh đại diện (featuredImage).");
  }

  const featuredImage = {
    url: uploadedFile.path,
    public_id: uploadedFile.filename,
  };

  const slug = removeVietnameseSigns(title)
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");

  const slugExists = await Blog.findOne({ slug });
  if (slugExists) {
    res.status(400);
    throw new Error("Slug đã tồn tại, vui lòng đổi tiêu đề khác.");
  }

  const newPost = new Blog({
    title,
    slug,
    excerpt,
    content,
    status: status || "draft",
    tags: tags ? tags.split(",") : [],
    author,
    featuredImage,
  });

  const created = await newPost.save();
  await created.populate("author", "username");
  res.status(201).json(created);
});

// =========================================================
// 🔒 ADMIN: CẬP NHẬT BÀI VIẾT
// =========================================================
export const updatePost = asyncHandler(async (req, res) => {
  const { title, excerpt, content, status, tags } = req.body;
  const post = await Blog.findById(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error("Không tìm thấy bài viết.");
  }

  post.title = title || post.title;
  post.excerpt = excerpt || post.excerpt;
  post.content = content || post.content;
  post.status = status || post.status;
  post.tags = tags ? tags.split(",") : post.tags;

  let uploadedFile = req.file;
  if (!uploadedFile && Array.isArray(req.files) && req.files.length > 0) {
    uploadedFile = req.files[0];
  }

  if (uploadedFile) {
    if (post.featuredImage?.public_id) {
      await cloudinary.uploader.destroy(post.featuredImage.public_id);
    }
    post.featuredImage = {
      url: uploadedFile.path,
      public_id: uploadedFile.filename,
    };
  }

  const updated = await post.save();
  await updated.populate("author", "username");
  res.status(200).json(updated);
});

// =========================================================
// 🔒 ADMIN: XOÁ BÀI VIẾT
// =========================================================
export const deletePost = asyncHandler(async (req, res) => {
  const post = await Blog.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error("Không tìm thấy bài viết.");
  }

  if (post.featuredImage?.public_id) {
    await cloudinary.uploader.destroy(post.featuredImage.public_id);
  }

  await post.deleteOne();
  res.json({ message: "Đã xoá bài viết thành công." });
});
