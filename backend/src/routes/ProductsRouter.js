import express from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getFlashSaleProducts,
  getBrands,
} from "../controllers/ProductController.js";

// ✅ FIX: Lấy cả hai hàm từ cùng một file AuthMiddleware.js
import { protect, authorizeRoles } from "../middlewares/AuthMiddleware.js";
// ❌ (Đã loại bỏ import từ RoleMiddleware.js)

import { validate } from "../middlewares/ValidateMiddleware.js";
import {
  createProductSchema,
  updateProductSchema,
} from "../validations/ProductValidation.js";
import upload from "../middlewares/UploadMiddleware.js";

const router = express.Router();

/* ============================================================
   ⚡ FLASH SALE (phải đặt TRƯỚC :id để tránh nhầm route)
   ============================================================ */
router.get("/flashsale", getFlashSaleProducts);

/* ============================================================
   🔹 PUBLIC ROUTES
   ============================================================ */
router.get("/brands", getBrands);
router.get("/", getProducts);
router.get("/:id", getProductById);

/* ============================================================
   🔸 ADMIN ROUTES
   ============================================================ */
router.post(
  "/",
  protect,
  authorizeRoles("admin"), // ✅ Hàm này giờ đã được import đúng
  (req, res, next) => {
    upload.array("images", 5)(req, res, (err) => {
      if (err) {
        console.error("❌ LỖI UPLOAD MULTER/CLOUDINARY:", err);
        return res.status(500).json({
          status: "upload_error",
          message: err.message || "Lỗi khi upload file lên Cloudinary.",
        });
      }
      next();
    });
  },
  validate(createProductSchema),
  createProduct
);

router.put(
  "/:id",
  protect,
  authorizeRoles("admin"), // ✅ Hàm này giờ đã được import đúng
  upload.array("images", 10),
  (req, res, next) => {
    if (!req.body.slug) req.body.slug = req.body.slug_text || "";
    next();
  },
  validate(updateProductSchema),
  updateProduct
);

router.delete("/:id", protect, authorizeRoles("admin"), deleteProduct); // ✅ Hàm này giờ đã được import đúng

export default router;
