import React, { useState, useEffect } from "react";
import { AuthContext } from "./AuthContext"; // import từ file trên
import api from "@/lib/axios";
import { toast } from "sonner";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const res = await api.get("/users/profile");
        setUser(res.data);
      } catch (error) {
        console.warn("Phiên đăng nhập đã hết hạn hoặc không hợp lệ:", error);
        localStorage.removeItem("accessToken");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = (userData, accessToken) => {
    localStorage.setItem("accessToken", accessToken);
    setUser(userData);
    toast.success("Đăng nhập thành công! Chào mừng bạn trở lại.", { duration: 2000 });
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
      toast.info("Bạn đã đăng xuất thành công.");
    } catch (err) {
      console.error("Lỗi khi đăng xuất ở Backend:", err);
      toast.error("Đăng xuất thất bại. Vui lòng kiểm tra lại.");
    } finally {
      localStorage.removeItem("accessToken");
      setUser(null);
    }
  };

  const value = { user, isLoading, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {isLoading ? (
        <div className="flex justify-center items-center h-screen text-lg text-primary">
          Đang kiểm tra phiên đăng nhập...
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
