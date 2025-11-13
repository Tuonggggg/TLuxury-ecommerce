import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, UserPlus, Phone, Mail, Lock, User, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';


// --- Cấu hình API Base URL (ĐÃ XÓA HARDCODE) ---
// const API_URL = 'http://localhost:5000/api/auth/register'; // ⚠️ ĐÃ XÓA HARDCODE

// --- ZOD SCHEMA (Giữ nguyên) ---
const registerSchema = z.object({
  fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  username: z.string().min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  confirmPassword: z.string(),
  phone: z.string().regex(/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ'),
  terms: z.boolean().refine((val) => val === true, {
    message: 'Bạn phải đồng ý với điều khoản sử dụng',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

// --- HELPER COMPONENT: InputField (Giữ nguyên) ---
const InputField = React.forwardRef(({ label, type, error, placeholder, name, icon: Icon, showToggle, toggleState, toggleHandler, ...rest }, ref) => {

  const inputType = showToggle && !toggleState ? 'password' : type;

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-2">
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="relative group">
        {/* Icon bên trái */}
        {Icon && (
          <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 w-5 h-5 group-focus-within:text-indigo-600 transition-colors" />
        )}

        <input
          id={name}
          ref={ref}
          name={name}
          type={inputType}
          className={`w-full ${Icon ? 'pl-12' : 'pl-4'} ${showToggle ? 'pr-14' : 'pr-4'} py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-600 transition-all bg-gray-50 font-medium ${error ? 'border-red-500' : 'border-gray-300'
            }`}
          placeholder={placeholder}
          {...rest}
        />

        {/* Nút ẩn/hiện mật khẩu */}
        {showToggle && (
          <button
            type="button"
            onClick={toggleHandler}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-indigo-700 p-1.5 rounded-full hover:bg-indigo-50/50 transition"
            aria-label={toggleState ? "Hide password" : "Show password"}
          >
            {toggleState ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-red-500 text-sm mt-1 flex items-center gap-1.5">
          <span className="font-semibold">{error.message}</span>
        </p>
      )}
    </div>
  );
});
InputField.displayName = 'InputField';

// --- MAIN COMPONENT ---

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(''); // State để lưu lỗi từ API
  const [successMessage, setSuccessMessage] = useState(''); // State để lưu thông báo thành công

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setApiError(''); // Reset lỗi trước khi submit
    setSuccessMessage(''); // Reset thông báo thành công

    // 1. Chuẩn hóa dữ liệu gửi đi (chỉ gửi những trường API yêu cầu)
    const payload = {
      username: data.username,
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      phone: data.phone,
    };

    try {
      // 2. Gọi API Đăng ký (ĐÃ SỬA: Dùng api instance và đường dẫn tương đối)
      const res = await api.post('/auth/register', payload);

      // 3. Xử lý thành công
      if (res.data && res.status === 201) {
        setSuccessMessage('Đăng ký tài khoản thành công! Vui lòng đăng nhập.');
        reset(); // Xóa form
        // 💡 Tùy chọn: Chuyển hướng người dùng đến trang đăng nhập sau 2 giây
        // setTimeout(() => navigate('/account/login'), 2000); 
      }

    } catch (error) {
      // 4. Xử lý lỗi từ API
      const errorMessage = error.response
        && error.response.data
        && error.response.data.message
        ? error.response.data.message // Lấy lỗi từ BE (ví dụ: "Email đã tồn tại.")
        : error.message || 'Đã có lỗi xảy ra trong quá trình đăng ký.';

      setApiError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl p-10 transform transition-all duration-500">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4 shadow-xl shadow-indigo-500/30">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Tạo Tài Khoản Mới</h1>
          <p className="text-gray-500 mt-2 text-md">Điền thông tin chi tiết dưới đây để bắt đầu</p>
        </div>

        {/* ⚠️ HIỂN THỊ LỖI API ⚠️ */}
        {apiError && (
          <div className="p-4 mb-6 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
            <span className="font-medium">Lỗi đăng ký:</span> {apiError}
          </div>
        )}

        {/* ⚠️ HIỂN THỊ THÔNG BÁO THÀNH CÔNG ⚠️ */}
        {successMessage && (
          <div className="p-4 mb-6 text-sm text-green-700 bg-green-100 rounded-lg" role="alert">
            <span className="font-medium">Thành công!</span> {successMessage}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* Hàng 1: Full Name */}
          <InputField
            label="Họ và Tên"
            type="text"
            name="fullName"
            placeholder="Nguyễn Văn A"
            icon={User}
            error={errors.fullName}
            {...register('fullName')}
          />

          <InputField
            label="Email"
            type="email"
            name="email"
            placeholder="email@example.com"
            icon={Mail}
            error={errors.email}
            {...register('email')}
          />

          {/* Hàng 2: Tên đăng nhập & Số điện thoại (2 cột) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="Tên đăng nhập"
              type="text"
              name="username"
              placeholder="username"
              icon={User}
              error={errors.username}
              {...register('username')}
            />

            <InputField
              label="Số điện thoại"
              type="tel"
              name="phone"
              placeholder="0123456789"
              icon={Phone}
              error={errors.phone}
              {...register('phone')}
            />
          </div>

          {/* Hàng 3: Mật khẩu & Xác nhận mật khẩu (2 cột) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="Mật khẩu"
              type="password"
              name="password"
              placeholder="••••••••"
              icon={Lock}
              error={errors.password}
              showToggle={true}
              toggleState={showPassword}
              toggleHandler={() => setShowPassword(!showPassword)}
              {...register('password')}
            />

            <InputField
              label="Xác nhận mật khẩu"
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              icon={Lock}
              error={errors.confirmPassword}
              showToggle={true}
              toggleState={showConfirmPassword}
              toggleHandler={() => setShowConfirmPassword(!showConfirmPassword)}
              {...register('confirmPassword')}
            />
          </div>

          {/* Hàng 4: Terms Checkbox */}
          <div className="pt-2">
            <div className="flex items-start">
              <input
                {...register('terms')}
                type="checkbox"
                className="mt-1 w-5 h-5 text-indigo-600 border-gray-300 rounded-md focus:ring-indigo-500 cursor-pointer"
              />
              <label className="ml-3 text-sm text-gray-600 select-none">
                Tôi đồng ý với{' '}
                <Link to="#" className="text-indigo-600 hover:text-indigo-700 hover:underline font-bold transition">
                  điều khoản dịch vụ
                </Link>{' '}
                và{' '}
                <Link to="#" className="text-indigo-600 hover:text-indigo-700 hover:underline font-bold transition">
                  chính sách bảo mật
                </Link>
              </label>
            </div>
            {errors.terms && (
              <p className="text-red-500 text-sm mt-2 ml-8 flex items-center gap-1.5 font-semibold">
                <CheckCircle className="w-4 h-4 text-red-500" />
                {errors.terms.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3.5 rounded-xl font-bold text-lg tracking-wider hover:from-indigo-700 hover:to-blue-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-indigo-500/30 transform hover:scale-[1.005] active:scale-[0.99] flex items-center justify-center mt-8"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                Đang xử lý...
              </div>
            ) : (
              'Hoàn Tất Đăng Ký'
            )}
          </button>
        </form>

        {/* Footer Link */}
        <p className="text-center text-md text-gray-500 mt-8">
          Bạn đã có tài khoản?{' '}
          <Link to="/account/login" className="text-indigo-600 hover:text-indigo-700 hover:underline font-bold">
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
