import mongoose from "mongoose";

// Validator cho mảng ảnh
function arrayLimit(val) {
  return val.length <= 5;
}

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true }, // SEO
    description: { type: String },
    images: {
      type: [String],
      validate: [arrayLimit, '{PATH} vượt quá giới hạn 5 ảnh']
    },
    status: {
      type: String,
      enum: ["còn hàng", "hết hàng", "đặt trước"],
      default: "còn hàng"
    },
    brand: { type: String },
    size: { type: String },
    material: { type: String },
    origin: { type: String },
    price: { type: Number, required: true },
    discount: { type: Number, default: 0 }, // %
    stock: { type: Number, default: 0 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    rating: { type: Number, default: 0 }, // rating trung bình
    numReviews: { type: Number, default: 0 }, // số lượng review
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);
export default Product;
