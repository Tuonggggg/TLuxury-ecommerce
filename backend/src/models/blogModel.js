import mongoose from "mongoose";
// Đảm bảo bạn có file utility này
import { removeVietnameseSigns } from "../utils/stringUtils.js";

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    excerpt: { type: String, required: true, maxlength: 300 },
    content: { type: String, required: true }, // ✅ SỬA ĐỔI: Lưu cả URL và public_id
    featuredImage: {
      url: { type: String, required: true },
      public_id: { type: String, required: true },
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "published"], // Nháp hoặc Đã đăng
      default: "draft",
    },
    tags: [{ type: String }],
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Tự động tạo slug từ title
blogSchema.pre("save", function (next) {
  if (this.isModified("title") || this.isNew) {
    this.slug = removeVietnameseSigns(this.title)
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "");
  }
  next();
});

// Fix lỗi OverwriteModelError
const Blog = mongoose.models.Blog || mongoose.model("Blog", blogSchema);

export default Blog;
