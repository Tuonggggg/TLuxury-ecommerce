// src/store/slices/cartSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { toast } from "sonner";

// [FIX 1] Import actions từ authSlice của bạn
// Vui lòng kiểm tra lại đường dẫn './authSlice' cho đúng với cấu trúc dự án của bạn
import { setCredentials, logout } from "./authSlice";

// 🧠 Hàm load giỏ hàng cho khách (guest)
const getInitialGuestCart = () => {
  try {
    const items = localStorage.getItem("cartItems");
    return items ? JSON.parse(items) : [];
  } catch (error) {
    console.error("Lỗi khi lấy giỏ hàng từ localStorage:", error);
    return [];
  }
};

// 🧠 Lưu giỏ hàng guest vào localStorage
const saveGuestCart = (items) => {
  try {
    localStorage.setItem("cartItems", JSON.stringify(items));
  } catch (error) {
    console.error("Lỗi khi lưu giỏ hàng vào localStorage:", error);
  }
};

const initialState = {
  cartItems: getInitialGuestCart(),
  loading: false,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    // (Các hàm của Khách (Guest) giữ nguyên)
    addToGuestCart: (state, action) => {
      const { product: productToAdd, qty: qtyToAdd } = action.payload;
      const MAX_QTY_PER_ITEM = 5;

      if (productToAdd.stock === 0) {
        toast.error(`"${productToAdd.name}" đã hết hàng.`);
        return;
      }

      const itemIndex = state.cartItems.findIndex(
        (i) => i.id === productToAdd._id
      );
      let newQty = qtyToAdd;
      if (itemIndex > -1) {
        newQty = state.cartItems[itemIndex].quantity + qtyToAdd;
      }

      if (newQty > MAX_QTY_PER_ITEM) {
        toast.error(
          `Bạn chỉ có thể mua tối đa ${MAX_QTY_PER_ITEM} sản phẩm này.`
        );
        return;
      }
      if (newQty > productToAdd.stock) {
        toast.error("Số lượng vượt quá tồn kho");
        return;
      }

      const newItem = {
        id: productToAdd._id,
        quantity: newQty,
        name: productToAdd.name,
        price: productToAdd.finalPrice,
        image: productToAdd.images?.[0] || "/placeholder.png",
        stock: productToAdd.stock,
      };

      if (itemIndex > -1) {
        state.cartItems[itemIndex] = newItem;
      } else {
        state.cartItems.push(newItem);
      }
      saveGuestCart(state.cartItems);
      toast.success(`Đã thêm vào giỏ hàng!`, {
        description: `${qtyToAdd} x ${productToAdd.name}`,
        action: {
          label: "Xem giỏ",
          onClick: () => (window.location.href = "/cart"),
        },
      });
    },
    updateGuestCartQty: (state, action) => {
      const { id, newQty } = action.payload;
      const itemIndex = state.cartItems.findIndex((i) => i.id === id);
      if (itemIndex === -1) return;
      const item = state.cartItems[itemIndex];
      const MAX_QTY_PER_ITEM = 5;

      if (newQty > MAX_QTY_PER_ITEM) {
        toast.error(`Tối đa ${MAX_QTY_PER_ITEM} sản phẩm này.`);
        return;
      }
      if (newQty > item.stock) {
        toast.error(`Số lượng vượt quá tồn kho (Còn ${item.stock})`);
        return;
      }
      if (newQty < 1) {
        state.cartItems.splice(itemIndex, 1);
        toast.success(`Đã xóa "${item.name}" khỏi giỏ hàng.`);
      } else {
        item.quantity = newQty;
      }
      saveGuestCart(state.cartItems);
    },
    removeGuestCartItem: (state, action) => {
      const idToRemove = action.payload;
      const itemIndex = state.cartItems.findIndex((i) => i.id === idToRemove);
      if (itemIndex > -1) {
        const itemName = state.cartItems[itemIndex].name;
        state.cartItems.splice(itemIndex, 1);
        saveGuestCart(state.cartItems);
        toast.success(`Đã xóa "${itemName}" khỏi giỏ hàng.`);
      }
    },

    // Action này nạp giỏ hàng từ API cho user đã đăng nhập
    setCartFromAPI: (state, action) => {
      state.cartItems = action.payload;
      // Không cần xóa localStorage ở đây, logic đăng nhập đã xử lý
    },

    // [FIX 2] Chỉ giữ lại action clearCartAfterOrder
    // Action này được gọi thủ công từ CheckoutPage khi đặt hàng thành công
    clearCartAfterOrder: (state) => {
      state.cartItems = [];
      localStorage.removeItem("cartItems");
      localStorage.removeItem("guestCartBackup");
    },
  },

  // [FIX 3] KHÔI PHỤC LẠI extraReducers
  // Đây là cách đúng để "lắng nghe" các action từ slice khác (authSlice)
  extraReducers: (builder) => {
    // 1. Khi đăng nhập thành công (lắng nghe action `setCredentials`)
    builder.addCase(setCredentials, (state) => {
      // Tự động xóa giỏ hàng của Khách (cả state và localStorage)
      state.cartItems = [];
      localStorage.removeItem("cartItems");
      localStorage.removeItem("guestCartBackup"); // Dọn dẹp backup cũ nếu có
    });

    // 2. Khi đăng xuất (lắng nghe action `logout`)
    builder.addCase(logout, (state) => {
      // Tự động xóa giỏ hàng của User (chỉ xóa state)
      // Để khi quay lại trang, getInitialGuestCart() có thể hoạt động
      state.cartItems = [];
    });
  },
});

export const {
  addToGuestCart,
  updateGuestCartQty,
  removeGuestCartItem,
  setCartFromAPI,

  // [FIX 4] Export action còn lại
  clearCartAfterOrder,
} = cartSlice.actions;

export default cartSlice.reducer;
