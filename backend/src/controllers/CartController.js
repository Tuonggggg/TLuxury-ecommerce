import Cart from "../models/CartModel.js";
import Product from "../models/ProductModel.js";

// ✅ ĐỊNH NGHĨA GIỚI HẠN MUA TỐI ĐA
const MAX_QTY_PER_ITEM = 5;

// Hàm tiện ích: Tính giá cuối cùng sau khi áp dụng discount (Giữ nguyên)
const calculateFinalPrice = (product) => {
  const price = product.price;
  const discount = product.discount || 0;
  // Sử dụng finalPrice từ virtual (nếu có) hoặc tính toán
  return product.finalPrice || price - (price * discount) / 100;
};

// =========================================================
// Lấy giỏ hàng của user
// =========================================================
export const getCart = async (req, res) => {
  if (!req.user || !req.user._id) {
    return res
      .status(401)
      .json({ message: "Vui lòng đăng nhập để xem giỏ hàng." });
  }

  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product"
    );
    if (!cart) return res.json({ items: [] }); // Tính tổng tiền

    const cartWithTotal = cart.toObject();
    cartWithTotal.totalPrice = cart.items.reduce((sum, item) => {
      const itemPrice = item.price || calculateFinalPrice(item.product);
      return sum + itemPrice * item.qty;
    }, 0);

    res.json(cartWithTotal);
  } catch (error) {
    console.error("Lỗi SERVER khi lấy giỏ hàng:", error);
    res
      .status(500)
      .json({ message: "Lỗi khi lấy giỏ hàng", error: error.message });
  }
};

// =========================================================
// Thêm sản phẩm vào giỏ
// =========================================================
export const addToCart = async (req, res) => {
  if (!req.user || !req.user._id) {
    return res
      .status(401)
      .json({ message: "Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng." });
  }

  const { productId, qty } = req.body;
  const quantityToAdd = Number(qty) || 1; // Đảm bảo qty là số

  try {
    const product = await Product.findById(productId);
    if (!product)
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    if (product.status === "hết hàng" || product.stock === 0)
      return res.status(400).json({ message: "Sản phẩm hiện đã hết hàng" });

    const finalPrice = calculateFinalPrice(product);
    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      // Tạo giỏ hàng mới
      cart = new Cart({
        user: req.user._id,
        items: [],
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    let newQty = quantityToAdd;

    if (itemIndex > -1) {
      // Sản phẩm đã có: Cập nhật số lượng
      newQty = cart.items[itemIndex].qty + quantityToAdd;
    }

    // ✅ KIỂM TRA GIỚI HẠN MUA TỐI ĐA (MAX 5)
    if (newQty > MAX_QTY_PER_ITEM) {
      return res.status(400).json({
        message: `Bạn chỉ có thể mua tối đa ${MAX_QTY_PER_ITEM} sản phẩm này.`,
      });
    } // ✅ KIỂM TRA TỒN KHO

    if (newQty > product.stock) {
      return res.status(400).json({
        message: "Số lượng vượt quá tồn kho.",
      });
    }

    // Nếu logic đã qua, cập nhật giỏ hàng
    if (itemIndex > -1) {
      cart.items[itemIndex].qty = newQty;
      cart.items[itemIndex].price = finalPrice; // Cập nhật giá mới nhất
    } else {
      cart.items.push({ product: productId, qty: newQty, price: finalPrice });
    }

    const updatedCart = await cart.save();
    res.json(await updatedCart.populate("items.product"));
  } catch (error) {
    console.error("Lỗi SERVER khi thêm sản phẩm vào giỏ:", error);
    // Bắt lỗi Validation từ Model (nếu có)
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res
      .status(500)
      .json({ message: "Lỗi Server nội bộ", error: error.message });
  }
};

// =========================================================
// Cập nhật số lượng sản phẩm
// =========================================================
export const updateCartItem = async (req, res) => {
  if (!req.user || !req.user._id) {
    return res
      .status(401)
      .json({ message: "Vui lòng đăng nhập để cập nhật giỏ hàng." });
  }

  const { qty } = req.body;
  const newQty = Number(qty); // Đảm bảo là số

  try {
    // ✅ KIỂM TRA GIỚI HẠN MUA TỐI ĐA (MAX 5)
    if (newQty > MAX_QTY_PER_ITEM) {
      return res.status(400).json({
        message: `Bạn chỉ có thể mua tối đa ${MAX_QTY_PER_ITEM} sản phẩm này.`,
      });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart)
      return res.status(404).json({ message: "Giỏ hàng không tồn tại" });

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === req.params.productId
    );

    if (itemIndex === -1)
      return res.status(404).json({ message: "Sản phẩm không có trong giỏ" });

    const product = await Product.findById(req.params.productId);
    if (!product)
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });

    // ✅ KIỂM TRA TỒN KHO
    if (newQty > product.stock)
      return res
        .status(400)
        .json({ message: `Số lượng vượt quá tồn kho (Còn ${product.stock})` });

    const finalPrice = calculateFinalPrice(product);

    if (newQty <= 0) {
      // Xóa nếu số lượng là 0
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].qty = newQty;
      cart.items[itemIndex].price = finalPrice; // Cập nhật giá
    }

    const updatedCart = await cart.save();
    res.json(await updatedCart.populate("items.product"));
  } catch (error) {
    console.error("Lỗi SERVER khi cập nhật giỏ hàng:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res
      .status(500)
      .json({ message: "Lỗi khi cập nhật giỏ hàng", error: error.message });
  }
};

// =========================================================
// Xóa sản phẩm khỏi giỏ (Giữ nguyên)
// =========================================================
export const removeFromCart = async (req, res) => {
  if (!req.user || !req.user._id) {
    return res
      .status(401)
      .json({ message: "Vui lòng đăng nhập để xóa sản phẩm khỏi giỏ hàng." });
  }

  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart)
      return res.status(404).json({ message: "Giỏ hàng không tồn tại" });

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== req.params.productId
    );

    const updatedCart = await cart.save();
    res.json(await updatedCart.populate("items.product"));
  } catch (error) {
    console.error("Lỗi SERVER khi xóa sản phẩm khỏi giỏ:", error);
    res
      .status(500)
      .json({ message: "Lỗi khi xóa sản phẩm khỏi giỏ", error: error.message });
  }
};

// =========================================================
// Xóa toàn bộ giỏ hàng (Giữ nguyên)
// =========================================================
export const clearCart = async (req, res) => {
  section_product_management;
  if (!req.user || !req.user._id) {
    return res
      .status(401)
      .json({ message: "Vui lòng đăng nhập để xóa toàn bộ giỏ hàng." });
  }

  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.json({ message: "Đã xóa toàn bộ giỏ hàng" });
  } catch (error) {
    console.error("Lỗi SERVER khi xóa toàn bộ giỏ hàng:", error);
    res
      .status(500)
      .json({ message: "Lỗi khi xóa giỏ hàng", error: error.message });
  }
};
