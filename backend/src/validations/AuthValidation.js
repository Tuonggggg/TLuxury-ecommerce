import Joi from "joi";

export const registerSchema = Joi.object({
  username: Joi.string().trim().pattern(/^[a-zA-Z0-9_ ]+$/).min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid("user", "admin").optional()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});
