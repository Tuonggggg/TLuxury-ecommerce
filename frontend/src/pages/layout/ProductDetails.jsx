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

const ProductDetailsPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
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
            const { data: related } = await api.get(`/products?category=${data.category._id}&limit=6`)
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

  if (loading) return <div className="text-center py-20 text-gray-500">Đang tải dữ liệu...</div>
  if (!product) return <div className="text-center py-20 text-red-500">Không tìm thấy sản phẩm</div>

  const images = product.images?.length ? product.images : ["/no-image.png"]
  const discountPrice = product.discount > 0 ? product.price - (product.price * product.discount) / 100 : product.price

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
            <span className="hover:text-gray-900 cursor-pointer transition-colors">
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
                  className={`aspect-square rounded-lg overflow-hidden border transition-all ${
                    selectedImage === idx ? "border-gray-900" : "border-gray-200 hover:border-gray-400"
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
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>

            {/* Price */}
            <div className="py-6 border-y border-gray-200">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-semibold text-gray-900">
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
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <div className="flex gap-3">
                <Button className="flex-1 h-12 bg-gray-900 hover:bg-gray-800 text-white">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Thêm vào giỏ hàng
                </Button>
                <Button variant="outline" size="icon" className="h-12 w-12 border-gray-300 hover:bg-gray-50">
                  <Heart className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="icon" className="h-12 w-12 border-gray-300 hover:bg-gray-50">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
              <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white">
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
                className={`py-4 font-medium text-sm transition-colors ${
                  activeTab === tab
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
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-semibold text-gray-900">Sản phẩm tương tự</h2>
              <Button 
                variant="ghost" 
                onClick={() => navigate(`/?category=${product.category._id}`)}
                className="text-sm"
              >
                Xem tất cả
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {loadingRelated ? (
              <div className="text-center py-12 text-gray-500">Đang tải...</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {relatedProducts.map((relatedProduct) => {
                  const relatedDiscountPrice = relatedProduct.discount > 0 
                    ? relatedProduct.price - (relatedProduct.price * relatedProduct.discount) / 100 
                    : relatedProduct.price
                  const relatedImage = relatedProduct.images?.[0] || "/no-image.png"

                  return (
                    <Card 
                      key={relatedProduct._id} 
                      className="group cursor-pointer hover:shadow-md transition-shadow border border-gray-200"
                      onClick={() => {
                        navigate(`/products/${relatedProduct._id}`)
                        window.scrollTo(0, 0)
                      }}
                    >
                      <CardContent className="p-0">
                        <div className="relative aspect-square overflow-hidden bg-gray-50">
                          <img
                            src={relatedImage}
                            alt={relatedProduct.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {relatedProduct.discount > 0 && (
                            <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-medium">
                              -{relatedProduct.discount}%
                            </div>
                          )}
                        </div>
                        
                        <div className="p-3 space-y-2">
                          <h3 className="font-medium text-sm text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                            {relatedProduct.name}
                          </h3>
                          
                          <div className="space-y-1">
                            <div className="flex items-baseline gap-2">
                              <span className="text-lg font-semibold text-gray-900">
                                {relatedDiscountPrice.toLocaleString()}₫
                              </span>
                            </div>
                            {relatedProduct.discount > 0 && (
                              <span className="text-xs text-gray-400 line-through">
                                {relatedProduct.price.toLocaleString()}₫
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductDetailsPage