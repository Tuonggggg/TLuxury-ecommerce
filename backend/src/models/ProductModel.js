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
    price: { type: Number, required: true, min: 0 }, // Thêm min: 0
    discount: { type: Number, default: 0, min: 0, max: 100 }, // ✅ Đảm bảo discount từ 0 đến 100
    stock: { type: Number, default: 0 },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    // 🔑 Cấu hình quan trọng: Bật virtuals khi chuyển đổi sang JSON/Object
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// =======================================================
// ✅ VIRTUALS: TÍNH TOÁN GIÁ CUỐI CÙNG (FINAL PRICE)
// =======================================================

/**
 * Tự động tính giá sau giảm (finalPrice) dựa trên price và discount.
 * Giá này KHÔNG được lưu trong DB, chỉ được tính khi truy vấn.
 */
productSchema.virtual("finalPrice").get(function () {
  if (this.discount > 0) {
    // Tính toán và làm tròn giá sau giảm
    return Math.round(this.price * (1 - this.discount / 100));
  }
  // Trả về giá gốc nếu không có giảm giá
  return this.price;
});

// =======================================================
// HOOKS TỰ ĐỘNG CẬP NHẬT TÊN KHÔNG DẤU (Giữ nguyên)
// =======================================================

productSchema.pre("save", function (next) {
  if (this.isModified("name") || this.isNew) {
    this.name_no_sign = removeVietnameseSigns(this.name);
  }
  next();
});

productSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update.name) {
    update.name_no_sign = removeVietnameseSigns(update.name);
  }
  next();
});

const Product = mongoose.model("Product", productSchema);
export default Product;
