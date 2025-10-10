import Joi from "joi";

export const validate = (schema, property = "body") => {
  return (req, res, next) => {
    let value = req[property];

    // Nếu body là string (form-data) -> parse
    if (typeof value !== "object" || Array.isArray(value)) {
      try {
        value = JSON.parse(value);
      } catch {
        return next();
      }
    }

    const { error, value: validated } = schema.validate(value, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const err = new Error(error.details.map((d) => d.message).join(", "));
      err.statusCode = 400;
      return next(err);
    }

    req[property] = validated;
    next();
  };
};
