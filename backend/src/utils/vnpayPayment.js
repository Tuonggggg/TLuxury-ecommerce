// utils/vnpayPayment.js
import crypto from "crypto";
import moment from "moment";

// 🚨 Cấu hình VNPAY (LẤY TỪ BIẾN MÔI TRƯỜNG)
const VNP_TMN_CODE = process.env.VNP_TMN_CODE; // Mã Terminal
const VNP_HASH_SECRET = process.env.VNP_HASH_SECRET; // Secret Key
const VNP_URL = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"; // URL Sandbox (có thể đặt trong env nếu muốn)

// Tự động tạo Return URL từ NGROK_PUBLIC_URL 
// Phải dùng process.env.NGROK_PUBLIC_URL đã được bạn cấu hình trong .env
const VNP_RETURN_URL = `${process.env.NGROK_PUBLIC_URL}/api/orders/vnpay-callback`; 


// Hàm tạo yêu cầu thanh toán VNPAY (Bước 1)
export const createVnPayPayment = ({ orderId, amount, orderInfo, ipAddr }) => {
    const date = new Date();
    const createDate = moment(date).format("YYYYMMDDHHmmss");
    const txnRef = orderId; 

    let vnp_Params = {};
    vnp_Params["vnp_Version"] = "2.1.0";
    vnp_Params["vnp_Command"] = "pay";
    vnp_Params["vnp_TmnCode"] = VNP_TMN_CODE;
    vnp_Params["vnp_Locale"] = "vn";
    vnp_Params["vnp_CurrCode"] = "VND";
    vnp_Params["vnp_TxnRef"] = txnRef;
    vnp_Params["vnp_OrderInfo"] = orderInfo;
    vnp_Params["vnp_OrderType"] = "other";
    vnp_Params["vnp_Amount"] = amount * 100;
    vnp_Params["vnp_ReturnUrl"] = VNP_RETURN_URL;
    vnp_Params["vnp_IpAddr"] = ipAddr;
    vnp_Params["vnp_CreateDate"] = createDate;
    
    // 💡 THÊM THAM SỐ VNPAYQR CHO CHỨC NĂNG THANH TOÁN QR
    // vnp_Params["vnp_BankCode"] = "VNPAYQR";

    // 1. Sắp xếp các tham số và tạo chuỗi Hash
    vnp_Params = sortObject(vnp_Params);
    
    // ... (logic tạo Secure Hash và trả về URL giữ nguyên)
    const signData = new URLSearchParams(vnp_Params).toString();
    console.log('🚀 ~ createVnPayPayment ~ signData:', signData)
    const hmac = crypto.createHmac("sha512", VNP_HASH_SECRET);
    console.log('🚀 ~ createVnPayPayment ~ hmac:', hmac)
    const signed = hmac.update(signData).digest("hex");
    console.log('🚀 ~ createVnPayPayment ~ signed:', signed)
    
    // 2. Thêm chữ ký vào tham số
    vnp_Params["vnp_SecureHash"] = signed;
    console.log('🚀 ~ createVnPayPayment ~ vnp_Params:', vnp_Params)

    // 3. Tạo URL chuyển hướng
    return VNP_URL + "?" + new URLSearchParams(vnp_Params).toString();
};


// Hàm xác thực chữ ký (Secure Hash) của VNPAY (verifyVnPayReturn)
// HÀM NÀY GIỮ NGUYÊN VÌ ĐÃ SỬ DỤNG VNP_HASH_SECRET TỪ BIẾN MÔI TRƯỜNG Ở PHẠM VI TRÊN

export const verifyVnPayReturn = (vnp_Params) => {
    const secureHash = vnp_Params['vnp_SecureHash'];

    // 1. Xóa trường SecureHash để tạo lại chuỗi hash
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_HashType']; 

    // 2. Sắp xếp và tạo chuỗi hash
    const sortedParams = sortObject(vnp_Params);
    const signData = new URLSearchParams(sortedParams).toString();
    
    // 3. Tái tạo chữ ký bằng SECRET KEY
    const hmac = crypto.createHmac("sha512", VNP_HASH_SECRET); // Sử dụng biến môi trường đã khai báo ở trên
    const signed = hmac.update(signData).digest("hex");

    const orderId = vnp_Params['vnp_TxnRef'];
    const responseCode = vnp_Params['vnp_ResponseCode'];
    
    // 4. So sánh chữ ký
    const isValid = secureHash === signed;

    return {
        isValid,
        orderId,
        responseCode,
        message: responseCode === "00" ? "Giao dịch thành công" : "Giao dịch thất bại",
    };
};


// Helper function: Hàm sắp xếp đối tượng theo key (Giữ nguyên)
function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = obj[decodeURIComponent(str[key])];
    }
    return sorted;
}