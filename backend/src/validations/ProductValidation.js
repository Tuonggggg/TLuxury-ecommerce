import Joi from "joi";

export const createProductSchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  price: Joi.number().positive().required(),
  
  // ✅ TRƯỜNG GIẢM GIÁ (DISCOUNT) MỚI
  discount: Joi.number()
    .integer()
    .min(0)
    .max(100)
    .optional() // Giảm giá có thể được bỏ qua, mặc định là 0 trong Mongoose
    .allow(null), // Cho phép null/undefined nếu không có giá trị
  
  description: Joi.string().allow("").optional(),
  
  // Lưu ý: Trường 'image' nên được đổi thành 'images' để khớp với logic upload file của bạn
  // images: Joi.array().items(Joi.string().uri()).optional(), 
  image: Joi.string().uri().allow("").optional(), 
  
  category: Joi.string().required(), // slug category
  stock: Joi.number().integer().min(0).optional(),
  brand: Joi.string().allow("").optional(),
});


export const updateProductSchema = Joi.object({
  name: Joi.string().min(2).max(200).optional(),
  price: Joi.number().positive().optional(),
  
  // ✅ TRƯỜNG GIẢM GIÁ (DISCOUNT) MỚI
  discount: Joi.number()
    .integer()
    .min(0)
    .max(100)
    .optional() // Tùy chọn khi cập nhật
    .allow(null),
    
  description: Joi.string().allow("").optional(),
  image: Joi.string().uri().allow("").optional(),
  category: Joi.string().optional(), // slug category
  stock: Joi.number().integer().min(0).optional(),
  brand: Joi.string().allow("").optional(),
});