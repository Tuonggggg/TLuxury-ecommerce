// src/cron/stockCleanup.js
import cron from 'node-cron';
import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';

const runStockCleanup = () => {
    // Chạy mỗi phút (* * * * *)
    cron.schedule('* * * * *', async () => {
        // console.log('[CRON] Running expired stock cleanup...');
        
        // 1. Tìm các đơn hàng chưa thanh toán, đang chờ/xử lý, đã hết hạn trừ kho tạm
        const expiredOrders = await Order.find({
            isPaid: false,
            orderStatus: { $in: ['pending', 'processing'] }, // Đơn đang chờ xử lý
            stockReservationExpires: { $lt: new Date() } // Đã hết hạn (quá 15 phút)
        }).select('orderItems orderStatus note'); 

        if (expiredOrders.length === 0) {
            return;
        }

        for (const order of expiredOrders) {
            console.log(`[CRON] Cancelling and refunding stock for Order ID: ${order._id}`);
            
            // 2. Hoàn trả Stock
            for (const item of order.orderItems) {
                // Tăng số lượng stock lên lại
                await Product.findByIdAndUpdate(item.product, { 
                    $inc: { stock: item.qty } 
                });
            }

            // 3. Cập nhật trạng thái đơn hàng thành Hủy
            order.orderStatus = 'cancelled';
            const noteText = "Hủy tự động: Quá thời gian thanh toán (15 phút).";
            order.note = order.note ? `${order.note} - ${noteText}` : noteText;
            await order.save();
        }
    });
};

export default runStockCleanup;