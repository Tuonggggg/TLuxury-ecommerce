import * as z from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Tên sản phẩm là bắt buộc"),
  description: z.string().optional().or(z.literal("")),
  category: z.string().min(1, "Danh mục là bắt buộc"),
  brand: z.string().optional().or(z.literal("")),

  // ✅ TRƯỜNG GIÁ GỐC (PRICE)
  price: z.preprocess(
    (a) => parseFloat(z.string().default("0").parse(a)),
    z.number().min(0, "Giá phải lớn hơn hoặc bằng 0")
  ),

  // ✅ TRƯỜNG GIẢM GIÁ (DISCOUNT) - ĐÃ THÊM
  discount: z
    .preprocess(
      // 1. Chuyển đổi từ string sang float (giá trị mặc định là "0")
      (a) => parseFloat(z.string().default("0").parse(a)),
      z
        .number()
        .min(0, "Giảm giá tối thiểu là 0%")
        .max(100, "Giảm giá tối đa là 100%")
      // Tùy chọn: Đảm bảo giá trị là số nguyên nếu bạn chỉ dùng phần trăm nguyên
      // .int("Giảm giá phải là số nguyên")
    )
    .optional(), // Discount có thể không được gửi lên (mặc định là 0 trong Mongoose)

  // ✅ TRƯỜNG TỒN KHO (STOCK)
  stock: z.preprocess(
    (a) => parseFloat(z.string().default("0").parse(a)),
    z.number().min(0, "Tồn kho phải lớn hơn hoặc bằng 0")
  ),

  status: z.enum(["còn hàng", "hết hàng", "đặt trước"]).optional(),
  images: z.array(z.any()).optional(),
});
