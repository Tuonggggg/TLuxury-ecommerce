import express from 'express';
import { applyDiscount } from '../controllers/DiscountController.js'; 
// Giả định API này không cần bảo vệ bằng 'protect' để guest có thể sử dụng
// Nếu bạn muốn user phải đăng nhập, thêm middleware protect vào đây

const router = express.Router();

// Route: POST /api/discounts/apply
router.post('/apply', applyDiscount); 

export default router;

// ⚠️ Đảm bảo bạn thêm dòng này vào file server chính (server.js/index.js):
// import discountRoutes from './routes/DiscountRoutes.js';
// app.use('/api/discounts', discountRoutes);