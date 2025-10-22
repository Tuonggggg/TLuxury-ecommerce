import Joi from "joi";

/* ============================================================
   ✅ SCHEMA: CREATE PRODUCT
   ============================================================ */
export const createProductSchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  price: Joi.number().positive().required(),

  // ✅ Giảm giá (Discount)
  discount: Joi.number()
    .integer()
    .min(0)
    .max(100)
    .optional()
    .allow(null),

  description: Joi.string().allow("").optional(),

  // ✅ Ảnh (dùng khi upload file, có thể bỏ qua)
  image: Joi.string().uri().allow("").optional(),

  category: Joi.string().required(), // slug hoặc ObjectId
  stock: Joi.number().integer().min(0).optional(),
  brand: Joi.string().allow("").optional(),
  status: Joi.string().valid("còn hàng", "hết hàng", "đặt trước").optional(),

  // ✅ Thông tin Flash Sale (có thể bỏ qua khi tạo)
  isFlashSale: Joi.boolean().optional(),
  flashSalePrice: Joi.number().positive().optional(),
  flashSaleStart: Joi.date().iso().optional(),
  flashSaleEnd: Joi.date().iso().optional(),
});


/* ============================================================
   ✅ SCHEMA: UPDATE PRODUCT
   ============================================================ */
export const updateProductSchema = Joi.object({
  name: Joi.string().min(2).max(200).optional(),
  price: Joi.number().positive().optional(),

  // ✅ Giảm giá (Discount)
  discount: Joi.number()
    .integer()
    .min(0)
    .max(100)
    .optional()
    .allow(null),

  description: Joi.string().allow("").optional(),
  image: Joi.string().uri().allow("").optional(),
  category: Joi.string().optional(),
  stock: Joi.number().integer().min(0).optional(),
  brand: Joi.string().allow("").optional(),
  status: Joi.string().valid("còn hàng", "hết hàng", "đặt trước").optional(),

  // ✅ Cập nhật Flash Sale
  isFlashSale: Joi.boolean().optional(),
  flashSalePrice: Joi.number().positive().optional(),
  flashSaleStart: Joi.date().iso().optional(),
  flashSaleEnd: Joi.date().iso().optional(),
});


/* ============================================================
   ⚡ SCHEMA: CẬP NHẬT FLASH SALE RIÊNG
   ============================================================ */
export const flashSaleSchema = Joi.object({
  isFlashSale: Joi.boolean().required(),
  flashSalePrice: Joi.number().positive().required(),
  flashSaleStart: Joi.date().iso().required(),
  flashSaleEnd: Joi.date().iso().required(),
});
