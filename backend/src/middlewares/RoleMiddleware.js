export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      const err = new Error("Yêu cầu đăng nhập");
      err.statusCode = 401;
      return next(err);
    }
    if (!allowedRoles.includes(req.user.role)) {
      const err = new Error("Bạn không có quyền thực hiện hành động này");
      err.statusCode = 403;
      return next(err);
    }
    next();
  };
};
