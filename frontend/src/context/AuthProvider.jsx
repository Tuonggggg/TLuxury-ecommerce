import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import api from "@/lib/axios";
import { toast } from "sonner";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  // 🚨 KHỞI TẠO HOOKS CẦN THIẾT
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        // Giả định API này trả về đối tượng user bao gồm trường 'role'
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


  // ----------------------------------------------------------------------
  // 🚨 LOGIC CHUYỂN HƯỚNG ADMIN TỰ ĐỘNG
  // ----------------------------------------------------------------------
  useEffect(() => {
    // Chỉ chạy khi user data đã được tải xong
    if (isLoading) return;

    const isAdmin = user && user.role === 'admin';
    const isAdminRoute = location.pathname.startsWith('/admin');

    if (isAdmin) {
      // Nếu là Admin và đang ở trang không phải Admin
      if (!isAdminRoute) {
        navigate('/admin/dashboard', { replace: true }); // Chuyển hướng tới trang Dashboard Admin
      }
    }
    // OPTIONAL: Nếu bạn muốn người dùng thường không thể truy cập /admin
    else if (user && !isAdmin && isAdminRoute) {
      navigate('/', { replace: true }); // Chuyển hướng người dùng thường ra trang chủ
      toast.warning("Truy cập bị từ chối.");
    }
  }, [user, isLoading, location.pathname, navigate]);


  const login = (userData, accessToken) => {
    localStorage.setItem("accessToken", accessToken);
    setUser(userData);
    toast.success("Đăng nhập thành công! Chào mừng bạn trở lại.", { duration: 2000 });

    // 🚨 Chuyển hướng ngay sau khi đăng nhập thành công nếu là Admin
    if (userData.role === 'admin') {
      navigate('/admin', { replace: true });
    } else {
      navigate('/'); // Chuyển về trang chủ nếu là người dùng thường
    }
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
      navigate('/account/login'); // Chuyển hướng đến trang đăng nhập sau khi logout
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