import Joi from "joi";

export const checkoutSchema = Joi.object({
  shippingAddress: Joi.string().min(5).required(),
  paymentMethod: Joi.string().valid("COD", "BankTransfer", "PayPal").required()
});
