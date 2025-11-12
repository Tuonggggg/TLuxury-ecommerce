// src/store/store.js
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import cartReducer from "./slices/cartSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    // (Thêm các slice khác của bạn ở đây)
  },
  // middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
  devTools: true, // Bật Redux DevTools
});

export default store;