import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"

// Helper function để định dạng tiền tệ Việt Nam
const formatPrice = (price) => {
  // Đảm bảo giá trị là hợp lệ trước khi định dạng
  const validPrice = typeof price === 'number' && isFinite(price) ? price : 0;
  return new Intl.NumberFormat('vi-VN').format(validPrice) + 'đ'
}

const ProductCard = ({ product }) => {
  if (!product) return null

  // 1. Lấy giá cuối cùng (được tính bằng Mongoose Virtuals)
  // Nếu finalPrice tồn tại (do Virtuals trả về), sử dụng nó. Ngược lại, dùng giá gốc.
  const finalPrice = product.finalPrice || product.price;
  const hasDiscount = product.discount > 0;

  return (
    <Card className="
            shadow-md hover:shadow-lg hover:scale-[1.02] transition-transform duration-200 
            overflow-hidden                                     
            group relative {/* Thêm relative để định vị badge */}
        ">

      {/* BADGE GIẢM GIÁ */}
      {hasDiscount && (
        <div className="
                    absolute top-0 right-0 z-10 
                    bg-red-600 text-white 
                    px-3 py-1 text-xs font-bold rounded-bl-lg shadow-md
                ">
          -{product.discount}%
        </div>
      )}

      {/* KHU VỰC ẢNH */}
      <Link to={`/product/${product._id || product.id || product.slug}`}>
        <div className="relative overflow-hidden">
          <img
            src={product.images?.[0] || "/placeholder.png"} // Sử dụng mảng images[0] nếu có
            alt={product.name || "Sản phẩm"}
            title={product.name}
            className="
                            w-full h-48 object-cover 
                            group-hover:scale-105 transition-transform duration-300
                            "
          />
        </div>
      </Link>

      {/* KHU VỰC NỘI DUNG (Tên và Giá) */}
      <CardContent className="p-4 pt-3">
        <Link to={`/product/${product._id || product.id || product.slug}`}>
          <h3 className="text-sm font-semibold truncate hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* HIỂN THỊ GIÁ */}
        <div className="mt-1">
          {hasDiscount && (
            <p className="text-xs text-gray-500 line-through">
              {formatPrice(product.price)} {/* Giá gốc bị gạch ngang */}
            </p>
          )}
          <p className="text-red-600 font-bold text-lg">
            {formatPrice(finalPrice)} {/* Giá sau giảm (hoặc giá gốc) */}
          </p>
        </div>

      </CardContent>

      <CardFooter className="pt-0 px-4 pb-4">
        <Button asChild className="w-full">
          <Link to={`/product/${product._id || product.id || product.slug}`}>Xem chi tiết</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

export default ProductCard