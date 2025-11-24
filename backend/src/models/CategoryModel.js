import mongoose from "mongoose";
import { removeVietnameseSigns } from "../utils/stringUtils.js"; // (Tùy chọn: nếu bạn muốn dùng hàm này trong model)

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true }, // ============================================= // ✅ ĐÃ THÊM TRƯỜNG ẢNH (Lưu URL) // =============================================
    image: { type: String, default: null },

    // Đường dẫn tùy chỉnh (nếu bạn muốn link đặc biệt như /flash-sale)
    customPath: { type: String, default: null },

    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    children: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
  },
  { timestamps: true }
);

// Middleware: Tự động thêm ID của con vào mảng children của cha khi tạo mới
categorySchema.pre("save", async function (next) {
  if (this.parent) {
    const parentCategory = await mongoose
      .model("Category")
      .findById(this.parent);
    // Kiểm tra để tránh duplicates
    if (parentCategory && !parentCategory.children.includes(this._id)) {
      parentCategory.children.push(this._id);
      await parentCategory.save();
    }
  }
  next();
});

// Middleware: Tự động xóa ID khỏi cha khi danh mục con bị xóa (Tùy chọn thêm)
categorySchema.pre("remove", async function (next) {
  if (this.parent) {
    await mongoose
      .model("Category")
      .updateOne({ _id: this.parent }, { $pull: { children: this._id } });
  }
  next();
});

const Category = mongoose.models.Category
  ? mongoose.model("Category")
  : mongoose.model("Category", categorySchema);

export default Category;
