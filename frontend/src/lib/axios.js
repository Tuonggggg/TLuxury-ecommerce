// src/lib/axios.js
import axios from "axios";

const BASE_URL = import.meta.env.MODE == "development" ? "http://localhost:5000/api" : "/api";

// 💡 LƯU Ý: Tạo một instance KHÁC cho yêu cầu refresh để tránh vòng lặp interceptor
const refreshInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// 1. Request Interceptor (Đính kèm Access Token)
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Response Interceptor (Xử lý 401 và Refresh)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config; // Điều kiện: Lỗi 401 VÀ chưa thử lại (tránh vòng lặp)

    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // 🔑 TRIỂN KHAI LOGIC REFRESH TOKEN

      try {
        // Gọi endpoint refresh token (sử dụng refreshInstance)
        const res = await refreshInstance.post("/auth/refresh", {});
        const newAccessToken = res.data.accessToken;

        // 1. Lưu token mới vào Local Storage
        localStorage.setItem("accessToken", newAccessToken);

        // 2. Cập nhật header cho request gốc và instance hiện tại
        api.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${newAccessToken}`; // Cập nhật instance chính
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // 3. Thử lại request gốc với token mới
        return api(originalRequest);
      } catch (refreshError) {
        // Nếu Refresh Token cũng không hợp lệ (lỗi 403 từ BE)

        // 1. Xóa tất cả token cục bộ
        localStorage.removeItem("accessToken");

        // 2. Chuyển hướng người dùng đăng nhập lại
        window.location.href = "/account/login";
        return Promise.reject(refreshError);
      }
    }

    // Nếu lỗi không phải 401 hoặc đã thử refresh thất bại
    return Promise.reject(error);
  }
);

export default api;
