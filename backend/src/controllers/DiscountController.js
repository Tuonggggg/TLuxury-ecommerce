import Discount from "../models/DiscountModel.js";
import asyncHandler from "express-async-handler";

/**
 * ===============================================
 * 🏷️ APPLY DISCOUNT (USER)
 * Endpoint: POST /api/discounts/apply
 * Chức năng: Kiểm tra mã giảm giá và trả về số tiền giảm.
 * ===============================================
 */
export const applyDiscount = asyncHandler(async (req, res) => {
  const { code, subTotal } = req.body;

  // ✅ Kiểm tra dữ liệu đầu vào
  if (!code || typeof subTotal !== "number" || subTotal <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "Dữ liệu đầu vào không hợp lệ." });
  }

  const foundCoupon = await Discount.findOne({
    code: code.toUpperCase(),
    isActive: true,
  });

  if (!foundCoupon) {
    return res.status(404).json({
      success: false,
      message: "Mã giảm giá không tồn tại hoặc đã bị vô hiệu hóa.",
    });
  }

  // ✅ 1. Kiểm tra thời hạn sử dụng
  if (foundCoupon.expiryDate && foundCoupon.expiryDate < new Date()) {
    foundCoupon.isActive = false;
    await foundCoupon.save();
    return res
      .status(400)
      .json({ success: false, message: "Mã giảm giá đã hết hạn sử dụng." });
  }

  // ✅ 2. Kiểm tra số lần sử dụng
  if (foundCoupon.usedCount >= foundCoupon.usageLimit) {
    foundCoupon.isActive = false;
    await foundCoupon.save();
    return res.status(400).json({
      success: false,
      message: "Mã giảm giá đã đạt giới hạn số lần sử dụng.",
    });
  }

  // ✅ 3. Kiểm tra đơn hàng tối thiểu
  if (subTotal < foundCoupon.minOrder) {
    return res.status(400).json({
      success: false,
      message: `Đơn hàng tối thiểu phải đạt ${foundCoupon.minOrder.toLocaleString()}₫.`,
    });
  }

  // ✅ 4. Tính toán giá trị giảm
  let discountAmount = 0;

  if (foundCoupon.type === "fixed") {
    discountAmount = foundCoupon.value;
  } else if (foundCoupon.type === "percent") {
    discountAmount = subTotal * (foundCoupon.value / 100);

    // Giới hạn mức giảm tối đa
    if (
      foundCoupon.maxDiscount > 0 &&
      discountAmount > foundCoupon.maxDiscount
    ) {
      discountAmount = foundCoupon.maxDiscount;
    }
  }

  // ✅ Đảm bảo không vượt quá subTotal
  discountAmount = Math.max(0, Math.min(discountAmount, subTotal));

  // ✅ 5. TỰ ĐỘNG CẬP NHẬT LƯỢT DÙNG
  foundCoupon.usedCount += 1;
  if (foundCoupon.usedCount >= foundCoupon.usageLimit) {
    foundCoupon.isActive = false; // tự tắt khi đạt giới hạn
  }
  await foundCoupon.save();

  // ✅ 6. Trả về kết quả cho frontend
  return res.json({
    success: true,
    code: foundCoupon.code,
    type: foundCoupon.type,
    discountAmount: Math.round(discountAmount),
    finalTotal: subTotal - Math.round(discountAmount),
    message: `Áp dụng thành công mã ${foundCoupon.code}!`,
  });
});


/**
 * ===============================================
 * 👑 ADMIN: LẤY TẤT CẢ MÃ GIẢM GIÁ
 * Endpoint: GET /api/discounts
 * ===============================================
 */
export const getDiscounts = asyncHandler(async (req, res) => {
  const discounts = await Discount.find({}).sort({ createdAt: -1 });
  res.json(discounts);
});

/**
 * ===============================================
 * 👑 ADMIN: TẠO MÃ GIẢM GIÁ
 * Endpoint: POST /api/discounts
 * ===============================================
 */
