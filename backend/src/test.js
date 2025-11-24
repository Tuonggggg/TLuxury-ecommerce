import sgMail from "@sendgrid/mail";
import dotenv from 'dotenv';
dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
console.log("FROM_EMAIL:", process.env.FROM_EMAIL);
console.log("FROM_NAME:", process.env.FROM_NAME);
console.log("SENDGRID_API_KEY:", process.env.SENDGRID_API_KEY?.slice(0,4) + "...");

const msg = {
  to: "nguoinhan@example.com",
  from: {
    name: process.env.FROM_NAME,   // TLuxury
    email: process.env.FROM_EMAIL, // tradao0100@gmail.com
  },
  subject: "Test email TLuxury",
  text: "Đây là email test!",
};

sgMail.send(msg)
  .then(() => console.log("✅ Gửi thành công"))
  .catch(err => console.error("❌ Lỗi:", err.response?.body || err));
