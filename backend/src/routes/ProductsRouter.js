import express from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/ProductController.js";

import { protect } from "../middlewares/AuthMiddleware.js";
import { authorizeRoles } from "../middlewares/RoleMiddleware.js";
import { validate } from "../middlewares/ValidateMiddleware.js";
import {
  createProductSchema,
  updateProductSchema,
} from "../validations/ProductValidation.js";
import upload from "../middlewares/UploadMiddleware.js";

const router = express.Router();

// ✅ Public routes
router.get("/", getProducts);
router.get("/:id", getProductById);
// ✅ Admin routes
router.post(
  "/",
  protect,
  authorizeRoles("admin"),
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
  authorizeRoles("admin"),
  upload.array("images", 10), // ✅ update cũng nên chấp nhận nhiều ảnh
  (req, res, next) => {
    if (!req.body.slug) req.body.slug = req.body.slug_text || "";
    next();
  },
  validate(updateProductSchema),
  updateProduct
);

router.delete("/:id", protect, authorizeRoles("admin"), deleteProduct);

export default router;
