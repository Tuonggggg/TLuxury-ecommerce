import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    orderItems: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        name: { type: String, required: true },
        images: [{ type: String }],       // lưu ảnh sản phẩm tại thời điểm đặt
        qty: { type: Number, required: true },
        price: { type: Number, required: true },       // giá gốc
        discount: { type: Number, default: 0 },       // giảm giá %
        status: {                                     // tình trạng sản phẩm khi đặt
          type: String,
          enum: ["còn hàng", "hết hàng", "đặt trước"],
          default: "còn hàng"
        }
      },
    ],
    shippingAddress: {
      address: { type: String, required: true },
      city: { type: String },
      postalCode: { type: String },
      country: { type: String }
    },
    totalPrice: { type: Number, required: true },
    paymentMethod: { type: String, required: true, default: "COD" }, // COD, BankTransfer, PayPal
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
