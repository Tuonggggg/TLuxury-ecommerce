import Joi from "joi";
import mongoose from "mongoose";

// Validation cho tạo category
export const createCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  slug: Joi.string().min(2).max(100).required(),
  description: Joi.string().allow("").optional(),
  parent: Joi.string()
    .optional()
    .allow(null, "") // cho phép không có parent
    .custom((value, helpers) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    })
});

// Validation cho cập nhật category
export const updateCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  slug: Joi.string().min(2).max(100).optional(),
  description: Joi.string().allow("").optional(),
  parent: Joi.string()
    .optional()
    .allow(null, "")
    .custom((value, helpers) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    })
});
