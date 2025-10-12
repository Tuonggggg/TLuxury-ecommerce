import mongoose from "mongoose";
// 🚨 IMPORT HÀM TỪ FILE UTILS
import { removeVietnameseSigns } from "../utils/stringUtils.js";

// Validator cho mảng ảnh
function arrayLimit(val) {
  return val.length <= 5;
}

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    // Trường tên không dấu
    name_no_sign: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    images: {
      type: [String],
      validate: [arrayLimit, "{PATH} vượt quá giới hạn 5 ảnh"],
    },
    status: {
      type: String,
      enum: ["còn hàng", "hết hàng", "đặt trước"],
      default: "còn hàng",
    },
    brand: { type: String },
    size: { type: String },
    material: { type: String },
    origin: { type: String },
    price: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// PRE-SAVE HOOK: Tự động cập nhật name_no_sign khi tạo mới hoặc cập nhật trường 'name'
productSchema.pre("save", function (next) {
  if (this.isModified("name") || this.isNew) {
    // ✅ SỬ DỤNG HÀM ĐÃ IMPORT
    this.name_no_sign = removeVietnameseSigns(this.name);
  }
  next();
});

// PRE-UPDATE HOOK: Xử lý cập nhật findOneAndUpdate
productSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update.name) {
    // ✅ SỬ DỤNG HÀM ĐÃ IMPORT
    update.name_no_sign = removeVietnameseSigns(update.name);
  }
  next();
});

const Product = mongoose.model("Product", productSchema);
export default Product;
