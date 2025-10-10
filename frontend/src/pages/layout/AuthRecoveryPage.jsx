import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, ArrowLeft, CheckCircle, KeyRound } from "lucide-react";
import api from "@/lib/axios";

// Schema validation
const forgotPasswordSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
});

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
    confirmPassword: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export default function AuthRecoveryPage() {
  const { token } = useParams(); // Nếu có token → reset password mode
  const navigate = useNavigate();

  const isResetMode = !!token;

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(isResetMode ? resetPasswordSchema : forgotPasswordSchema),
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      if (isResetMode) {
        // Đặt lại mật khẩu
        const res = await api.put(`/auth/reset-password/${token}`, {
          password: data.password,
        });

        if (res.data?.success) {
          setIsSuccess(true);
        } else {
          setErrorMsg(res.data?.message || "Không thể đặt lại mật khẩu.");
        }
      } else {
        // Gửi email khôi phục
        const res = await api.post("/auth/forgot-password", {
          email: data.email,
        });

        if (res.data?.success) {
          setIsSuccess(true);
        } else {
          setErrorMsg(res.data?.message || "Không thể gửi email đặt lại mật khẩu.");
        }
      }
    } catch (error) {
      console.error("AuthRecoveryPage error:", error);
      const message = error.response?.data?.message;
      setErrorMsg(message || "Lỗi máy chủ! Vui lòng thử lại sau.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 1️⃣ Giao diện thành công ---
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-3">
            {isResetMode ? "Đặt lại Mật khẩu Thành công!" : "Email đã được gửi!"}
          </h1>
          <p className="text-gray-600 mb-6">
            {isResetMode
              ? "Mật khẩu của bạn đã được cập nhật. Hãy đăng nhập bằng mật khẩu mới."
              : "Vui lòng kiểm tra hộp thư của bạn để nhận link đặt lại mật khẩu."}
          </p>
          <button
            onClick={() => navigate(isResetMode ? "/account/login" : "/")}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition shadow-lg shadow-indigo-500/30"
          >
            <ArrowLeft size={18} className="mr-2 inline" />
            {isResetMode ? "Đi tới Đăng nhập" : "Về Trang chủ"}
          </button>
        </div>
      </div>
    );
  }

  // --- 2️⃣ Form chính ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            {isResetMode ? (
              <KeyRound className="w-16 h-16 text-white bg-indigo-600 p-2 rounded-full inline-block mb-4" />
            ) : (
              <Mail className="w-16 h-16 text-white bg-indigo-600 p-2 rounded-full inline-block mb-4" />
            )}
            <h1 className="text-3xl font-bold text-gray-900">
              {isResetMode ? "Tạo Mật khẩu Mới" : "Quên Mật khẩu?"}
            </h1>
            <p className="text-gray-600 mt-2">
              {isResetMode
                ? "Nhập mật khẩu mới cho tài khoản của bạn."
                : "Nhập email để nhận hướng dẫn đặt lại mật khẩu."}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {isResetMode ? (
              <>
                {/* Mật khẩu mới */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mật khẩu Mới
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      {...register("password")}
                      type="password"
                      placeholder="Nhập mật khẩu mới"
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition"
                    />
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1.5">{errors.password.message}</p>
                  )}
                </div>

                {/* Xác nhận mật khẩu */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Xác nhận Mật khẩu
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      {...register("confirmPassword")}
                      type="password"
                      placeholder="Xác nhận mật khẩu"
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition"
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1.5">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </>
            ) : (
              // Form nhập email
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email của bạn
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    {...register("email")}
                    type="email"
                    placeholder="Nhập email của bạn"
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1.5">{errors.email.message}</p>
                )}
              </div>
            )}

            {errorMsg && <p className="text-red-500 text-sm mt-1.5">{errorMsg}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 flex items-center justify-center shadow-lg shadow-indigo-500/30"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {isResetMode ? "Đang Cập nhật..." : "Đang gửi..."}
                </div>
              ) : isResetMode ? (
                "Đặt lại Mật khẩu"
              ) : (
                "Gửi Link Đặt lại"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
