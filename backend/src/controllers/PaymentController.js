import Order from "../models/OrderModel.js";

// @desc    Thanh toán cho 1 đơn hàng
// @route   POST /api/payments/:orderId
// @access  Private (User)
export const payOrder = async (req, res) => {
  const { paymentMethod } = req.body; // COD, BankTransfer, PayPal (giả lập)

  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ message: "Đơn hàng không tồn tại" });
    }

    if (order.isPaid) {
      return res.status(400).json({ message: "Đơn hàng đã được thanh toán" });
    }

    // Giả lập thanh toán thành công
    order.paymentMethod = paymentMethod || "COD";
    order.isPaid = true;
    order.paidAt = Date.now();
    order.status = "processing";

    const updatedOrder = await order.save();

    res.json({
      message: "Thanh toán thành công",
      order: updatedOrder,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi thanh toán", error: error.message });
  }
};
