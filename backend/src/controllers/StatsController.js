import asyncHandler from "express-async-handler";
import Order from "../models/OrderModel.js";
import User from "../models/UserModel.js";
import Product from "../models/ProductModel.js";

/**
 * 📊 Hàm phụ: Tính phần trăm thay đổi
 */
const calculateChange = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return parseFloat((((current - previous) / previous) * 100).toFixed(1));
};

// ✅ FIX: ĐIỀU KIỆN CHUNG: CHỈ TÍNH ĐƠN HÀNG ĐÃ GIAO (DELIVERED) VÀ ĐÃ THANH TOÁN (isPaid)
const deliveredOrderMatch = {
  orderStatus: "delivered", // Bắt buộc phải Delivered
  isPaid: true, // Bắt buộc phải Paid (hoặc đã xác nhận COD)
};

/**
 * ✅ GET /api/stats/summary
 * → Lấy tổng quan Dashboard: doanh thu, đơn hàng, khách hàng, sản phẩm hết hàng
 */
export const getDashboardSummary = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const revenueThisMonth = await Order.aggregate([
    {
      $match: {
        ...deliveredOrderMatch, // ✅ SỬ DỤNG ĐIỀU KIỆN ĐÃ GIAO
        createdAt: { $gte: startOfThisMonth },
      },
    },
    { $group: { _id: null, total: { $sum: "$finalTotal" } } },
  ]);
  const revenueLastMonth = await Order.aggregate([
    {
      $match: {
        ...deliveredOrderMatch, // ✅ SỬ DỤNG ĐIỀU KIỆN ĐÃ GIAO
        createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth },
      },
    },
    { $group: { _id: null, total: { $sum: "$finalTotal" } } }, // ⚠️ Dùng finalTotal cho tổng doanh thu
  ]);

  const currentRevenue = revenueThisMonth[0]?.total || 0;
  const previousRevenue = revenueLastMonth[0]?.total || 0; // ----- 2️⃣ Đơn hàng -----

  const ordersThisMonth = await Order.countDocuments({
    ...deliveredOrderMatch, // ✅ SỬ DỤNG ĐIỀU KIỆN ĐÃ GIAO
    createdAt: { $gte: startOfThisMonth },
  });
  const ordersLastMonth = await Order.countDocuments({
    ...deliveredOrderMatch, // ✅ SỬ DỤNG ĐIỀU KIỆN ĐÃ GIAO
    createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth },
  }); // ----- 3️⃣ Khách hàng mới (Giữ nguyên) -----

  const customersThisMonth = await User.countDocuments({
    role: "user",
    createdAt: { $gte: startOfThisMonth },
  });
  const customersLastMonth = await User.countDocuments({
    role: "user",
    createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth },
  }); // ----- 4️⃣ Sản phẩm hết hàng (Giữ nguyên) -----

  const outOfStock = await Product.countDocuments({
    stock: 0,
    status: "hết hàng",
  });

  res.json({
    totalRevenue: {
      value: currentRevenue,
      change: calculateChange(currentRevenue, previousRevenue),
    },
    totalOrders: {
      value: ordersThisMonth,
      change: calculateChange(ordersThisMonth, ordersLastMonth),
    },
    totalCustomers: {
      value: customersThisMonth,
      change: calculateChange(customersThisMonth, customersLastMonth),
    },
    outOfStockProducts: {
      value: outOfStock,
      change: null,
    },
  });
});

/**
 * ✅ GET /api/stats/orders/chart?range=month|week|year
 * → Lấy dữ liệu thống kê doanh thu / đơn hàng theo thời gian (dùng cho biểu đồ Line Chart)
 */
export const getChartStats = asyncHandler(async (req, res) => {
  const { range = "month" } = req.query; // ✅ FIX: SỬ DỤNG ĐIỀU KIỆN ĐÃ GIAO

  let matchQuery = { ...deliveredOrderMatch };
  let groupByFormat;

  switch (range) {
    case "week":
      matchQuery.createdAt = {
        $gte: new Date(new Date().setDate(new Date().getDate() - 7)),
      };
      groupByFormat = "%Y-%m-%d";
      break;

    case "year":
      matchQuery.createdAt = {
        $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
      };
      groupByFormat = "%Y-%m";
      break;

    case "month":
    default:
      matchQuery.createdAt = {
        $gte: new Date(new Date().setDate(new Date().getDate() - 30)),
      };
      groupByFormat = "%Y-%m-%d";
      break;
  }

  const stats = await Order.aggregate([
    { $match: matchQuery },
    {
      $project: {
        createdAt: 1, // ✅ SỬ DỤNG finalTotal
        totalPrice: "$finalTotal",
        dateGroup: {
          $dateToString: { format: groupByFormat, date: "$createdAt" },
        },
      },
    },
    {
      $group: {
        _id: "$dateGroup",
        totalSales: { $sum: "$totalPrice" },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json(stats);
});

/**
 * ✅ API: Lấy danh sách các đơn hàng đã hoàn thành
 */
export const getSuccessfulOrders = async (req, res) => {
  try {
    // 🔹 Chỉ lấy đơn hàng đã giao và đã thanh toán
    const successfulOrders = await Order.find(deliveredOrderMatch)
      .populate({
        path: "user",
        select: "username email",
      })
      .populate({
        path: "orderItems.product",
        select: "name _id images",
      })
      .sort({ createdAt: -1 }); // 🔹 Định dạng lại dữ liệu trả về

    const formattedOrders = successfulOrders.map((order) => ({
      orderId: order._id,
      customer: order.user?.username || order.shippingAddress?.name || "N/A",
      email: order.user?.email || order.shippingAddress?.email || "N/A",
      totalPrice: order.finalTotal, // ✅ SỬ DỤNG finalTotal cho tổng tiền
      status: order.orderStatus,
      createdAt: order.createdAt,
      products: order.orderItems.map((item) => ({
        productId: item.product?._id,
        productName: item.product?.name || item.name,
        images: item.product?.images || item.images,
        quantity: item.qty,
        price: item.price,
        discount: item.discount,
      })),
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error("❌ Lỗi khi lấy đơn hàng thành công:", error);
    res.status(500).json({
      message: "Lỗi máy chủ khi lấy danh sách đơn hàng thành công.",
    });
  }
};
