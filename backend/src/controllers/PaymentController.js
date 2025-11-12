import asyncHandler from "express-async-handler";
import Order from "../models/orderModel.js";
import Cart from "../models/cartModel.js";

// @desc    Thanh toán cho 1 đơn hàng
// @route   POST /api/payments/:orderId
// @access  Private (User)
export const payOrder = asyncHandler(async (req, res) => {
  const { paymentMethod } = req.body; // COD hoặc VNPAY

  const order = await Order.findById(req.params.orderId);
  if (!order) {
    res.status(404);
    throw new Error("Đơn hàng không tồn tại");
  }

  if (order.isPaid) {
    res.status(400);
    throw new Error("Đơn hàng đã được thanh toán");
  }

  // --- Cập nhật trạng thái thanh toán ---
  order.paymentMethod = paymentMethod || "COD";
  order.isPaid = true;
  order.paidAt = Date.now();
  order.orderStatus = "processing";

  // --- Lưu tổng thanh toán chính xác (sau giảm giá) ---
  const amountToPay = order.finalTotal; // dùng finalTotal
  order.totalPaid = amountToPay; // nếu muốn lưu riêng số tiền đã thanh toán

  const updatedOrder = await order.save();

  // --- Xóa giỏ hàng nếu có user ---
  if (order.user) {
    await Cart.deleteOne({ user: order.user });
  }

  res.status(200).json({
    message: "Thanh toán thành công",
    order: updatedOrder,
    amountPaid: amountToPay, // gửi luôn giá trị chính xác cho frontend
  });
});
