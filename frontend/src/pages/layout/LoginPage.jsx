import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, LogIn, Mail, Lock, XCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
// import axios from 'axios'; // KHÔNG SỬ DỤNG AXIOS CHUẨN MÀ DÙNG INSTANCE ĐÃ CẤU HÌNH
import api from '../../lib/axios'; // <-- ĐÃ SỬA: Thay thế alias '@/lib/axios' bằng đường dẫn tương đối
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth'; // <-- ĐÃ SỬA: Thay thế alias '@/hooks/useAuth' bằng đường dẫn tương đối


// ĐÃ XÓA: const API_URL = 'http://localhost:5000/api/auth/login';

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  rememberMe: z.boolean().optional(),
});

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  // [SỬA] Gỡ bỏ dispatch
  // const dispatch = useDispatch();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: false },
  });

  const onSubmit = async (data) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setApiError('');
    const payload = { email: data.email, password: data.password };

    try {
      // ⚠️ ĐÃ SỬA: SỬ DỤNG INSTANCE API VÀ CHỈ TRUYỀN PATH TƯƠNG ĐỐI '/auth/login'
      // BASE URL (ví dụ: /api) sẽ được tự động thêm vào từ axios.js
      const res = await api.post('/auth/login', payload);

      if (res.data && res.data.accessToken) {
        const { accessToken, ...userData } = res.data;

        // 1. GỌI CONTEXT: Cập nhật trạng thái
        // (Hàm login() này sẽ dispatch setCredentials,
        // và extraReducer của cartSlice sẽ tự động chạy)
        login(userData, accessToken);

        // [SỬA] 2. GỠ BỎ DISPATCH THỦ CÔNG
        // dispatch(clearCartOnLogout()); // <--- ĐÃ XÓA

        // 3. Chuyển hướng
        setTimeout(() => { navigate('/', { replace: true }); }, 300); // Thêm replace: true
      }
    } catch (error) {
      // (Xử lý lỗi giữ nguyên)
      const errorMessage = error.response?.data?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.';
      setApiError(errorMessage);
      toast.error('Đăng nhập thất bại', {
        description: errorMessage,
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // (Toàn bộ JSX return của bạn giữ nguyên)
  return (
    <div className=" bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mb-4">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Đăng Nhập</h1>
            <p className="text-gray-600 mt-2">Chào mừng bạn quay trở lại!</p>
          </div>

          {/* ⚠️ HIỂN THỊ LỖI API ⚠️ */}
          {apiError && (
            <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 border border-red-300 rounded-lg flex items-center" role="alert">
              <XCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <span className="font-medium">{apiError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Mail size={20} />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="email@example.com"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1.5 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock size={20} />
                </div>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className={`w-full pl-11 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1.5 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  {...register('rememberMe')}
                  type="checkbox"
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-600">Ghi nhớ đăng nhập</span>
              </label>
              <Link to="/account/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium hover:underline">
                Quên mật khẩu?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-indigo-500/30"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Đang xử lý...
                </div>
              ) : (
                'Đăng Nhập'
              )}
            </button>
          </form>
          {/* Sign Up Link */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Chưa có tài khoản?{' '}
            <Link to="/account/register" className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
      <style>
        {/* Thêm hiệu ứng focus cho input */}
        {`
        input:focus {box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.4);} `
        }
      </style>
    </div>
  );
}