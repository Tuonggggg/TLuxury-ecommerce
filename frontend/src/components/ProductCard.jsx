import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ShoppingCart, Zap, Loader2 } from "lucide-react"; // Đã thêm Loader2 icon

// Helper function để định dạng tiền tệ Việt Nam (giữ nguyên)
const formatPrice = (price) => {
  // Đảm bảo không sử dụng Math.round() ở đây để giữ tính chính xác của giá
  const validPrice = typeof price === "number" && isFinite(price) ? price : 0;
  return new Intl.NumberFormat("vi-VN").format(validPrice) + "đ";
};

// Hàm kiểm tra còn trong thời gian Flash Sale không (giữ nguyên)
const isInFlashSale = (flashSale) => {
  if (!flashSale || !flashSale.isActive) return false;
  const now = new Date();
  const start = new Date(flashSale.startTime);
  const end = new Date(flashSale.endTime);
  return now >= start && now <= end;
};

// ✅ ĐÃ THÊM PROP isPending
const ProductCard = ({ product, onAddToCart, isPending }) => {
  if (!product) return null;

  const hasDiscount = product.discount > 0;
  const isFlash = isInFlashSale(product.flashSale);
  const flashSalePrice = isFlash ? product.flashSale.salePrice : null;

  // Ưu tiên thứ tự hiển thị giá
  const finalPrice =
    (isFlash && flashSalePrice) ||
    product.finalPrice ||
    product.price;
    
  const isOutOfStock = product.stock === 0;

  // ✅ Xử lý nút Thêm vào Giỏ (Logic đã tối ưu cho component con)
  const handleAddToCart = (e) => {
    // Ngăn sự kiện nổi bọt (prevent bubbling) để không kích hoạt Link (chuyển trang)
    e.preventDefault(); 
    e.stopPropagation(); 
    
    // Chỉ gọi hàm nếu không phải là hết hàng
    if (onAddToCart && !isOutOfStock) {
      onAddToCart(product);
    }
  };

  return (
    <Card
      className="
        group relative flex flex-col h-full
        bg-white rounded-lg overflow-hidden
        border border-gray-200 
        hover:border-blue-300
        shadow-sm hover:shadow-lg 
        transition-all duration-300 hover:-translate-y-1
      "
    >
      {/* Badge Flash Sale hoặc Giảm giá */}
      {(isFlash || hasDiscount) && (
        <div 
          className={`
            absolute top-2 left-2 z-20 
            px-2 py-1 text-[10px] font-bold rounded-md 
            shadow-md
            ${isFlash 
              ? "bg-red-500 text-white" 
              : "bg-green-500 text-white"
            } 
          `}
        >
          {isFlash ? (
            <span className="flex items-center gap-0.5">
              <Zap className="w-2.5 h-2.5 fill-current" />
              FLASH
            </span>
          ) : (
            <span>-{product.discount}%</span>
          )}
        </div>
      )}

      {/* Khu vực ảnh sản phẩm (chỉ còn hiệu ứng zoom) */}
      <Link 
        to={`/product/${product._id || product.id || product.slug}`} 
        className="block relative overflow-hidden bg-gray-50"
      >
        {/* Container ảnh với tỷ lệ 1:1 (vuông) */}
        <div className="relative w-full pt-[100%]">
          <img
            src={product.images?.[0] || "/placeholder.png"}
            alt={product.name || "Sản phẩm"}
            title={product.name}
            className="
              absolute inset-0 w-full h-full object-cover 
              group-hover:scale-105 
              transition-transform duration-500
            "
            loading="lazy"
          />
        </div>
        {/* Đã loại bỏ Overlay hành động */}
      </Link>

      {/* Nội dung sản phẩm */}
      <CardContent className="p-3 pb-2 flex-grow flex flex-col">
        <Link to={`/product/${product._id || product.id || product.slug}`}>
          <h3 className="
            text-sm font-medium text-gray-800 
            line-clamp-2 h-10
            hover:text-blue-600 transition-colors duration-200
            mb-2
          ">
            {product.name}
          </h3>
        </Link>

        {/* Khu vực giá */}
        <div className="mt-auto">
          <div className="flex items-baseline gap-2">
            <span
              className={`
                font-bold text-base
                ${isFlash || hasDiscount ? "text-red-600" : "text-gray-900"}
              `}
            >
              {formatPrice(finalPrice)}
            </span>
            {(hasDiscount || isFlash) && (
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
        </div>
      </CardContent>

      {/* Footer: Nút Thêm vào giỏ và Xem chi tiết */}
      <CardFooter className="px-3 pb-3 pt-0 flex gap-2">
        {/* Nút Thêm vào giỏ hàng */}
        <Button 
          size="icon" 
          className={`
            w-1/4 h-8 bg-orange-500 hover:bg-orange-600 rounded-md 
            transition-colors duration-200 shrink-0
            ${isOutOfStock ? "opacity-50 cursor-not-allowed bg-gray-400 hover:bg-gray-400" : ""}
          `}
          onClick={handleAddToCart}
          disabled={isOutOfStock || isPending}
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ShoppingCart className="w-4 h-4" />
          )}
        </Button>
        
        {/* Nút Xem chi tiết */}
        <Button 
          asChild 
          className={`
            w-3/4 h-8 text-xs font-medium rounded-md
            ${isOutOfStock 
                ? "bg-gray-700 hover:bg-gray-800" 
                : "bg-blue-500 hover:bg-blue-600"
            }
            transition-colors duration-200
          `}
        >
          <Link to={`/product/${product._id || product.id || product.slug}`}>
            {isOutOfStock ? 'Hết hàng' : 'Xem chi tiết'}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;