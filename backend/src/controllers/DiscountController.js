import Discount from '../models/DiscountModel.js';

/**
 * Endpoint: POST /api/discounts/apply
 * Chức năng: Kiểm tra mã giảm giá và trả về số tiền giảm.
 */
export const applyDiscount = async (req, res) => {
    // subTotal là tổng tiền hàng (chưa có phí ship)
    const { code, subTotal } = req.body; 

    if (!code || typeof subTotal !== 'number' || subTotal <= 0) {
        return res.status(400).json({ message: "Dữ liệu đầu vào không hợp lệ." });
    }

    try {
        const foundCoupon = await Discount.findOne({ code: code.toUpperCase(), isActive: true });

        if (!foundCoupon) {
            return res.status(404).json({ message: "Mã giảm giá không tồn tại hoặc không hoạt động." });
        }

        // 1. Kiểm tra thời hạn
        if (foundCoupon.expiryDate && foundCoupon.expiryDate < new Date()) {
            return res.status(400).json({ message: "Mã giảm giá đã hết hạn sử dụng." });
        }
        
        // 2. Kiểm tra đơn hàng tối thiểu
        if (subTotal < foundCoupon.minOrder) {
            return res.status(400).json({ 
                message: `Đơn hàng tối thiểu phải là ${foundCoupon.minOrder.toLocaleString()}₫.` 
            });
        }

        let discountAmount = 0;

        if (foundCoupon.type === "fixed") {
            discountAmount = foundCoupon.value;
        } else if (foundCoupon.type === "percent") {
            discountAmount = subTotal * foundCoupon.value;
            
            // Áp dụng giới hạn giảm tối đa
            if (foundCoupon.maxDiscount && discountAmount > foundCoupon.maxDiscount) {
                discountAmount = foundCoupon.maxDiscount;
            }
        }
        
        // 3. Đảm bảo số tiền giảm không âm và không vượt quá subTotal
        discountAmount = Math.max(0, Math.min(discountAmount, subTotal));

        // Trả về số tiền giảm đã tính
        return res.json({ 
            amount: Math.round(discountAmount),
            code: foundCoupon.code,
            type: foundCoupon.type
        });

    } catch (error) {
        console.error("Lỗi SERVER khi áp dụng mã giảm giá:", error);
        return res.status(500).json({ message: "Lỗi hệ thống khi kiểm tra mã giảm giá." });
    }
};