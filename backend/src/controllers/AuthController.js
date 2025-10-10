import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";
import crypto from "crypto"; // 🎯 Thêm import này
import sendEmail from "../utils/sendEmail.js"; // 🎯 Thêm import này (Đảm bảo đường dẫn chính xác)

// Access Token sống ngắn (15 phút)
const generateAccessToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
};

// Refresh Token sống dài (7 ngày)
const generateRefreshToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

// --- ĐĂNG KÝ ---
export const registerUser = async (req, res) => {
  // ... (Giữ nguyên logic của bạn)
  try {
    const { username, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email đã tồn tại" });
    }

    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({ message: "Tên đăng nhập đã được sử dụng" });
    }

    const user = new User({ username, email, password, role });
    await user.save();

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id, user.role);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      accessToken,
    });
  } catch (error) {
    console.error("Lỗi đăng ký:", error);
    res.status(500).json({
      message: "Lỗi server trong quá trình đăng ký",
      error: error.message,
    });
  }
};

// --- ĐĂNG NHẬP ---
export const loginUser = async (req, res) => {
  // ... (Giữ nguyên logic của bạn)
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Sai email hoặc mật khẩu" });
    }

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id, user.role);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    user.password = undefined;

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      accessToken,
    });
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    res.status(500).json({
      message: "Lỗi server trong quá trình đăng nhập",
      error: error.message,
    });
  }
};

// --- LÀM MỚI ACCESS TOKEN ---
export const refreshAccessToken = (req, res) => {
  // ... (Giữ nguyên logic của bạn)
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ message: "Không có refresh token" });
    }

    jwt.verify(token, process.env.JWT_REFRESH_SECRET, (err, user) => {
      if (err) {
        res.clearCookie("refreshToken", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
        });
        return res
          .status(403)
          .json({ message: "Refresh token không hợp lệ hoặc đã hết hạn" });
      }

      const newAccessToken = generateAccessToken(user.id, user.role);
      res.json({ accessToken: newAccessToken });
    });
  } catch (error) {
    console.error("Lỗi refresh token:", error);
    res
      .status(500)
      .json({ message: "Lỗi server khi làm mới token", error: error.message });
  }
};

// --- ĐĂNG XUẤT ---
export const logout = (req, res) => {
  // ... (Giữ nguyên logic của bạn)
  try {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    res.json({ message: "Đăng xuất thành công" });
  } catch (error) {
    console.error("Lỗi đăng xuất:", error);
    res
      .status(500)
      .json({ message: "Lỗi server khi đăng xuất", error: error.message });
  }
};

// -----------------------------------------------------------------------
// 🎯 CHỨC NĂNG QUÊN VÀ ĐẶT LẠI MẬT KHẨU ĐÃ HOÀN CHỈNH
// -----------------------------------------------------------------------

// --- QUÊN MẬT KHẨU (Bước 1: Gửi Token) ---
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    // Trả về phản hồi chung chung để tránh tiết lộ email nào tồn tại
    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "Nếu tài khoản tồn tại, link đặt lại mật khẩu đã được gửi đến email.",
      });
    }

    // 1. Tạo token và lưu token đã hash vào DB
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // 2. Tạo URL đặt lại mật khẩu (Sử dụng biến môi trường CLIENT_URL)
    const resetUrl = `${process.env.CLIENT_URL}/account/reset-password/${resetToken}`;

    const message = `
      <h1>Yêu cầu Đặt lại Mật khẩu</h1>
      <p>Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng nhấp vào <a href="${resetUrl}" clicktracking="off">link này</a> để tiếp tục:</p>
      <p>Link có hiệu lực trong 15 phút. Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
    `;

    try {
      // 3. Gửi email
      await sendEmail({
        email: user.email,
        subject: "Đặt lại Mật khẩu Tài khoản của bạn",
        message,
      });

      res.status(200).json({
        success: true,
        message: "Link đặt lại mật khẩu đã được gửi đến email.",
      });
    } catch (error) {
      // Nếu gửi email thất bại, cần xóa token vừa tạo khỏi DB
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      console.error("Lỗi gửi email đặt lại mật khẩu:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi gửi email. Vui lòng thử lại sau.",
      });
    }
  } catch (error) {
    console.error("Lỗi quên mật khẩu:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// --- ĐẶT LẠI MẬT KHẨU (Bước 2: Cập nhật mật khẩu) ---
export const resetPassword = async (req, res) => {
  console.log('🚀 ~ resetPassword ~ req:', req.body)
  const { resetToken } = req.params; // Token không hash từ URL
  const { password } = req.body; // Mật khẩu mới

  // 1. Hash token nhận được từ URL để so sánh với DB
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  try {
    // 2. Tìm người dùng dựa trên token và kiểm tra thời gian hết hạn
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }, // lớn hơn thời gian hiện tại
    }).select("+password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Token không hợp lệ hoặc đã hết hạn",
      });
    }

    // 3. Cập nhật mật khẩu mới (Pre 'save' hook trong Model sẽ tự động hash)
    user.password = password;

    // 4. Xóa token
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    // 5. Lưu người dùng (mật khẩu mới đã được hash và lưu)
    await user.save();

    res.status(200).json({
      success: true,
      message: "Đặt lại mật khẩu thành công. Vui lòng đăng nhập.",
    });
  } catch (error) {
    console.error("Lỗi đặt lại mật khẩu:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi đặt lại mật khẩu",
    });
  }
};
