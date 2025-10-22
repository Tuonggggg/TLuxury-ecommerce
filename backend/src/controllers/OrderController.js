// controllers/OrderController.js
import asyncHandler from "express-async-handler";
import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import Cart from "../models/cartModel.js";
import {
  requestMomoPayment,
  verifyMomoSignature,
} from "../utils/momoPayment.js";
import {
  createVnPayPayment,
  verifyVnPayReturn,
} from "../utils/vnpayPayment.js";

// Helper: normalize incoming order items (Giữ nguyên)
function normalizeIncomingItems(items) {
  /* ... */ return items.map((it) => {
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

// POST /api/orders
const checkout = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  let { orderItems, items, shippingAddress, paymentMethod, note } = req.body;

  const incomingItems = orderItems || items;
  if (!incomingItems || incomingItems.length === 0) {
    res.status(400);
    throw new Error("Giỏ hàng trống.");
  }

  let normalized;
  try {
    normalized = normalizeIncomingItems(incomingItems);
  } catch (err) {
    res.status(400);
    throw new Error("Dữ liệu sản phẩm không hợp lệ.");
  }

  const productIds = normalized.map((i) => i.product);
  const productsInDB = await Product.find({ _id: { $in: productIds } });

  let itemsPrice = 0;
  const finalOrderItems = [];

  for (const item of normalized) {
    const product = productsInDB.find((p) => p._id.toString() === item.product);
    if (!product) {
      res.status(400);
      throw new Error(`Sản phẩm ${item.product} không tồn tại.`);
    }
    if (product.stock < item.qty) {
      res.status(400);
      throw new Error(
        `Sản phẩm ${product.name} không đủ số lượng (còn ${product.stock}).`
      );
    }

    const finalPriceAtCheckout = product.finalPrice;
    itemsPrice += finalPriceAtCheckout * item.qty;

    finalOrderItems.push({
      product: product._id,
      name: product.name,
      images: product.images,
      qty: item.qty,
      price: finalPriceAtCheckout,
    });
  }

  const shippingPrice = itemsPrice >= 1000000 ? 0 : 30000;
  const taxPrice = Math.round(itemsPrice * 0.1);
  const totalPrice = Math.round(itemsPrice + shippingPrice + taxPrice);

  const expiryTime = new Date(Date.now() + 15 * 60000);

  const order = new Order({
    user: userId,
    orderItems: finalOrderItems,
    shippingAddress,
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
    paymentMethod,
    note: note || "",
    stockReservationExpires: expiryTime,
    orderStatus: "pending", // ✅ FIX: ĐẶT TRẠNG THÁI CHỜ BAN ĐẦU LÀ PENDING
  });

  const createdOrder = await order.save(); // TRỪ KHO NGAY LẬP TỨC (cho tất cả phương thức)

  for (const item of finalOrderItems) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: -item.qty },
    });
  } // Xử lý thanh toán

  if (paymentMethod === "COD") {
    await Cart.deleteOne({ user: userId });
    res.status(201).json(createdOrder);
  } else if (paymentMethod === "Momo") {
    const momoResponse = await requestMomoPayment({
      orderId: createdOrder._id.toString(),
      amount: totalPrice,
      orderInfo: `Thanh toán Momo đơn hàng #${createdOrder._id}`,
    });
    return res.status(200).json({ payUrl: momoResponse.payUrl });
  } else if (paymentMethod === "VNPAY") {
    const vnpayUrl = createVnPayPayment({
      orderId: createdOrder._id.toString(),
      amount: totalPrice,
      orderInfo: `Thanh toán VNPAY đơn hàng #${createdOrder._id}`,
      ipAddr:
        req.ip ||
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress,
    });
    return res.status(200).json({ payUrl: vnpayUrl });
  }
});

// POST /api/orders/momo-callback
const momoCallback = asyncHandler(async (req, res) => {
  const { orderId, resultCode, transId, ...rest } = req.body;

  if (!verifyMomoSignature(req.body)) {
    console.log("Momo IPN: Invalid signature.");
    return res.json({ status: 500, message: "Invalid Signature" });
  }
  const order = await Order.findById(orderId);
  if (!order) {
    return res.json({ status: 204, message: "Order not found" });
  }

  if (resultCode === 0 && !order.isPaid) {
    order.isPaid = true;
    order.paidAt = Date.now();
    // ✅ FIX: ĐẶT TRẠNG THÁI LÀ PROCESSING (Đã thanh toán)
    order.orderStatus = "processing";
    order.paymentResult = {
      id: transId,
      status: "SUCCESS",
      method: order.paymentMethod,
      data: rest,
    };
    await order.save();

    await Cart.deleteOne({ user: order.user });

    return res.json({ status: 0, message: "Success" });
  } else if (!order.isPaid) {
    // Nếu thất bại, đơn hàng vẫn ở trạng thái PENDING/PROCESSING (đã trừ kho tạm)
    order.paymentResult = {
      id: transId || "N/A",
      status: "FAILED",
      method: order.paymentMethod,
      data: rest,
    };
    await order.save();
    return res.json({ status: 0, message: "Payment Failed" });
  }
  return res.json({ status: 0, message: "Order already processed" });
});

