import Order from "../models/OrderModel.js";
import Cart from "../models/CartModel.js";
import Product from "../models/ProductModel.js";
import mongoose from "mongoose";

// Hàm tiện ích: Tính giá cuối cùng (để kiểm tra)
const calculateFinalPrice = (product) => {
  const price = product.price;
  const discount = product.discount || 0;
  return price - (price * discount) / 100;
};

// =========================================================
// HÀM CHÍNH: Checkout từ giỏ hàng (Xử lý POST /api/orders)
// =========================================================

export const checkout = async (req, res) => {
  try {
    // Dữ liệu nhận từ Front-end (CheckoutPage.jsx)
    const {
      customer,
      paymentMethod,
      total,
      subTotal,
      shippingFee,
      discountCode,
      discountAmount,
    } = req.body; // 1. KIỂM TRA BẮT BUỘC: Đăng nhập
    if (!req.user || !req.user._id) {
      return res
        .status(401)
        .json({ message: "Vui lòng đăng nhập để tiến hành thanh toán." });
    }

    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product"
    );

    if (!cart || cart.items.length === 0) {
      return res
        .status(400)
        .json({ message: "Giỏ hàng trống, không thể đặt hàng" });
    } // 2. KIỂM TRA TỒN KHO VÀ TRẠNG THÁI CUỐI CÙNG
    for (const item of cart.items) {
      if (!item.product) {
        return res
          .status(400)
          .json({ message: `Sản phẩm bị lỗi không tồn tại trong giỏ hàng.` });
      }
      if (item.product.status === "unavailable")
        return res
          .status(400)
          .json({ message: `Sản phẩm không bán: ${item.product.name}` });
      if (item.product.stock < item.qty)
        return res
          .status(400)
          .json({ message: `Số lượng vượt tồn kho: ${item.product.name}` });
    } // 3. TÍNH TOÁN VÀ ĐỐI CHIẾU (Đảm bảo SubTotal gốc không bị thay đổi)

    const serverSubTotalRaw = cart.items.reduce(
      (sum, item) => sum + item.price * item.qty,
      0
    ); // Bạn có thể thêm logic kiểm tra serverSubTotalRaw với FE SubTotal để đảm bảo tính toàn vẹn. // 4. TẠO ORDER

    const order = new Order({
      user: req.user._id,
      customerInfo: customer, // Thông tin khách hàng
      paymentMethod: paymentMethod || "COD", // Thông tin giảm giá và tổng tiền
      discountCode: discountCode || null,
      discountAmount: discountAmount || 0,
      subTotal: serverSubTotalRaw, // SubTotal gốc (trước discount coupon)
      totalAmount: total, // Tổng tiền cuối cùng
      shippingFee: shippingFee, // Ánh xạ Cart Items sang Order Items
      orderItems: cart.items.map((item) => ({
        product: item.product._id,
        name: item.product.name,
        qty: item.qty,
        price: item.price, // Dùng giá đã được lưu trong Cart Schema
      })),
    });

    const createdOrder = await order.save(); // 5. GIẢM STOCK VÀ XÓA GIỎ HÀNG

    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { stock: -item.qty },
      });
    } // Xóa giỏ hàng

    cart.items = [];
    await cart.save();

    res.status(201).json(await createdOrder.populate("orderItems.product"));
  } catch (error) {
    console.error("Lỗi SERVER khi checkout:", error);
    res.status(500).json({ message: "Lỗi khi checkout", error: error.message });
  }
};

// -------------------------------------------------------------------------------------
// CÁC HÀM KHÁC GIỮ NGUYÊN (NHƯNG BỎ createOrder cũ)
// -------------------------------------------------------------------------------------

// 🚨 Thay thế createOrder cũ bằng checkout để endpoint POST /orders hoạt động
export const createOrder = checkout;

// Lấy đơn hàng của user hiện tại
export const getMyOrders = async (req, res) => {
  // ... (Logic giữ nguyên)
};

// Lấy tất cả đơn hàng (Admin)
export const getOrders = async (req, res) => {
  // ... (Logic giữ nguyên)
};

// Lấy chi tiết đơn hàng
export const getOrderById = async (req, res) => {
  // ... (Logic giữ nguyên)
};

// Cập nhật trạng thái đơn hàng (Admin)
export const updateOrderStatus = async (req, res) => {
  // ... (Logic giữ nguyên)
};

// Xóa đơn hàng (Admin)
export const deleteOrder = async (req, res) => {
  // ... (Logic giữ nguyên)
};
