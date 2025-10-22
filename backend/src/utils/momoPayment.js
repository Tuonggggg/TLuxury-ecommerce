// utils/momoPayment.js
import axios from "axios";
import crypto from "crypto";

// 🚨 Cấu hình Momo (THAY THẾ BẰNG THÔNG TIN THẬT CỦA BẠN)
const MOMO_ENDPOINT = "https://test-payment.momo.vn/v2/gateway/api/create"; // 🚨 Dùng URL Sandbox cho test
const PARTNER_CODE = "MOMOXFZZ"; // Thay thế
const ACCESS_KEY = "xxxxxxxxxxxxxxxxxxxxxxxx"; // Thay thế
const SECRET_KEY = "yyyyyyyyyyyyyyyyyyyyyyyy"; // Thay thế

const REDIRECT_URL = "http://localhost:3000/order/payment-result"; // URL Frontend sau khi thanh toán
const IPN_URL = "http://YOUR_BACKEND_URL/api/orders/momo-callback"; // URL Backend cho Callback/IPN

// Hàm tạo yêu cầu thanh toán (Bước 1)
export const requestMomoPayment = async ({ orderId, amount, orderInfo }) => {
    const requestId = Date.now().toString(); 
    const amountInt = parseInt(amount); // Đảm bảo là số nguyên

    const rawSignature =
        `accessKey=${ACCESS_KEY}&amount=${amountInt}&extraData=&orderId=${orderId}` +
        `&orderInfo=${orderInfo}&partnerCode=${PARTNER_CODE}&redirectUrl=${REDIRECT_URL}` +
        `&requestId=${requestId}&requestType=captureWallet`;

    // 1. Tạo chữ ký SHA256 (Hash)
    const signature = crypto
        .createHmac("sha256", SECRET_KEY)
        .update(rawSignature)
        .digest("hex");

    // 2. Body Request gửi đến Momo
    const requestBody = {
        partnerCode: PARTNER_CODE,
        accessKey: ACCESS_KEY,
        requestId: requestId,
        amount: amountInt,
        orderId: orderId,
        orderInfo: orderInfo,
        redirectUrl: REDIRECT_URL,
        ipnUrl: IPN_URL,
        requestType: "captureWallet", 
        extraData: "",
        lang: "vi",
        signature: signature,
    };

    // 3. Gọi API Momo
    const { data } = await axios.post(MOMO_ENDPOINT, requestBody, {
        headers: { "Content-Type": "application/json" },
    });

    if (data.resultCode !== 0) {
        throw new Error(`Momo API Error: ${data.message} (Code: ${data.resultCode})`);
    }

    return data; // Chứa payUrl để chuyển hướng
};


// Hàm xác thực chữ ký (Signature) của Momo (Bước 3 - Trong momoCallback)
export const verifyMomoSignature = (data) => {
    const { partnerCode, accessKey, requestId, amount, orderId, orderInfo, orderType, transId, resultCode, message, payType, responseTime, extraData, signature } = data;

    // Chuỗi dữ liệu thô (Tham khảo tài liệu Momo để đảm bảo thứ tự và trường)
    const rawSignature =
        `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}` +
        `&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}` +
        `&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}` +
        `&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

    // Tái tạo chữ ký bằng SECRET_KEY của bạn
    const reCreatedSignature = crypto
        .createHmac("sha256", SECRET_KEY)
        .update(rawSignature)
        .digest("hex");

    // So sánh chữ ký được tạo lại và chữ ký Momo gửi đến
    return reCreatedSignature === signature;
};