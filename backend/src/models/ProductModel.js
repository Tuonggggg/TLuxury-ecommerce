import mongoose from "mongoose";
// 🚨 IMPORT HÀM TỪ FILE UTILS
import { removeVietnameseSigns } from "../utils/stringUtils.js";

// Validator cho mảng ảnh
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
      // ✅ FIX 1: Thêm giá trị "đặt trước" vào Enum
      enum: ["còn hàng", "hết hàng", "sắp về", "đặt trước"],
      default: "còn hàng",
    },
    brand: { type: String },
    size: { type: String },
    material: { type: String },
    origin: { type: String }, // ======================================================= // 🔹 GIÁ & KHO HÀNG // =======================================================

    price: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    stock: { type: Number, default: 0 }, // ======================================================= // 🔹 LIÊN KẾT DANH MỤC // =======================================================

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

productSchema.pre("save", function (next) {
  // 1. Cập nhật tên không dấu (Giữ nguyên)
  if (this.isModified("name") || this.isNew) {
    this.name_no_sign = removeVietnameseSigns(this.name);
  }

  // 2. Cập nhật trạng thái khi gọi .save()
  // Logic này sẽ chạy khi tạo sản phẩm hoặc khi admin thay đổi thủ công
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

productSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();

  // Cập nhật tên không dấu (Giữ nguyên)
  if (update.name) {
    update.name_no_sign = removeVietnameseSigns(update.name);
  } // Lấy giá trị stock mới (có thể là $set.stock hoặc $inc.stock nếu là trừ kho)

  // ✅ FIX 2: Logic TỰ ĐỘNG CẬP NHẬT TRẠNG THÁI KHI TRỪ KHO (findByIdAndUpdate)
  // Trường hợp trừ kho (OrderController) thường dùng $inc, nên ta cần kiểm tra $inc.stock
  const stockChange = update.$inc?.stock;
  const newStockValue = update.stock; // Nếu là update bằng findByIdAndUpdate(..., {stock: X})

  // Nếu có sự thay đổi về stock (cả $inc và $set)
  if (stockChange !== undefined || newStockValue !== undefined) {
    // Cần phải chạy một truy vấn nhẹ để lấy trạng thái hiện tại (hoặc giá trị stock hiện tại)
    // Tuy nhiên, việc tính toán trạng thái dựa trên $inc/giá trị cũ là phức tạp.

    // CÁCH AN TOÀN NHẤT: Chỉ định rõ trạng thái nếu giá trị stock là <= 0
    if (stockChange < 0 || newStockValue === 0) {
      // Nếu đây là giao dịch trừ kho hoặc set stock về 0, và trạng thái hiện tại không phải đặt trước/sắp về
      const currentStatus = this.get("status");

      if (!["đặt trước", "sắp về"].includes(currentStatus)) {
        // Ta chỉ set trạng thái = 'hết hàng' khi stock <= 0
        // Nếu stock > 0, ta không cần set status vì nó đã là 'còn hàng'
        update.status = "hết hàng";
      }
    }
  }

  /* Lưu ý: Logic kiểm tra this.get("status") trong pre-findOneAndUpdate
    CHỈ lấy trạng thái HIỆN TẠI TRONG DB, chứ không phải trạng thái mới sau khi trừ.
    Vì vậy, logic trên là tốt nhất: nếu có thay đổi stock (trừ), ta chỉ kiểm tra và set 'hết hàng'
    nếu stock về 0 hoặc bị trừ.
    */

  next();
});

const Product = mongoose.models.Product
  ? mongoose.model("Product")
  : mongoose.model("Product", productSchema);
export default Product;
