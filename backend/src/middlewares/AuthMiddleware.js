// src/middlewares/AuthMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";

// @desc    Middleware xác thực người dùng
export const protect = async (req, res, next) => {
  let token;

  try {
    // 1. Kiểm tra Token từ Header (Bearer) hoặc Cookie
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      const err = new Error("Không có token, truy cập bị từ chối");
      err.statusCode = 401;
      throw err;
    }

    // 2. Xác thực và tìm User
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      const err = new Error("Người dùng không tồn tại");
      err.statusCode = 401;
      throw err;
    }

    req.user = user; // attach user
    next();
  } catch (error) {
    // Bất kỳ lỗi nào (JWT expired, invalid signature, no token) -> 401
    error.statusCode = error.statusCode || 401;
    next(error);
  }
};

// ---

// @desc    Middleware kiểm tra quyền Admin
// 🔑 BỔ SUNG: Hàm này bị thiếu 'export' và định nghĩa
export const admin = (req, res, next) => {
  // Middleware này PHẢI chạy sau 'protect', nên req.user đã tồn tại
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    const err = new Error(
      "Không có quyền truy cập. Chỉ Admin mới có thể thực hiện thao tác này."
    );
    err.statusCode = 403; // 403 Forbidden
    next(err);
  }
};
