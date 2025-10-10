import mongoose from "mongoose";

const checkoutSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
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
      },
    ],
    shippingAddress: {
      address: { type: String, required: true },
      city: { type: String },
      postalCode: { type: String },
      country: { type: String },
    },
    totalPrice: { type: Number, required: true },
    paymentMethod: { type: String, required: true, default: "COD" }, // COD, BankTransfer, PayPal
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "cancelled"],
      default: "pending",
    },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" }, // liên kết đơn hàng nếu đã chuyển
  },
  { timestamps: true }
);

const Checkout = mongoose.model("Checkout", checkoutSchema);
export default Checkout;
