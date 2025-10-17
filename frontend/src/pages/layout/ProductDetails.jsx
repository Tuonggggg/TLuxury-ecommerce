import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  ShoppingCart,
  Heart,
  Share2,
  Truck,
  Shield,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Package
} from "lucide-react"
import api from "@/lib/axios"
import { toast } from "sonner"
import RelatedProductCard from "@/components/RelatedProductCard"

const ProductDetailsPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [activeTab, setActiveTab] = useState("description")
  const [relatedProducts, setRelatedProducts] = useState([])
  const [loadingRelated, setLoadingRelated] = useState(false)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await api.get(`/products/${id}`)
        setProduct(data)

        // Fetch related products
        if (data.category?._id) {
          setLoadingRelated(true)
          try {
            const resRelated = await api.get(`/products?category=${data.category._id}&limit=6`)
            const related = resRelated.data.products || resRelated.data || []
            setRelatedProducts(related.filter(p => p._id !== data._id).slice(0, 6))
          } catch (err) {
            console.error("Lỗi khi lấy sản phẩm tương tự:", err)
          } finally {
            setLoadingRelated(false)
          }
        }
      } catch (err) {
        console.error("Lỗi khi lấy sản phẩm:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [id])

  // ------------------------- HÀM THÊM VÀO GIỎ HÀNG (CỐT LÕI) -------------------------
  const handleAddToCart = async (checkoutAfter = false) => {
    if (quantity <= 0) {
      toast.error("Vui lòng chọn số lượng hợp lệ.");
      return;
    }
    if (quantity > product.stock) {
      toast.warning(`Số lượng vượt quá tồn kho. Hiện còn ${product.stock} sản phẩm.`);
      return;
    }

    setIsAddingToCart(true);
    try {
      const payload = {
        productId: product._id,
        qty: quantity,
      };

      await api.post('/cart', payload);

      const successMessage = checkoutAfter ? "Đã chuyển đến trang thanh toán!" : "Đã thêm vào giỏ hàng!";

      toast.success(`${product.name}: ${successMessage}`, {
        action: checkoutAfter ? undefined : {
          label: "Xem giỏ",
          onClick: () => navigate('/cart')
        }
      });

      if (checkoutAfter) {
        navigate('/cart/checkout'); // Chuyển thẳng đến thanh toán
      }

    } catch (error) {
      let errorMessage = "Lỗi kết nối hoặc phiên đăng nhập đã hết hạn.";
      if (error.response?.status === 401) {
        errorMessage = "Vui lòng đăng nhập để thực hiện giao dịch.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      toast.error("Thao tác thất bại.", { description: errorMessage });
      console.error("Transaction error:", error);
    } finally {
      setIsAddingToCart(false);
    }
  }

  // ------------------------- MOCK FUNCTIONS -------------------------
  const handleToggleWishlist = () => {
    toast.info("Tính năng Yêu thích đang được phát triển.");
  }
  const handleShare = () => {
    toast.info("Link sản phẩm đã được sao chép!", { duration: 1500 });
    navigator.clipboard.writeText(window.location.href);
  }
  // ------------------------------------------------------------------

  if (loading) return <div className="text-center py-20 text-gray-500">Đang tải dữ liệu...</div>
  if (!product) return <div className="text-center py-20 text-red-500">Không tìm thấy sản phẩm</div>

  const images = product.images?.length ? product.images : ["/no-image.png"]
  const discountPrice = product.discount > 0 ? Math.round(product.price - (product.price * product.discount) / 100) : product.price
  const isOutOfStock = product.stock === 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span onClick={() => navigate("/")} className="hover:text-gray-900 cursor-pointer transition-colors">
              Trang chủ
            </span>
            <span>/</span>
            <span onClick={() => navigate(`/category/${product.category?.slug}`)} className="hover:text-gray-900 cursor-pointer transition-colors">
              {product.category?.name || "Danh mục"}
            </span>
            <span>/</span>
            <span className="text-gray-900">{product.name}</span>
          </div>
        </div>
      </div>

      {/* Product Details */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-gray-50 rounded-lg overflow-hidden group">
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:shadow"
                  >
                    <ChevronLeft className="h-4 w-4 text-gray-700" />
                  </button>
                  <button
                    onClick={() => setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:shadow"
                  >
                    <ChevronRight className="h-4 w-4 text-gray-700" />
                  </button>
                </>
              )}
              {product.discount > 0 && (
                <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded text-sm font-medium">
                  -{product.discount}%
                </div>
              )}
            </div>

            <div className="grid grid-cols-4 gap-3">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`aspect-square rounded-lg overflow-hidden border transition-all ${selectedImage === idx ? "border-gray-900" : "border-gray-200 hover:border-gray-400"
                    }`}
                >
                  <img src={img} alt={`Ảnh ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="text-sm text-gray-500 mb-2">{product.category?.name || "Danh mục"}</div>
              <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-3">{product.name}</h1>
            </div>

            {/* Price */}
            <div className="py-6 border-y border-gray-200">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-semibold text-red-600">
                  {discountPrice.toLocaleString()}₫
                </span>
                {product.discount > 0 && (
                  <span className="text-xl text-gray-400 line-through">
                    {product.price.toLocaleString()}₫
                  </span>
                )}
              </div>
              {product.discount > 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  Tiết kiệm {(product.price - discountPrice).toLocaleString()}₫
                </p>
              )}
            </div>

            {/* Product Meta */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Thương hiệu:</span>
                <span className="font-medium text-gray-900">{product.brand}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tình trạng:</span>
                <span className={product.status === "còn hàng" ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                  {product.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Còn lại:</span>
                <span className="font-medium text-gray-900">{product.stock} sản phẩm</span>
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">Số lượng</label>
              <div className="flex items-center border border-gray-300 rounded-lg w-fit">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  disabled={quantity <= 1 || isOutOfStock}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  disabled={quantity >= product.stock || isOutOfStock}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <div className="flex gap-3">
                <Button
                  className="flex-1 h-12 bg-gray-900 hover:bg-gray-800 text-white"
                  onClick={() => handleAddToCart(false)}
                  disabled={isOutOfStock || isAddingToCart}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {isAddingToCart ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 border-gray-300 hover:bg-gray-50"
                  onClick={handleToggleWishlist}
                >
                  <Heart className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 border-gray-300 hover:bg-gray-50"
                  onClick={handleShare}
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
              <Button
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => handleAddToCart(true)} // Mua ngay = Thêm vào giỏ hàng + chuyển hướng
                disabled={isOutOfStock || isAddingToCart}
              >
                Mua ngay
              </Button>
            </div>

            {/* Services */}
            <div className="grid grid-cols-1 gap-4 pt-6 border-t border-gray-200">
              <div className="flex items-start gap-3">
                <Truck className="h-5 w-5 text-gray-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-gray-900">Miễn phí vận chuyển</p>
                  <p className="text-xs text-gray-500">Đơn hàng từ 5 triệu đồng</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-gray-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-gray-900">Bảo hành chính hãng</p>
                  <p className="text-xs text-gray-500">Bảo hành 24 tháng từ nhà sản xuất</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <RotateCcw className="h-5 w-5 text-gray-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-gray-900">Đổi trả dễ dàng</p>
                  <p className="text-xs text-gray-500">Đổi trả trong vòng 7 ngày nếu có lỗi</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-gray-200 mb-16">
          <div className="flex gap-8 border-b border-gray-200">
            {["description", "reviews"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 font-medium text-sm transition-colors ${activeTab === tab
                  ? "text-gray-900 border-b-2 border-gray-900"
                  : "text-gray-500 hover:text-gray-900"
                  }`}
              >
                {tab === "description" ? "Mô tả sản phẩm" : "Đánh giá"}
              </button>
            ))}
          </div>

          <div className="py-8">
            {activeTab === "description" && (
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="text-gray-500 text-center py-8">Chưa có đánh giá nào.</div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="py-8 border-t border-gray-200 mt-10"> {/* Thêm padding và đường viền để phân tách */}
            {/* HEADER */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Sản phẩm tương tự</h2>
              <Button
                variant="ghost"
                onClick={() => navigate(`/?category=${product.category?._id}`)}
                className="text-blue-600 hover:text-blue-700 text-base font-medium transition-colors"
              >
                Xem tất cả
                <ChevronRight className="h-5 w-5 ml-1" />
              </Button>
            </div>

            {/* NỘI DUNG DANH SÁCH */}
            {loadingRelated ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="animate-spin h-6 w-6 text-blue-500 mx-auto mb-2" viewBox="0 0 24 24">...</svg>
                Đang tải sản phẩm tương tự...
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 
                    sm:grid-cols-3 md:grid-cols-4 
                    lg:grid-cols-5 xl:grid-cols-6 lg:gap-6">
                {relatedProducts.map((relatedProduct) => (
                  // Gọi component mới thay vì render Card trực tiếp
                  <RelatedProductCard
                    key={relatedProduct._id}
                    product={relatedProduct}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductDetailsPage