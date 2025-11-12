import asyncHandler from "express-async-handler";
import Order from "../models/OrderModel.js";
import Product from "../models/ProductModel.js"; // Đảm bảo tên file model là 'productModel.js'
import Cart from "../models/CartModel.js";
import Voucher from "../models/DiscountModel.js";
import {
  createVnPayPayment,
  verifyVnPayReturn,
} from "../utils/vnpayPayment.js";
import sendEmail from "../utils/sendEmail.js";

// ==================================================
// 🧩 Helper: Chuẩn hóa dữ liệu đầu vào
// ==================================================
function normalizeIncomingItems(items) {
  return items.map((it) => {
    if (it.product) {
      return {
        product: it.product.toString(),
        qty: it.qty ?? it.quantity ?? 1,
      };
    } else if (it.productId) {
      return {
        product: it.productId.toString(),
        qty: it.quantity ?? it.qty ?? 1,
      };
    } else {
      throw new Error("Invalid item format");
    }
  });
}

// ==================================================
// 🛒 Tạo đơn hàng (checkout)
// ==================================================
const checkout = asyncHandler(async (req, res) => {
  const userId = req.user ? req.user._id : null;
  let {
    orderItems,
    items,
    shippingAddress,
    paymentMethod,
    note,
    voucherCode,
    // (Giá trị từ Tóm tắt đơn hàng FE)
    itemsPrice: itemsPriceFromFE,
    shippingPrice: shippingPriceFromFE,
    taxPrice: taxPriceFromFE,
    totalPrice: totalPriceFromFE,
    discountAmount: discountAmountFromFE,
    finalTotal: finalTotalFromFE,
  } = req.body; // --- 1. Kiểm tra Giỏ hàng & Chuẩn hóa ---

  const incomingItems = orderItems || items;
  if (!incomingItems || incomingItems.length === 0) {
    res.status(400);
    throw new Error("Giỏ hàng trống.");
  }

  let normalized;
  try {
    normalized = normalizeIncomingItems(incomingItems);
  } catch {
    res.status(400);
    throw new Error("Dữ liệu sản phẩm không hợp lệ.");
  }

  const productIds = normalized.map((i) => i.product);
  const productsInDB = await Product.find({ _id: { $in: productIds } }); // --- 2. Xác thực lại Stock (Bảo mật) ---

  let itemsPrice = 0; // Giá trị tính lại ở Backend
  const finalOrderItems = [];

  for (const item of normalized) {
    const product = productsInDB.find((p) => p._id.toString() === item.product);
    if (!product) throw new Error(`Sản phẩm ${item.product} không tồn tại.`);
    if (product.stock < item.qty)
      throw new Error(
        `Sản phẩm ${product.name} không đủ số lượng (còn ${product.stock}).`
      );
    const finalPriceAtCheckout = product.finalPrice; // Sử dụng Virtual 'finalPrice'
    itemsPrice += finalPriceAtCheckout * item.qty; // ✅ FIX LỖI VALIDATION: Lấy 'name' và 'price' từ 'product'
    finalOrderItems.push({
      product: product._id,
      name: product.name, // 👈 Sửa: Lấy từ 'product.name'
      images: product.images.length > 0 ? [product.images[0]] : [], // Chỉ lưu ảnh đầu tiên
      qty: item.qty,
      price: finalPriceAtCheckout, // 👈 Sửa: Lấy từ 'finalPriceAtCheckout'
    });
  } // --- 3. Tính toán tổng tiền (Backend) ---

  const shippingPrice = itemsPrice >= 1000000 ? 0 : 30000;
  const taxPrice = Math.round(itemsPrice * 0.08); // Dùng 10% (hoặc 8% nếu muốn)
  const totalPrice = Math.round(itemsPrice + shippingPrice + taxPrice);

  let discountAmount = 0;
  let appliedVoucher = null;

  if (voucherCode) {
    const voucher = await Voucher.findOne({
      code: voucherCode.trim().toUpperCase(),
      isActive: true,
    });
    const now = new Date();

    // Kiểm tra hợp lệ
    if (
      voucher &&
      voucher.expiryDate >= now &&
      voucher.usedCount < voucher.usageLimit &&
      totalPrice >= voucher.minOrder
    ) {
      if (voucher.type === "percent") {
        discountAmount = Math.min(
          Math.round((totalPrice * voucher.value) / 100), // Tính trên tổng tiền (sau VAT)
          voucher.maxDiscount || Infinity
        );
      } else if (voucher.type === "fixed") {
        discountAmount = voucher.value;
      }
      discountAmount = Math.max(0, Math.min(discountAmount, totalPrice));
      appliedVoucher = voucher;
    } // Nếu voucher không hợp lệ (hết hạn, sai mã), discountAmount vẫn là 0
  } // Tổng cuối cùng (Số tiền khách phải trả)

  const finalTotal = Math.max(0, totalPrice - discountAmount);
  const expiryTime = new Date(Date.now() + 15 * 60000); // ======================= // 🧾 5. Tạo đơn hàng // =======================

  const orderData = {
    user: userId,
    orderItems: finalOrderItems, // Đã fix name và price
    shippingAddress,
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice: totalPrice, // Tổng (trước giảm)
    discountAmount: discountAmount, // Số tiền giảm
    finalTotal: finalTotal, // Tổng (sau giảm)
    paymentMethod,
    note: note || "",
    stockReservationExpires: expiryTime,
    orderStatus: "pending",
    voucherCode: appliedVoucher ? appliedVoucher.code : null,
  };

  const order = new Order(orderData);
  const createdOrder = await order.save(); // ✅ Validation Error sẽ không xảy ra nữa // --- 6. Trừ kho tạm thời ---

  await Promise.all(
    finalOrderItems.map((item) =>
      Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.qty } })
    )
  ); // --- 7. Cập nhật lượt dùng voucher (Nếu có) ---

  if (appliedVoucher) {
    try {
      await Voucher.findOneAndUpdate(
        { code: appliedVoucher.code },
        { $inc: { usedCount: 1 } }
      );
    } catch (err) {
      console.error("Lỗi cập nhật voucher:", err.message);
    }
  } // ======================= // 📧 8. Gửi email xác nhận // =======================

  try {
    const { email, name, address, city } = createdOrder.shippingAddress;
    if (email) {
      const subject = `[TLuxury] Xác nhận đơn hàng #${createdOrder._id
        .toString()
        .slice(-6)}`;
      const finalPriceForEmail = Number(createdOrder.finalTotal) || 0;
      const formattedPrice = finalPriceForEmail.toLocaleString("vi-VN");
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Cảm ơn bạn đã đặt hàng tại TLuxury!</h2>
          <p>Xin chào ${name},</p>
          <p>Mã đơn hàng của bạn là: #${createdOrder._id.toString()}</p>
          <hr>
          <p><strong>Tổng cộng:</strong> 
            <span style="color: #d9534f; font-weight: bold;">
            ${formattedPrice} ₫ 
            </span>
          </p>
          <p><strong>Phương thức thanh toán:</strong> ${
            createdOrder.paymentMethod
          }</p>
          <p><strong>Địa chỉ giao hàng:</strong> ${address}, ${city}</p>
          <hr>
          <p>Cảm ơn bạn đã tin tưởng TLuxury.</p>
        </div>
      `;
      await sendEmail({ email, subject, message: htmlContent });
    }
  } catch (emailError) {
    console.error("LỖI GỬI EMAIL:", emailError);
    Note;
  } // ======================= // 💳 9. Thanh toán // =======================

  if (paymentMethod === "COD") {
    if (userId) await Cart.deleteOne({ user: userId });
    return res.status(201).json(createdOrder);
  }

  if (paymentMethod === "VNPAY") {
    const vnpayUrl = createVnPayPayment({
      orderId: createdOrder._id.toString(),
      amount: Math.round(finalTotal), // ✅ Gửi số tiền ĐÚNG (sau giảm giá)
      orderInfo: `Thanh toán VNPAY đơn hàng #${createdOrder._id}`,
      ipAddr:
        req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
        req.socket.remoteAddress ||
        "127.0.0.1",
    });

    return res.status(200).json({ payUrl: vnpayUrl });
  }
});

