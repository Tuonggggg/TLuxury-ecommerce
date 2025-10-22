import * as z from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Tên sản phẩm là bắt buộc"),
  description: z.string().optional().or(z.literal("")),
  category: z.string().min(1, "Danh mục là bắt buộc"),
  brand: z.string().optional().or(z.literal("")),

  // ✅ Giá gốc
  price: z.preprocess(
    (a) => parseFloat(z.string().default("0").parse(a)),
    z.number().min(0, "Giá phải lớn hơn hoặc bằng 0")
  ),

  // ✅ Giảm giá %
  discount: z
    .preprocess(
      (a) => parseFloat(z.string().default("0").parse(a)),
      z.number().min(0, "Giảm giá tối thiểu là 0%").max(100, "Giảm giá tối đa là 100%")
    )
    .optional(),

  // ✅ Tồn kho
  stock: z.preprocess(
    (a) => parseFloat(z.string().default("0").parse(a)),
    z.number().min(0, "Tồn kho phải ≥ 0")
  ),

  status: z.enum(["còn hàng", "hết hàng", "đặt trước"]).optional(),
  images: z.array(z.any()).optional(),

  // ✅ Cấu trúc Flash Sale dạng object
  flashSale: z
    .object({
      isActive: z.preprocess((v) => v === "true" || v === true, z.boolean()).default(false),
      salePrice: z
        .preprocess(
          (a) => parseFloat(z.string().default("0").parse(a)),
          z.number().min(0, "Giá Flash Sale phải ≥ 0")
        )
        .optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
    })
    .optional(),
});
