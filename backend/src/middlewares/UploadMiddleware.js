// /middlewares/UploadMiddleware.js (Sửa lỗi)

import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
// ✅ SỬA: Thay đổi cách import (Dùng import/export chuẩn ES Module)
import { cloudinary } from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  // ✅ SỬ DỤNG ĐỐI TƯỢNG CLOUDINARY ĐƯỢC EXPORT TỪ CONFIG
  cloudinary: cloudinary,
  params: {
    folder: "ecommerce/products",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    // Thêm các tham số tùy chọn khác nếu cần, ví dụ:
    // transformation: [{ width: 500, height: 500, crop: "limit" }],
  },
});

const upload = multer({ storage });
export default upload;
