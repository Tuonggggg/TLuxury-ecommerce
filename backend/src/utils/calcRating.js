import Review from "../models/ReviewModel.js";
import Product from "../models/ProductModel.js";

export const updateProductRating = async (productId) => {
  const reviews = await Review.find({ product: productId });

  const numReviews = reviews.length;
  const rating =
    numReviews > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / numReviews
      : 0;

  await Product.findByIdAndUpdate(productId, { rating, numReviews });
};
