import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ. Vui lòng nhập lại.'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự.'),
  rememberMe: z.boolean().optional(),
});