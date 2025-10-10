import Cart from "../models/CartModel.js";
import Product from "../models/ProductModel.js";

// Hàm tiện ích: Tính giá cuối cùng sau khi áp dụng discount
const calculateFinalPrice = (product) => {
  const price = product.price;
  const discount = product.discount || 0;
  return price - (price * discount) / 100;
};

// =========================================================
// KIỂM TRA XÁC THỰC NGƯỜI DÙNG
// Tất cả các hàm bên dưới đều giả định đã có protect middleware,
// nhưng chúng ta sẽ thêm kiểm tra user_id tường minh để tránh lỗi 500.
// =========================================================

// Lấy giỏ hàng của user
export const getCart = async (req, res) => {
  // 🚨 KIỂM TRA BẮT BUỘC
  if (!req.user || !req.user._id) {
    return res
      .status(401)
      .json({ message: "Vui lòng đăng nhập để xem giỏ hàng." });
  }

  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product"
    );
    if (!cart) return res.json({ items: [] });

    // Tính tổng tiền (sử dụng giá đã lưu trong giỏ nếu có, hoặc tính lại)
    const cartWithTotal = cart.toObject();
    cartWithTotal.totalPrice = cart.items.reduce((sum, item) => {
      // Ưu tiên sử dụng giá đã lưu trong giỏ (item.price)
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

// Thêm sản phẩm vào giỏ
export const addToCart = async (req, res) => {
  // 🚨 BẮT LỖI XÁC THỰC (LỖI 500)
  if (!req.user || !req.user._id) {
    return res
      .status(401)
      .json({ message: "Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng." });
  }

  const { productId, qty } = req.body;

  try {
    const product = await Product.findById(productId);
    if (!product)
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    if (product.status === "unavailable")
      return res.status(400).json({ message: "Sản phẩm hiện không bán" });

    // ✅ LƯU Ý: Tính giá sản phẩm cuối cùng cần lưu
    const finalPrice = calculateFinalPrice(product);

    // Kiểm tra tồn kho
    if (product.stock < qty)
      return res
        .status(400)
        .json({
          message: `Số lượng vượt quá tồn kho. Còn ${product.stock} sản phẩm.`,
        });

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      // Tạo giỏ hàng mới
      cart = new Cart({
        user: req.user._id,
        items: [{ product: productId, qty, price: finalPrice }], // ✅ Đã thêm price
      });
    } else {
      const itemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId
      );
      if (itemIndex > -1) {
        // Sản phẩm đã có: Cập nhật số lượng
        const newQty = cart.items[itemIndex].qty + qty;
        if (newQty > product.stock)
          return res
            .status(400)
            .json({
              message: `Số lượng mới (${newQty}) vượt quá tồn kho (${product.stock}).`,
            });

        cart.items[itemIndex].qty = newQty;
        cart.items[itemIndex].price = finalPrice; // ✅ Cập nhật giá theo giá hiện tại
      } else {
        // Sản phẩm chưa có: Thêm vào mảng
        cart.items.push({ product: productId, qty, price: finalPrice }); // ✅ Đã thêm price
      }
    }

    const updatedCart = await cart.save();
    res.json(await updatedCart.populate("items.product"));
  } catch (error) {
    console.error("Lỗi SERVER khi thêm sản phẩm vào giỏ:", error);
    res
      .status(500)
      .json({
        message: "Lỗi Server nội bộ khi thêm sản phẩm vào giỏ",
        error: error.message,
      });
  }
};

// Cập nhật số lượng sản phẩm
export const updateCartItem = async (req, res) => {
  // 🚨 BẮT LỖI XÁC THỰC (LỖI 500)
  if (!req.user || !req.user._id) {
    return res
      .status(401)
      .json({ message: "Vui lòng đăng nhập để cập nhật giỏ hàng." });
  }

  const { qty } = req.body;

  try {
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
    if (qty > product.stock)
      return res.status(400).json({ message: "Số lượng vượt quá tồn kho" });

    // ✅ Cập nhật giá cuối cùng khi cập nhật số lượng
    const finalPrice = calculateFinalPrice(product);

    if (qty <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].qty = qty;
      cart.items[itemIndex].price = finalPrice; // ✅ Cập nhật giá
    }

    const updatedCart = await cart.save();
    res.json(await updatedCart.populate("items.product"));
  } catch (error) {
    console.error("Lỗi SERVER khi cập nhật giỏ hàng:", error);
    res
      .status(500)
      .json({ message: "Lỗi khi cập nhật giỏ hàng", error: error.message });
  }
};

// Xóa sản phẩm khỏi giỏ
export const removeFromCart = async (req, res) => {
  // 🚨 BẮT LỖI XÁC THỰC (LỖI 500)
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

// Xóa toàn bộ giỏ hàng
export const clearCart = async (req, res) => {
  // 🚨 BẮT LỖI XÁC THỰC (LỖI 500)
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
