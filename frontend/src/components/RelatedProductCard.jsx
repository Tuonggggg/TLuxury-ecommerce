// Cần import các component và hook cần thiết vào file này
import { Card, CardContent } from "@/components/ui/card"
import { useNavigate } from "react-router-dom"

// Helper function để định dạng tiền tệ Việt Nam (vi-VN)
// Tốt nhất là nên đặt function này ở một file tiện ích (utils) riêng
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount).replace('₫', '') + '₫'
}

const RelatedProductCard = ({ product }) => {
  const navigate = useNavigate()

  // 1. Logic xử lý giá và ảnh được đặt tại đây (trước khi render)
  const discountPrice = product.discount > 0
    ? Math.round(product.price * (1 - product.discount / 100))
    : product.price
    
  const productImage = product.images?.[0] || "/no-image.png"

  const handleCardClick = () => {
    navigate(`/product/${product._id}`)
    // Quay về đầu trang sau khi chuyển hướng
    window.scrollTo(0, 0) 
  }

  return (
    <Card
      key={product._id}
      className="
        group cursor-pointer rounded-lg overflow-hidden
        transition-all duration-300 ease-in-out
        hover:shadow-xl hover:scale-[1.02] border border-gray-200
      "
      onClick={handleCardClick}
    >
      <CardContent className="p-0">
        {/* KHU VỰC ẢNH */}
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          <img
            src={productImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          {product.discount > 0 && (
            <div className="
              absolute top-2 right-2 bg-red-600 text-white 
              px-2 py-0.5 rounded-full text-xs font-bold shadow-md
            ">
              -{product.discount}%
            </div>
          )}
        </div>

        {/* KHU VỰC THÔNG TIN SẢN PHẨM */}
        <div className="p-3">
          <h3 className="
            font-medium text-sm text-gray-900 line-clamp-2 mb-1
            group-hover:text-blue-600 transition-colors
          ">
            {product.name}
          </h3>

          {/* HIỂN THỊ GIÁ */}
          <div className="flex flex-col">
            <span className="text-base font-bold text-red-600">
              {formatCurrency(discountPrice)}
            </span>
            {product.discount > 0 && (
              <span className="text-xs text-gray-400 line-through">
                {formatCurrency(product.price)}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default RelatedProductCard