// ==================================================
// ❌ Hủy đơn hàng (User)
// ==================================================
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new Error("Đơn hàng không tìm thấy.");
  if (
    !req.user ||
    !order.user ||
    order.user.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error("Bạn không có quyền hủy đơn hàng này.");
  }
  if (order.orderStatus !== "pending")
    throw new Error("Chỉ có thể hủy đơn hàng ở trạng thái 'Chờ xác nhận'.");

  order.orderStatus = "cancelled"; // Hoàn trả kho

  await Promise.all(
    order.orderItems.map((item) =>
      Product.findByIdAndUpdate(item.product, { $inc: { stock: item.qty } })
    )
  );

  // ✅ FIX: Hoàn trả lượt sử dụng Voucher (nếu có)
  if (order.voucherCode) {
    await Voucher.findOneAndUpdate(
      { code: order.voucherCode },
      { $inc: { usedCount: -1 } } // Trừ 1 lượt đã dùng
    );
  }

  const cancelledOrder = await order.save();
  res.json({
    message: "Đơn hàng đã được hủy thành công.",
    order: cancelledOrder,
  });
});

// ==================================================
// 💳 Callback từ VNPAY
// ==================================================
const vnpayCallback = asyncHandler(async (req, res) => {
  const vnp_Params = { ...req.query };
  const { isValid, orderId, responseCode, message } =
    verifyVnPayReturn(vnp_Params);
  const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

  const order = await Order.findById(orderId);
  if (!order)
    return res.redirect(
      `${FRONTEND_URL}/payment/failed?message=Đơn hàng không tìm thấy`
    );
  if (!isValid)
    return res.redirect(
      `${FRONTEND_URL}/payment/failed?message=Chữ ký không hợp lệ`
    );

  if (responseCode === "00" && !order.isPaid) {
    order.isPaid = true;
    order.paidAt = Date.now();
    order.orderStatus = "processing";
    order.paymentResult = {
      /* ... */
    };
    // ✅ FIX: CẬP NHẬT 'SOLD' KHI THANH TOÁN THÀNH CÔNG
    await Promise.all(
      order.orderItems.map((item) =>
        Product.findByIdAndUpdate(item.product, { $inc: { sold: item.qty } })
      )
    );

    await order.save();
    if (order.user) await Cart.deleteOne({ user: order.user });
    return res.redirect(`${FRONTEND_URL}/order-success/${orderId}`);
  } // Thanh toán thất bại (Không cần hoàn kho vì Cron Job sẽ xử lý)

  order.paymentResult = {
    /* ... */
  };
  await order.save();
  return res.redirect(`${FRONTEND_URL}/payment/failed?message=${message}`);
});

