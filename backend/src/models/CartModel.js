import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        qty: {
          type: Number,
          required: true,
          default: 1,
          min: 1, // ✅ GIỚI HẠN TỐI THIỂU
          max: 5, // ✅ GIỚI HẠN TỐI ĐA LÀ 5
        },
        price: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
);

// ✅ FIX LỖI: Kiểm tra xem Model 'Cart' đã tồn tại chưa trước khi định nghĩa
const Cart = mongoose.models.Cart
  ? mongoose.model("Cart")
  : mongoose.model("Cart", cartSchema);

export default Cart;
