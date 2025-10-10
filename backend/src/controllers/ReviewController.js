import Review from "../models/ReviewModel.js";
import Product from "../models/ProductModel.js";

// Hàm cập nhật rating và numReviews của product
const updateProductRating = async (productId) => {
  const reviews = await Review.find({ product: productId });
  const numReviews = reviews.length;
  const rating = numReviews > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / numReviews : 0;
  await Product.findByIdAndUpdate(productId, { rating, numReviews });
};

// @desc    Tạo review cho sản phẩm
export const createReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;

    if (!productId || !rating)
      return res.status(400).json({ message: "Product và rating là bắt buộc" });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Sản phẩm không tồn tại" });

    const existingReview = await Review.findOne({ user: req.user._id, product: productId });
    if (existingReview)
      return res.status(400).json({ message: "Bạn đã review sản phẩm này rồi" });

    const review = new Review({ user: req.user._id, product: productId, rating, comment });
    const savedReview = await review.save();

    await updateProductRating(productId); // cập nhật rating cho product

    res.status(201).json(await savedReview.populate("user", "name email"));
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi tạo review", error: error.message });
  }
};

// @desc    Cập nhật review
export const updateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Review không tồn tại" });

    if (req.user.role !== "admin" && review.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa review này" });

    if (rating) review.rating = rating;
    if (comment) review.comment = comment;

    const updatedReview = await review.save();
    await updateProductRating(updatedReview.product); // cập nhật rating

    res.json(await updatedReview.populate("user", "name email"));
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật review", error: error.message });
  }
};

// @desc    Xóa review
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Review không tồn tại" });

    if (req.user.role !== "admin" && review.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Bạn không có quyền xóa review này" });

    const productId = review.product;
    await review.remove();

    await updateProductRating(productId); // cập nhật rating sau khi xóa

    res.json({ message: "Review đã được xóa" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa review", error: error.message });
  }
};

// @desc    Lấy tất cả review của sản phẩm
export const getReviewsByProduct = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy review sản phẩm", error: error.message });
  }
};

// @desc    Lấy tất cả review của user
export const getReviewsByUser = async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.params.userId !== req.user._id.toString())
      return res.status(403).json({ message: "Bạn không có quyền xem review này" });

    const reviews = await Review.find({ user: req.params.userId })
      .populate("product", "name slug")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy review của user", error: error.message });
  }
};
