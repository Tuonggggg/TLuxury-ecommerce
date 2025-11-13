import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (options) => {
  try {
    const msg = {
      to: options.email,
      from: {
        name: process.env.FROM_NAME,
        email: process.env.FROM_EMAIL,
      },
      subject: options.subject,
      html: options.message,
    };

    console.log("🚀 Gọi hàm sendEmail() với:", options);
    const response = await sgMail.send(msg);
    console.log("✅ Email đã gửi thành công:", response[0].statusCode);
  } catch (error) {
    console.error(
      "❌ Lỗi khi gửi email:",
      error.response?.body || error.message
    );
  }
};

export default sendEmail;
