import mongoose from "mongoose";
import { removeVietnameseSigns } from "../utils/stringUtils.js";

function arrayLimit(val) {
  return val.length <= 5;
}

const productSchema = new mongoose.Schema(
  {
    // =======================================================
    // 🔹 THÔNG TIN CƠ BẢN
    // =======================================================
    name: { type: String, required: true, trim: true },
    name_no_sign: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    images: {
      type: [String],
      validate: [arrayLimit, "{PATH} vượt quá giới hạn 5 ảnh"],
    }, // ======================================================= // 🔹 TRẠNG THÁI & THÔNG TIN CHI TIẾT // =======================================================

    status: {
      type: String,
      enum: ["còn hàng", "hết hàng", "sắp về", "đặt trước"],
      default: "còn hàng",
    },
    brand: { type: String },
    size: { type: String },
    material: { type: String },
    origin: { type: String }, // ======================================================= // 🔹 GIÁ & KHO HÀNG // =======================================================

    price: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    stock: { type: Number, default: 0 }, // ✅ THÊM TRƯỜNG "SOLD" (ĐÃ BÁN)
    sold: { type: Number, default: 0 }, // ======================================================= // 🔹 LIÊN KẾT DANH MỤC // =======================================================

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    }, // ======================================================= // 🔹 ĐÁNH GIÁ NGƯỜI DÙNG // =======================================================

    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 }, // ======================================================= // ⚡ THÔNG TIN FLASH SALE // =======================================================

    flashSale: {
      isActive: { type: Boolean, default: false },
      startTime: { type: Date },
      endTime: { type: Date },
      flashPrice: { type: Number, min: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//
// 🧮 Giá cuối cùng (có tính Flash Sale hoặc Discount)
//
productSchema.virtual("finalPrice").get(function () {
  const now = new Date();
  if (
    this.flashSale?.isActive &&
    this.flashSale.startTime <= now &&
    this.flashSale.endTime >= now &&
    this.flashSale.flashPrice
  ) {
    return this.flashSale.flashPrice;
  }

  if (this.discount > 0) {
    return Math.round(this.price * (1 - this.discount / 100));
  }

  return this.price;
});

//
// 🧩 Trước khi save: tự cập nhật tên không dấu & trạng thái kho
//
productSchema.pre("save", function (next) {
  if (this.isModified("name") || this.isNew) {
    this.name_no_sign = removeVietnameseSigns(this.name);
  }

  if (
    this.isModified("stock") &&
    !["đặt trước", "sắp về"].includes(this.status)
  ) {
    if (this.stock <= 0) {
      this.status = "hết hàng";
    } else {
      this.status = "còn hàng";
    }
  }

  next();
});

//
// 🧩 Trước khi findOneAndUpdate: xử lý stock tăng/giảm
//
productSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  if (!update) return next(); // ✅ Cập nhật name_no_sign nếu đổi tên

  if (update.name) {
    update.name_no_sign = removeVietnameseSigns(update.name);
  }

  const stockChange = update.$inc?.stock;
  const newStockValue = update.stock; // Nếu có thay đổi về stock

  if (stockChange !== undefined || newStockValue !== undefined) {
    const currentDoc = await this.model.findOne(this.getQuery());
    if (!currentDoc) return next(); // Bỏ qua nếu không tìm thấy doc // 🧭 Tính toán stock mới

    let finalStock = currentDoc.stock ?? 0;
    if (stockChange !== undefined) finalStock += stockChange;
    if (newStockValue !== undefined) finalStock = newStockValue; // ✅ Nếu stock <= 0 → hết hàng

    if (
      finalStock <= 0 &&
      !["đặt trước", "sắp về"].includes(currentDoc.status)
    ) {
      update.status = "hết hàng";
    } // ✅ Nếu stock > 0 → còn hàng
    else if (
      finalStock > 0 &&
      currentDoc.status === "hết hàng" &&
      !["đặt trước", "sắp về"].includes(currentDoc.status)
    ) {
      update.status = "còn hàng";
    }
  }

  next();
});

const Product = mongoose.models.Product
  ? mongoose.model("Product")
  : mongoose.model("Product", productSchema);

export default Product;
