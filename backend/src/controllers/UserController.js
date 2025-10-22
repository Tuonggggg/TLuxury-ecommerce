import User from "../models/UserModel.js";

// @desc    Lấy thông tin user hiện tại
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "Không tìm thấy user" });
    }
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy profile",
      error: error.message,
    });
  }
};

// @desc    Cập nhật thông tin user
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.address = req.body.address || user.address;
      user.phone = req.body.phone || user.phone; // ✅ thêm dòng này để cập nhật số điện thoại

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        address: updatedUser.address,
        phone: updatedUser.phone, // ✅ thêm dòng này để trả về số điện thoại
      });
    } else {
      res.status(404).json({ message: "Không tìm thấy user" });
    }
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi cập nhật profile",
      error: error.message,
    });
  }
};

// @desc    Lấy tất cả user (Admin)
// @route   GET /api/users
// @access  Private/Admin
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

// @desc    Xóa user (Admin)
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      if (user.role === "admin") {
        return res
          .status(400)
          .json({ message: "Không thể xóa tài khoản admin" });
      }

      await user.deleteOne();
      res.json({ message: "User đã được xóa thành công" });
    } else {
      res.status(404).json({ message: "User không tồn tại" });
    }
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi xóa user",
      error: error.message,
    });
  }
};
