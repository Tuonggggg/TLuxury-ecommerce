import mongoose from 'mongoose';

const discountSchema = new mongoose.Schema({
    code: { 
        type: String, 
        required: true, 
        unique: true, 
        uppercase: true 
    },
    description: { 
        type: String 
    },
    type: { // Loại giảm giá: 'fixed' (số tiền cố định) hoặc 'percent' (phần trăm)
        type: String,
        enum: ['fixed', 'percent'],
        required: true,
    },
    value: { // Giá trị giảm (số tiền hoặc tỷ lệ phần trăm)
        type: Number,
        required: true,
    },
    minOrder: { // Giá trị đơn hàng tối thiểu để áp dụng
        type: Number,
        default: 0,
    },
    maxDiscount: { // Số tiền giảm tối đa (chỉ áp dụng cho 'percent')
        type: Number,
        default: 0,
    },
    expiryDate: { 
        type: Date, 
        required: true 
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    // Bạn có thể thêm trường 'usageLimit' ở đây
}, { 
    timestamps: true 
});

const Discount = mongoose.model('Discount', discountSchema);
export default Discount;