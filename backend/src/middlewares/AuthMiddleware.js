// [GUEST] Đổi tên file này thành: middleware/authMiddleware.js (ví dụ)

import jwt from "jsonwebtoken";
import User from "../models/UserModel.js"; // Đảm bảo đúng đường dẫn
import asyncHandler from "express-async-handler";

// ==================================================
// 1. PROTECT (BẮT BUỘC)
// Dùng cho các route bắt buộc đăng nhập
// (Không thay đổi)
// ==================================================
export const protect = asyncHandler(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // [GUEST] Sửa lỗi nhỏ: 'decoded.id' của bạn nên là 'decoded.userId'
      // (Giống với file User controller của bạn)
      // Nếu bạn dùng 'id' trong JWT thì giữ nguyên 'decoded.id'
      const user = await User.findById(decoded.id || decoded.userId).select(
        "-password"
      );

      if (!user) {
        res.status(401);
        throw new Error("Người dùng không tồn tại");
      }
      req.user = user;
      next();
    } catch (error) {
      res.status(401);
      throw new Error("Token không hợp lệ hoặc đã hết hạn");
    }
  }

  if (!token) {
    res.status(401);
    // [GUEST] Sửa câu báo lỗi chung chung hơn
    throw new Error("Không tìm thấy token, yêu cầu đăng nhập");
  }
});

// ==================================================
// 2. AUTHORIZE ROLES (PHÂN QUYỀN)
// Dùng sau 'protect' để kiểm tra vai trò (admin, v.v.)
// (Không thay đổi)
// ==================================================
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // [GUEST] Chỉnh sửa lỗi: 'authorizeRoles' phải chạy SAU 'protect',
    // nên 'req.user' luôn phải tồn tại.
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403); // 403 Forbidden (Cấm)
      throw new Error(
        `Vai trò (${req.user.role}) không có quyền thực hiện hành động này`
      );
    }
    next();
  };
};

// ==================================================
// 3. CHECK OPTIONAL AUTH (TÙY CHỌN)
// [GUEST] Middleware mới dùng cho checkout
// ==================================================
export const checkOptionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  // Cố gắng tìm token giống hệt 'protect'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id || decoded.userId).select(
        "-password"
      );

      if (user) {
        req.user = user; // Gán user nếu hợp lệ
      } else {
        req.user = null; // Token hợp lệ nhưng user không tồn tại
      }
    } catch (error) {
      // Token lỗi, hết hạn, hoặc không có -> không sao cả, coi là khách
      req.user = null;
    }
  } else {
    // Không có header 'Authorization' -> coi là khách
    req.user = null;
  }

  next(); // LUÔN LUÔN cho đi tiếp
});
