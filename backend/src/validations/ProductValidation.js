import Joi from "joi";

export const createProductSchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  price: Joi.number().positive().required(),
  description: Joi.string().allow("").optional(),
  image: Joi.string().uri().allow("").optional(),
  category: Joi.string().required(), // slug category
  stock: Joi.number().integer().min(0).optional(),
  brand: Joi.string().allow("").optional(),
});

export const updateProductSchema = Joi.object({
  name: Joi.string().min(2).max(200).optional(),
  price: Joi.number().positive().optional(),
  description: Joi.string().allow("").optional(),
  image: Joi.string().uri().allow("").optional(),
  category: Joi.string().optional(), // slug category
  stock: Joi.number().integer().min(0).optional(),
  brand: Joi.string().allow("").optional(),
});
