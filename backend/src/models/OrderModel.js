// models/orderModel.js
import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: { type: String, required: true },
  images: [{ type: String }],
  qty: { type: Number, required: true },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["còn hàng", "hết hàng", "đặt trước"],
    default: "còn hàng",
  },
});

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    orderItems: [orderItemSchema],

    shippingAddress: {
      name: { type: String },
      phone: { type: String },
      email: { type: String },
      address: { type: String, required: true },
      city: { type: String },
      postalCode: { type: String },
      country: { type: String },
    },

    itemsPrice: { type: Number, required: true, default: 0 },
    shippingPrice: { type: Number, required: true, default: 0 },
    taxPrice: { type: Number, required: true, default: 0 },
    totalPrice: { type: Number, required: true },

    note: { type: String, default: "", maxlength: 500 },

    paymentMethod: { type: String, required: true, default: "COD" },
    paymentResult: {
      id: String,
      status: String,
      method: String,
      data: Object,
    },

    isPaid: { type: Boolean, default: false },
    paidAt: Date,

    // ✅ TRƯỜNG MỚI: Dùng cho Cron Job hoàn trả kho tạm (15 phút)
    stockReservationExpires: { type: Date },

    orderStatus: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    deliveredAt: Date,
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model("Order", orderSchema);
