// src/middlewares/error.middleware.js

export const notFound = (req, res, next) => {
  const err = new Error(`Không tìm thấy: ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
};

export const errorHandler = (err, req, res, next) => {
  // chuẩn hoá lỗi
  const statusCode = err.statusCode || 500;
  const message = err.message || "Lỗi máy chủ";

  // Không leak stack trace ở production
  const response = {
    status: "error",
    message
  };

  if (process.env.NODE_ENV !== "production") {
    response.stack = err.stack;
    response.details = err.details || null;
  }

  res.status(statusCode).json(response);
};
