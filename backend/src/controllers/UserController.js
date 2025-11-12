import User from "../models/UserModel.js";
// import {cloudinary}  from "../config/cloudinary.js"; // Không cần dùng nữa, có thể xóa import này
// Giả định cloudinary được dùng ở nơi khác, nên ta sẽ giữ lại import nhưng loại bỏ logic.

// ====================== 🧠 LẤY THÔNG TIN USER ======================
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy user" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy profile",
      error: error.message,
    });
  }
};

// ====================== 🛠️ CẬP NHẬT THÔNG TIN USER ======================
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy user" });
    } // 🧾 Cập nhật thông tin cơ bản

    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;
    user.address = req.body.address || user.address; // 🔐 Nếu có đổi mật khẩu

    if (req.body.password) {
      user.password = req.body.password;
    } // 🖼️ LOẠI BỎ LOGIC AVATAR UPLOAD (req.file) // if (req.file) { ... } // 📍 Nếu có toạ độ từ Google Maps

    if (req.body.lat && req.body.lng) {
      user.location = {
        type: "Point",
        coordinates: [parseFloat(req.body.lng), parseFloat(req.body.lat)],
      };
    }

    const updatedUser = await user.save();

    res.json({
      message: "Cập nhật profile thành công",
      user: {
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
        address: updatedUser.address, // ❌ LOẠI BỎ AVATAR TRONG PHẢN HỒI
        location: updatedUser.location,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi cập nhật profile",
      error: error.message,
    });
  }
};

// ====================== 👑 LẤY DANH SÁCH USER (ADMIN) ======================
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy danh sách user",
      error: error.message,
    });
  }
};

// ====================== 🗑️ XOÁ USER (ADMIN) ======================
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User không tồn tại" });

    if (user.role === "admin") {
      return res.status(400).json({ message: "Không thể xóa tài khoản admin" });
    } // ❌ LOẠI BỎ LOGIC XOÁ ẢNH CŨ TRÊN CLOUDINARY // if (user.avatar?.public_id) { //   await cloudinary.uploader.destroy(user.avatar.public_id); // }

    await user.deleteOne();
    res.json({ message: "User đã được xóa thành công" });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi xóa user",
      error: error.message,
    });
  }
};