// PUT /api/orders/:id/cancel
const cancelOrder = asyncHandler(async (req, res) => {
  const orderId = req.params.id;
  const userId = req.user._id;

  const order = await Order.findById(orderId);

  if (!order) {
    res.status(404);
    throw new Error("Đơn hàng không tìm thấy.");
  }
  if (order.user.toString() !== userId.toString()) {
    res.status(403);
    throw new Error("Bạn không có quyền hủy đơn hàng này.");
  } // 2. Kiểm tra trạng thái: CHỈ cho phép hủy nếu là 'pending'

  if (order.orderStatus !== "pending") {
    res.status(400);
    throw new Error(
      `Không thể hủy đơn hàng khi đang ở trạng thái: ${order.orderStatus}. Chỉ có thể hủy khi đơn hàng ở trạng thái chờ.`
    );
  } // 3. Thực hiện hủy

  order.orderStatus = "cancelled"; // 4. Hoàn trả Stock
  for (const item of order.orderItems) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.qty }, // Cộng lại số lượng đã trừ
    });
  }

  const cancelledOrder = await order.save();

  res.json({
    message: "Đơn hàng đã được hủy thành công.",
    order: cancelledOrder,
  });
});

// GET /api/orders/vnpay-callback
const vnpayCallback = asyncHandler(async (req, res) => {
  const vnp_Params = { ...req.query };
  const { isValid, orderId, responseCode, message } =
    verifyVnPayReturn(vnp_Params);

  const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

  if (!isValid) {
    return res.redirect(
      `${FRONTEND_URL}/payment/failed?message=Chữ ký không hợp lệ`
    );
  }
  const order = await Order.findById(orderId);
  if (!order) {
    return res.redirect(
      `${FRONTEND_URL}/payment/failed?message=Đơn hàng không tìm thấy`
    );
  }

  if (responseCode === "00" && !order.isPaid) {
    order.isPaid = true;
    order.paidAt = Date.now();
    order.orderStatus = "processing"; // ✅ FIX: ĐẶT TRẠNG THÁI LÀ PROCESSING
    order.paymentResult = {
      id: vnp_Params.vnp_TransactionNo,
      status: "SUCCESS",
      method: order.paymentMethod,
      data: vnp_Params,
    };
    await order.save();

    await Cart.deleteOne({ user: order.user });

    return res.redirect(`${FRONTEND_URL}/order-success/${orderId}`);
  } else if (!order.isPaid) {
    order.paymentResult = {
      id: vnp_Params.vnp_TransactionNo || "N/A",
      status: "FAILED",
      method: order.paymentMethod,
      data: vnp_Params,
    };
    await order.save();
    return res.redirect(`${FRONTEND_URL}/payment/failed?message=${message}`);
  }

  return res.redirect(`${FRONTEND_URL}/order-success/${orderId}`);
});

// DELETE /api/orders/:id (Admin)
const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    if (
      order.orderStatus !== "delivered" &&
      order.orderStatus !== "cancelled"
    ) {
      for (const item of order.orderItems) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock = (product.stock || 0) + item.qty;
          await product.save();
        }
      }
    }

    await Order.deleteOne({ _id: req.params.id });
    res.json({ message: "Đơn hàng đã được xóa thành công." });
  } else {
    res.status(404);
    throw new Error("Đơn hàng không tìm thấy");
  }
});

// GET /api/orders/my
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort("-createdAt");
  res.json(orders);
});

// GET /api/orders (Admin)
const getOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const statusFilter = req.query.status;

  const skip = (page - 1) * limit;

  let findQuery = {};
  if (statusFilter && statusFilter !== "all") {
    findQuery.orderStatus = statusFilter;
  }

  const orders = await Order.find(findQuery)
    .populate("user", "username email address phone")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const count = await Order.countDocuments(findQuery);
  const totalPages = Math.ceil(count / limit);

  res.json({
    orders: orders,
    page: page,
    totalPages: totalPages,
    totalOrders: count,
  });
});

// GET /api/orders/:id
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "name email")
    .populate("orderItems.product", "name images slug");

  if (order) {
    if (
      order.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      res.status(403);
      throw new Error("Không có quyền truy cập đơn hàng này");
    }
    res.json(order);
  } else {
    res.status(404);
    throw new Error("Đơn hàng không tìm thấy");
  }
});

// PUT /api/orders/:id/status (Admin)
const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (order) {
    order.orderStatus = req.body.status || order.orderStatus;
    if (req.body.status === "delivered" && !order.deliveredAt) {
      order.deliveredAt = Date.now();
    }
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error("Đơn hàng không tìm thấy");
  }
});

export {
  checkout,
  getMyOrders,
  getOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
  momoCallback,
  vnpayCallback,
  deleteOrder,
};
