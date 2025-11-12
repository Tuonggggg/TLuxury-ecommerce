// src/store/slices/authSlice.js
import { createSlice } from "@reduxjs/toolkit";

// Lấy thông tin user từ localStorage (nếu có) khi F5
const userInfoFromStorage = localStorage.getItem("userInfo")
  ? JSON.parse(localStorage.getItem("userInfo"))
  : null;

const initialState = {
  userInfo: userInfoFromStorage,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Action này sẽ được gọi khi đăng nhập thành công
    setCredentials: (state, action) => {
      state.userInfo = action.payload;
      localStorage.setItem("userInfo", JSON.stringify(action.payload));
    },
    // Action này sẽ được gọi khi logout
    logout: (state) => {
      state.userInfo = null;
      localStorage.removeItem("userInfo");
      localStorage.removeItem("cartItems"); // Đồng thời xóa giỏ hàng khách
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;

export default authSlice.reducer;