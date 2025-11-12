/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // ✅ Thêm Tabs
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // ✅ Giữ lại để hiển thị placeholder
import { Loader2, User, Mail, Phone, MapPin, Key, LogOut, History } from 'lucide-react';
import api from '@/lib/axios';
import { Link } from 'react-router-dom'; // Thêm Link cho My Orders

// ✅ 1. Zod Schema: Loại bỏ avatarFile
const profileSchema = z.object({
  username: z.string().min(3, "Tên người dùng phải có ít nhất 3 ký tự").optional(),
  email: z.string().email("Email không hợp lệ").optional(),
  phone: z.string().regex(/^[0-9]{10,11}$/, "Số điện thoại không hợp lệ").optional().or(z.literal("")).transform(v => v || ""),
  address: z.string().optional().or(z.literal("")).transform(v => v || ""),
  // ❌ avatarFile đã bị loại bỏ
});

// ✅ 2. Zod Schema cho đổi mật khẩu (Giữ nguyên)
const passwordSchema = z.object({
  password: z.string().min(6, "Mật khẩu mới phải có ít nhất 6 ký tự"),
  passwordConfirm: z.string().min(6, "Xác nhận mật khẩu không được để trống"),
}).refine(data => data.password === data.passwordConfirm, {
  message: "Mật khẩu xác nhận không khớp!",
  path: ["passwordConfirm"],
});


const ProfilePage = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // ❌ LOẠI BỎ STATE AVATAR PREVIEW

  // Form chính (Thông tin cá nhân)
  const { register, handleSubmit, formState: { errors: profileErrors }, reset } = useForm({
    resolver: zodResolver(profileSchema),
  });

  // Form đổi mật khẩu (Tách biệt)
  const { register: registerPass, handleSubmit: handleSubmitPass, formState: { errors: passErrors }, reset: resetPass } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  // --- Fetch User Data ---
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users/profile'); // Gọi route getUserProfile
      setUserData(data);

      // Set default values cho form chính
      reset({
        username: data.username || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
      });
    } catch (error) {
      toast.error("Vui lòng đăng nhập để xem thông tin cá nhân!");
      navigate('/account/login');
    } finally {
      setLoading(false);
    }
  }, [navigate, reset]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);


  // --- Handlers ---

  // ✅ 3. Xử lý Cập nhật Thông tin (Dùng JSON vì không còn file)
  const handleProfileUpdate = async (data) => {
    setIsSubmitting(true);

    // Payload chỉ chứa dữ liệu text/number
    const payload = {
      username: data.username,
      email: data.email,
      phone: data.phone,
      address: data.address,
      // (Thêm lat/lng nếu bạn muốn cập nhật vị trí)
    };

    try {
      // Gửi dữ liệu JSON
      const res = await api.put('/users/profile', payload);
      toast.success(res.data.message || "Cập nhật thành công!");
      setUserData(res.data.user);
    } catch (error) {
      const msg = error.response?.data?.message || "Cập nhật thất bại.";
      toast.error("Lỗi cập nhật!", { description: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ 4. Xử lý Đổi mật khẩu
  const handlePasswordChange = async (data) => {
    setIsSubmitting(true);
    try {
      await api.put('/users/profile', { password: data.password });
      toast.success("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");
      // ✅ Thêm logic đăng xuất vì mật khẩu đã thay đổi
      await api.post('/auth/logout');
      navigate('/account/login');
      resetPass();
    } catch (error) {
      const msg = error.response?.data?.message || "Đổi mật khẩu thất bại.";
      toast.error("Lỗi mật khẩu!", { description: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xử lý đăng xuất
  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      toast.success("Đăng xuất thành công!");
      navigate('/account/login');
    } catch (error) {
      toast.error("Lỗi đăng xuất!");
    }
  };

  // --- UI Render ---
  if (loading) {
    return <div className="flex justify-center items-center h-[70vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }


  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8 border-b pb-2 flex items-center gap-2">
        <User className="w-6 h-6 text-indigo-600" /> Hồ Sơ Cá Nhân
      </h1>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Cột 1: Thông tin nhanh và Menu */}
        <div className="md:col-span-1 space-y-4 bg-white p-6 rounded-lg shadow-md border">
          <div className="flex flex-col items-center">
            <h2 className="text-2xl font-bold mt-4">{userData?.username}</h2>
            <p className="text-sm text-gray-500">{userData?.email}</p>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="flex items-center text-sm text-gray-600"><Mail className="w-4 h-4 mr-2" /> {userData?.email}</p>
            <p className="flex items-center text-sm text-gray-600"><Phone className="w-4 h-4 mr-2" /> {userData?.phone || "Chưa cập nhật"}</p>
            <p className="flex items-start text-sm text-gray-600"><MapPin className="w-4 h-4 mr-2 mt-1" /> {userData?.address || "Chưa cập nhật"}</p>
          </div>

          <Separator />

          <Button asChild variant="outline" className="w-full text-left justify-start">
            <Link to="/my-orders"><History className="w-4 h-4 mr-2" /> Lịch sử đơn hàng</Link>
          </Button>

          <Button variant="destructive" className="w-full mt-4" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" /> Đăng xuất
          </Button>
        </div>

        {/* Cột 2 & 3: Forms cập nhật với Tabs */}
        <div className="md:col-span-2">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-200">
              <TabsTrigger value="profile">Thông tin cá nhân</TabsTrigger>
              <TabsTrigger value="password">Đổi mật khẩu</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="bg-white p-6 rounded-lg shadow-md border">
              <form onSubmit={handleSubmit(handleProfileUpdate)} className="space-y-6">
                {/* Fields */}
                <InputGroup label="Tên người dùng" name="username" register={register} error={profileErrors.username} />
                <InputGroup label="Email" name="email" register={register} error={profileErrors.email} disabled />
                <InputGroup label="Số điện thoại" name="phone" register={register} error={profileErrors.phone} />
                <InputGroup label="Địa chỉ" name="address" register={register} error={profileErrors.address} />

                <Button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-700">
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Lưu thay đổi
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="password" className="bg-white p-6 rounded-lg shadow-md border">
              <form onSubmit={handleSubmitPass(handlePasswordChange)} className="space-y-6">
                <InputGroup label="Mật khẩu mới" name="password" type="password" register={registerPass} error={passErrors.password} />
                <InputGroup label="Xác nhận mật khẩu" name="passwordConfirm" type="password" register={registerPass} error={passErrors.passwordConfirm} />

                <Button type="submit" variant="destructive" disabled={isSubmitting} className="w-full">
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Đổi mật khẩu
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

// Component phụ cho Input Group
const InputGroup = ({ label, name, type = 'text', register, error, disabled = false }) => (
  <div>
    <Label htmlFor={name}>{label}</Label>
    <Input
      id={name}
      type={type}
      {...register(name)}
      disabled={disabled}
      className={error ? 'border-red-500' : ''}
    />
    {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
  </div>
);