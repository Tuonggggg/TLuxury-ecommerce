import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to: options.email,
      subject: options.subject,
      html: options.message,
    };
    console.log("🚀 Gọi hàm sendEmail() với:", options);
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email đã gửi thành công:", info.response);
  } catch (error) {
    console.error("❌ Lỗi khi gửi email:", error);
  }
};

export default sendEmail;