// ==================================================
// 👑 ADMIN: Xóa đơn hàng
// ==================================================
const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new Error("Đơn hàng không tìm thấy"); // Hoàn trả kho/sold NẾU đơn hàng chưa giao hoặc chưa hủy

  if (order.orderStatus !== "delivered" && order.orderStatus !== "cancelled") {
    await Promise.all(
      order.orderItems.map(async (item) => {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock += item.qty; // ✅ FIX: Chỉ trừ 'sold' nếu đơn hàng ĐÃ ĐƯỢC TÍNH (isPaid = true)
          if (order.isPaid) {
            product.sold = Math.max(0, (product.sold || 0) - item.qty);
          }
          await product.save();
        }
      })
    );
    // ✅ FIX: Hoàn trả Voucher nếu xóa đơn chưa hoàn thành
    if (order.voucherCode) {
      await Voucher.findOneAndUpdate(
        { code: order.voucherCode },
        { $inc: { usedCount: -1 } }
      );
    }
  }

  await Order.deleteOne({ _id: req.params.id });
  res.json({ message: "Đơn hàng đã được xóa thành công." });
});

// ==================================================
// 🧑‍💻 USER: Lấy đơn hàng của tôi
// ==================================================
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort("-createdAt");
  res.json(orders);
});

// ==================================================
// 👑 ADMIN: Lấy tất cả đơn hàng (Phân trang)
// ==================================================
const getOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const statusFilter = req.query.status;
  const skip = (page - 1) * limit;
  const findQuery =
    statusFilter && statusFilter !== "all" ? { orderStatus: statusFilter } : {};

  const [orders, count] = await Promise.all([
    Order.find(findQuery)
      .populate("user", "username email address phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(findQuery),
  ]);

  res.json({
    orders,
    page,
    totalPages: Math.ceil(count / limit),
    totalOrders: count,
  });
});

// ==================================================
// 📦 Lấy đơn hàng bằng ID (Chi tiết)
// ==================================================
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "username email")
    .populate("orderItems.product", "name images slug");
  if (!order) {
    res.status(404);
    throw new Error("Đơn hàng không tìm thấy");
  }
  if (
    req.user?.role === "admin" ||
    (order.user && order.user._id.toString() === req.user._id.toString())
  ) {
    return res.json(order);
  }
  res.status(403);
  throw new Error("Không có quyền truy cập đơn hàng này");
});

// ==================================================
// 👑 ADMIN: Cập nhật trạng thái đơn hàng
// ==================================================
const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new Error("Đơn hàng không tìm thấy");

  const oldStatus = order.orderStatus;
  const newStatus = req.body.status;

  order.orderStatus = newStatus || oldStatus; // ✅ FIX: LOGIC CẬP NHẬT SOLD VÀ ISPAID

  if (!order.isPaid) {
    // --- KHI ĐƠN HÀNG CHƯA ĐƯỢC TÍNH DOANH THU ---
    if (
      (newStatus === "processing" || newStatus === "delivered") &&
      oldStatus === "pending"
    ) {
      // Đây là lần đầu tiên Admin xác nhận (kể cả COD)
      await Promise.all(
        order.orderItems.map((item) =>
          Product.findByIdAndUpdate(item.product, { $inc: { sold: item.qty } })
        )
      );
      order.isPaid = true; // Đánh dấu là đã tính doanh thu
      if (newStatus === "delivered") order.deliveredAt = Date.now();
    }
  } else {
    // --- KHI ĐƠN HÀNG ĐÃ ĐƯỢC TÍNH DOANH THU (isPaid = true) ---
    if (newStatus === "cancelled" && oldStatus !== "cancelled") {
      // Admin hủy đơn hàng đã thanh toán/xác nhận
      await Promise.all(
        order.orderItems.map((item) =>
          Product.findByIdAndUpdate(item.product, {
            $inc: { stock: item.qty, sold: -item.qty }, // Hoàn kho VÀ trừ sold
          })
        )
      );
      order.isPaid = false; // Không còn tính doanh thu

      // Hoàn trả voucher
      if (order.voucherCode) {
        await Voucher.findOneAndUpdate(
          { code: order.voucherCode },
          { $inc: { usedCount: -1 } }
        );
      }
    }
  }

  const updatedOrder = await order.save();
  res.json(updatedOrder);
});

export {
  checkout,
  cancelOrder,
  vnpayCallback,
  deleteOrder,
  getMyOrders,
  getOrders,
  getOrderById,
  updateOrderStatus,
};
