import express from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from "../controllers/ProductController.js";

import { protect } from "../middlewares/AuthMiddleware.js";
import { authorizeRoles } from "../middlewares/RoleMiddleware.js";
import { validate } from "../middlewares/ValidateMiddleware.js";
import { createProductSchema, updateProductSchema } from "../validations/ProductValidation.js";
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
  // Nếu muốn upload file: giữ upload.single("image"), nếu không gửi file bỏ cũng được
  upload.single("image"),
  (req, res, next) => {
    // Nếu là JSON, req.body đã có, nếu multipart, req.body sẽ được Multer parse
    if (!req.body.slug) req.body.slug = req.body.slug_text || ""; // fallback
    next();
  },
  validate(createProductSchema),
  createProduct
);

router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  upload.single("image"),
  (req, res, next) => {
    if (!req.body.slug) req.body.slug = req.body.slug_text || "";
    next();
  },
  validate(updateProductSchema),
  updateProduct
);

router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  deleteProduct
);

export default router;
