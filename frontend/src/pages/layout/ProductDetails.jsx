// src/pages/ProductDetailsPage.jsx (ĐÃ HOÀN THIỆN)

import React, { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
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
} from "lucide-react"
import api from "@/lib/axios"
import { toast } from "sonner"
import RelatedProductCard from "@/components/RelatedProductCard"

// [GUEST] Import Redux
import { useDispatch, useSelector } from "react-redux"
import { addToGuestCart } from "@/store/slices/cartSlice" // <-- Đảm bảo đường dẫn đúng

const ProductDetailsPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [loadingRelated, setLoadingRelated] = useState(false)

  // [GUEST] Lấy state từ Redux
  const dispatch = useDispatch()
  const { userInfo } = useSelector((state) => state.auth)

  useEffect(() => {
    // [GUEST] Reset số lượng và scroll lên đầu khi đổi ID
    setQuantity(1)
    window.scrollTo(0, 0)

    const fetchProduct = async () => {
      setLoading(true) // Bật loading mỗi khi ID thay đổi
      try {
        const { data } = await api.get(`/products/${id}`)
        setProduct(data)
        setSelectedImage(0) // Reset ảnh đã chọn

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
        toast.error("Không tìm thấy sản phẩm", { description: "Có thể sản phẩm đã bị xóa hoặc liên kết không đúng." })
        navigate("/") // [GUEST] Điều hướng về trang chủ nếu lỗi 404
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [id, navigate]) // [GUEST] Thêm 'navigate'

  // ------------------------- HÀM THÊM VÀO GIỎ HÀNG (ĐÃ SỬA) -------------------------
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
      // [GUEST] Phân luồng
      if (userInfo) {
        // ----- LOGIC CHO USER (CŨ) -----
        const payload = {
          productId: product._id,
          qty: quantity,
        };
        await api.post('/cart', payload);
      } else {
        // ----- LOGIC CHO KHÁCH (MỚI) -----
        // Gọi action mới, slice sẽ tự kiểm tra tồn kho
        dispatch(addToGuestCart({ product: product, qty: quantity }));
      }

      // Logic thành công (chung cho cả 2)
      

      if (checkoutAfter) {
        // [GUEST] Dù là khách hay user, đều chuyển đến trang checkout
        navigate('/cart/checkout');
      }

    } catch (error) {
      // Lỗi này chủ yếu xảy ra với USER (API)
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

  // ------------------------- MOCK FUNCTIONS (Không đổi) -------------------------
  const handleToggleWishlist = () => {
    toast.info("Tính năng Yêu thích đang được phát triển.");
  }
  const handleShare = () => {
    toast.info("Link sản phẩm đã được sao chép!", { duration: 1500 });
    navigator.clipboard.writeText(window.location.href);
  }
  // ------------------------------------------------------------------

  if (loading) {
    // (Skeleton JSX - Không đổi)
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <Skeleton className="aspect-square rounded-lg" />
            <div className="grid grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-12 w-1/2" />
            <Skeleton className="h-4 w-1/4" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
            <Skeleton className="h-10 w-32" />
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) return <div className="text-center py-20 text-red-500">Không tìm thấy sản phẩm</div>

  // (Các biến và JSX còn lại không đổi)
  const images = product.images?.length ? product.images : ["/no-image.png"]
  const discountPrice = product.discount > 0 ? Math.round(product.price - (product.price * product.discount) / 100) : product.price
  const isOutOfStock = product.stock === 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <button onClick={() => navigate("/")} className="hover:text-gray-900 transition-colors">
              Trang chủ
            </button>
            <span>/</span>
            <button onClick={() => navigate(`/category/${product.category?.slug}`)} className="hover:text-gray-900 transition-colors">
              {product.category?.name || "Danh mục"}
            </button>
            <span>/</span>
            <span className="text-gray-900 font-medium truncate">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Product Details */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 bg-white rounded-lg shadow-sm mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden shadow-sm group">
              <img
                src={images[selectedImage]}
                alt={`${product.name} - Ảnh ${selectedImage + 1}`}
                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
              />
              {product.discount > 0 && (
                <Badge variant="destructive" className="absolute top-4 right-4 text-sm px-3 py-1">
                  -{product.discount}%
                </Badge>
              )}
              {images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-700" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight className="h-5 w-5 text-gray-700" />
                  </Button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`aspect-square rounded-md overflow-hidden border transition-all duration-200 ${selectedImage === idx ? "border-primary shadow-md" : "border-gray-200 hover:border-gray-400 hover:shadow"
                      }`}
                  >
                    <img src={img} alt={`Ảnh thu nhỏ ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <Badge variant="secondary" className="mb-2 text-sm">
                {product.category?.name || "Danh mục"}
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">{product.name}</h1>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl md:text-4xl font-bold text-primary">
                {discountPrice.toLocaleString()}₫
              </span>
              {product.discount > 0 && (
                <>
                  <span className="text-xl text-gray-500 line-through">
                    {product.price.toLocaleString()}₫
                  </span>
                  <span className="text-sm text-green-500">
                    (Tiết kiệm {(product.price - discountPrice).toLocaleString()}₫)
                  </span>
                </>
              )}
            </div>

            {/* Product Meta */}
            <Card className="bg-gray-50">
              <CardContent className="p-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Thương hiệu:</span>
                  <span className="font-medium text-gray-900">{product.brand}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Kho:</span>
                  <span className="font-medium text-gray-900">{product.stock}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Tình trạng:</span>
                  <Badge variant={product.stock > 0 ? "success" : "destructive"}>
                    {product.stock > 0 ? "Còn hàng" : "Hết hàng"}
                  </Badge>
                </div>

              </CardContent>
            </Card>

            {/* Quantity */}
            {!isOutOfStock && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Số lượng</label>
                <div className="flex items-center border border-gray-300 rounded-md w-fit overflow-hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-10 w-10 hover:bg-gray-100"
                    disabled={quantity <= 1 || isAddingToCart}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-medium text-gray-900">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="h-10 w-10 hover:bg-gray-100"
                    disabled={quantity >= product.stock || isAddingToCart}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <Button
                  className="flex-1 h-12 bg-primary hover:bg-primary/90 text-white"
                  onClick={() => handleAddToCart(false)}
                  disabled={isOutOfStock || isAddingToCart}
                >
                  {isOutOfStock ? "Đã hết hàng" : (
                    isAddingToCart ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShoppingCart className="h-5 w-5 mr-2" />
                  )}
                  {isAddingToCart ? "Đang xử lý..." : (isOutOfStock ? "" : "Thêm vào giỏ")}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12"
                  onClick={handleToggleWishlist}
                  disabled={isAddingToCart}
                >
                  <Heart className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12"
                  onClick={handleShare}
                  disabled={isAddingToCart}
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
              <Button
                className="w-full h-12 bg-primary hover:bg-primary-light text-white"
                onClick={() => handleAddToCart(true)}
                disabled={isOutOfStock || isAddingToCart}
              >
                {isOutOfStock ? "Hết hàng" : "Mua ngay"}
              </Button>
            </div>

            {/* Services */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
              <div className="flex flex-col items-center text-center">
                <Truck className="h-6 w-6 text-primary mb-2" />
                <p className="text-sm font-medium text-gray-900">Miễn phí vận chuyển</p>
                <p className="text-xs text-gray-500">Đơn từ 5 triệu</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <Shield className="h-6 w-6 text-primary mb-2" />
                <p className="text-sm font-medium text-gray-900">Bảo hành chính hãng</p>
                <p className="text-xs text-gray-500">24 tháng</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <RotateCcw className="h-6 w-6 text-primary mb-2" />
                <p className="text-sm font-medium text-gray-900">Đổi trả dễ dàng</p>
                <p className="text-xs text-gray-500">Trong 7 ngày</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 bg-white rounded-lg shadow-sm mt-4">
        <Tabs defaultValue="description" className="w-full">
          <TabsList className="border-b">
            <TabsTrigger value="description">Mô tả sản phẩm</TabsTrigger>
            <TabsTrigger value="reviews">Đánh giá</TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="py-6">
            <div
              className="prose prose-headings:font-semibold prose-a:text-primary max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: product.description || "Chưa có mô tả." }}
            >
            </div>
          </TabsContent>
          <TabsContent value="reviews" className="py-6">
            <div className="text-center text-gray-500">Chưa có đánh giá nào cho sản phẩm này.</div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 bg-white rounded-lg shadow-sm mt-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Sản phẩm tương tự</h2>
            <Button
              variant="link"
              onClick={() => navigate(`/category/${product.category?.slug}`)} // Sửa
              className="text-primary p-0"
            >
              Xem tất cả <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {loadingRelated ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
              {relatedProducts.map((relatedProduct) => (
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
  )
}

export default ProductDetailsPage