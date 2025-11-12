import mongoose from "mongoose";

const discountSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    description: {
      type: String,
    },
    type: {
      // Loại giảm giá: 'fixed' (số tiền cố định) hoặc 'percent' (phần trăm)
      type: String,
      enum: ["fixed", "percent"],
      required: true,
    },
    value: {
      // Giá trị giảm (số tiền hoặc tỷ lệ phần trăm)
      type: Number,
      required: true,
    },
    minOrder: {
      // Giá trị đơn hàng tối thiểu để áp dụng
      type: Number,
      default: 0,
    },
    maxDiscount: {
      // Số tiền giảm tối đa (chỉ áp dụng cho 'percent')
      type: Number,
      default: 0,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    usageLimit: {
      // ✅ Trường này thường nên được thêm vào
      type: Number,
      default: 1000,
    },
    usedCount: {
      // ✅ Trường này cần thiết để theo dõi giới hạn
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ✅ FIX LỖI: Sử dụng pattern kiểm tra Model đã tồn tại
const Discount =
  mongoose.models.Discount || mongoose.model("Discount", discountSchema);

export default Discount;