export const createDiscount = asyncHandler(async (req, res) => {
  const { code, type, value, minOrder, maxDiscount, expiryDate, usageLimit } =
    req.body;

  // ✅ Validate đầu vào
  if (!code || !type || !value || !expiryDate) {
    res.status(400);
    throw new Error(
      "Thiếu các trường bắt buộc (Code, Type, Value, Expiry Date)."
    );
  }

  if (value <= 0) {
    res.status(400);
    throw new Error("Giá trị giảm phải lớn hơn 0.");
  }

  if (type === "percent" && value > 100) {
    res.status(400);
    throw new Error("Giá trị phần trăm giảm tối đa là 100%.");
  }

  const newDiscount = new Discount({
    code: code.toUpperCase(),
    type,
    value: Number(value),
    minOrder: Number(minOrder) || 0,
    maxDiscount: type === "percent" ? Number(maxDiscount) || 0 : 0,
    expiryDate: new Date(expiryDate),
    usageLimit: Number(usageLimit) || 1000,
  });

  try {
    const savedDiscount = await newDiscount.save();
    res.status(201).json(savedDiscount);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400);
      throw new Error("Mã giảm giá đã tồn tại.");
    }
    res.status(500).json({ message: error.message });
  }
});

/**
 * ===============================================
 * 👑 ADMIN: CẬP NHẬT MÃ GIẢM GIÁ
 * Endpoint: PUT /api/discounts/:id
 * ===============================================
 */
export const updateDiscount = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    code,
    type,
    value,
    minOrder,
    maxDiscount,
    expiryDate,
    isActive,
    usageLimit,
  } = req.body;

  const discount = await Discount.findById(id);

  if (!discount) {
    res.status(404);
    throw new Error("Mã giảm giá không tìm thấy.");
  }

  // ✅ Cập nhật các trường hợp hợp lệ
  if (code) discount.code = code.toUpperCase();
  if (type) discount.type = type;
  if (value !== undefined) discount.value = Number(value);
  if (minOrder !== undefined) discount.minOrder = Number(minOrder);
  if (type === "percent" && maxDiscount !== undefined)
    discount.maxDiscount = Number(maxDiscount);
  if (expiryDate) discount.expiryDate = new Date(expiryDate);
  if (usageLimit !== undefined) discount.usageLimit = Number(usageLimit);
  if (isActive !== undefined) discount.isActive = isActive;

  const updatedDiscount = await discount.save();
  res.json(updatedDiscount);
});

/**
 * ===============================================
 * 👑 ADMIN: XÓA MÃ GIẢM GIÁ
 * Endpoint: DELETE /api/discounts/:id
 * ===============================================
 */
export const deleteDiscount = asyncHandler(async (req, res) => {
  const deleted = await Discount.findByIdAndDelete(req.params.id);

  if (!deleted) {
    res.status(404);
    throw new Error("Không tìm thấy mã giảm giá.");
  }

  res.json({ message: "Mã giảm giá đã được xóa thành công." });
});

/**
 * ===============================================
 * ✅ TUỲ CHỌN: CẬP NHẬT SỐ LẦN SỬ DỤNG (khi đơn hàng thành công)
 * Endpoint: PUT /api/discounts/use/:code
 * ===============================================
 */
export const useDiscount = asyncHandler(async (req, res) => {
  const { code } = req.params;

  const discount = await Discount.findOne({ code: code.toUpperCase() });
  if (!discount) {
    res.status(404);
    throw new Error("Không tìm thấy mã giảm giá.");
  }

  if (discount.usedCount >= discount.usageLimit) {
    discount.isActive = false;
    await discount.save();
    res.status(400);
    throw new Error("Mã giảm giá đã hết lượt sử dụng.");
  }

  discount.usedCount += 1;
  await discount.save();

  res.json({ message: `Đã cập nhật lượt sử dụng cho mã ${discount.code}.` });
});
