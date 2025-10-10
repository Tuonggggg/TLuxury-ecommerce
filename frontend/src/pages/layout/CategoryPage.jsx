import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star, Eye, Heart, Grid3x3, List, ShoppingCart, Minus, Plus, X, Box } from "lucide-react" 
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog" 
import { Input } from "@/components/ui/input" 
import api from "@/lib/axios"
import { toast } from "sonner" 

// =========================================================
// HÀM TIỆN ÍCH
// =========================================================

// Format tiền tệ
const formatPrice = (price) => {
    if (price === null || price === undefined) return "N/A"
    return price.toLocaleString('vi-VN') + '₫'
}

// =========================================================
// COMPONENT QUICK VIEW DIALOG
// =========================================================

const ProductQuickViewDialog = ({ product, isOpen, onClose, quantity, setQuantity, handleViewDetails, navigate }) => { // ✅ Đã thêm 'navigate' vào props
    if (!product) return null;

    const maxStock = product.stock || 100 

    // Hàm Thêm vào giỏ hàng (ĐÃ THÊM LỆNH GỌI API)
    const handleAddToCart = async () => { 
        if (product.stock === 0) {
            toast.error(`Sản phẩm "${product.name}" đã hết hàng.`, {
                description: "Vui lòng chọn sản phẩm khác hoặc đợi hàng về."
            })
            return
        }
        
        try {
            // 🚨 GỌI API ĐỂ THÊM VÀO GIỎ HÀNG (Sử dụng productId và qty theo Backend)
            const payload = {
                productId: product._id, 
                qty: quantity,
            };

            await api.post('/cart', payload);

            // Hiển thị thông báo thành công
            toast.success(`Đã thêm vào giỏ hàng!`, {
                description: `${quantity} x ${product.name} đã được thêm thành công.`,
                action: {
                    label: "Xem giỏ hàng",
                    onClick: () => {
                        onClose();
                        navigate('/cart'); // Sử dụng navigate từ props
                    }, 
                },
            });
            
            onClose(); 

        } catch (error) {
            console.error("Lỗi khi thêm vào giỏ hàng:", error);
            const errorMessage = error.response?.data?.message || "Lỗi kết nối hoặc phiên đăng nhập đã hết hạn.";
            
            toast.error("Thêm vào giỏ hàng thất bại.", {
                description: errorMessage,
            });
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-3xl p-0 overflow-hidden rounded-lg">
                <div className="grid md:grid-cols-2 gap-0">
                    {/* Image Section - chỉ 1 ảnh */}
                    <div className="relative h-full min-h-[350px] md:min-h-[550px] bg-gray-100 flex items-center justify-center overflow-hidden">
                        <img
                            src={product.images && product.images.length > 0 ? product.images[0] : "/placeholder.png"}
                            alt={product.name}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Details Section */}
                    <div className="p-6 md:p-8 space-y-5">
                        <DialogHeader className="space-y-1 border-b pb-4">
                            <DialogTitle className="text-2xl font-bold">{product.name}</DialogTitle>
                            <div className="flex items-center gap-1 text-sm pt-1">
                                <p className="text-gray-500">Thương hiệu: {product.brand}</p>
                            </div>
                        </DialogHeader>

                        {/* Price & Status */}
                        <div className="flex items-center gap-4 py-2">
                            <span className="text-3xl font-extrabold text-red-600">
                                {formatPrice(product.price)}
                            </span>
                             {product.discount > 0 && (
                                <span className="text-lg text-gray-400 line-through">
                                    {formatPrice(product.price / (1 - product.discount / 100))}
                                </span>
                            )}
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <p className="text-gray-600">Tình trạng: </p>
                            <span className={`font-medium px-3 py-1 rounded-full ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {product.stock > 0 ? `Còn hàng (${product.stock})` : "Hết hàng"} 
                            </span>
                        </div>

                        {/* Description */}
                        <div>
                            <p className="text-gray-700 text-sm italic mb-2">Mô tả: {product.description}</p>
                        </div>
                        
                        {/* Quantity Selector */}
                        <div className="flex items-center gap-3 pt-4 border-t">
                            <span className="text-base font-medium text-gray-700">Chọn Số lượng:</span>
                            <div className="flex items-center border rounded-md">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                    disabled={quantity <= 1 || maxStock === 0}
                                    className="h-9 w-9"
                                >
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <Input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => {
                                        let val = parseInt(e.target.value)
                                        if (isNaN(val) || val < 1) val = 1
                                        if (val > maxStock) val = maxStock
                                        setQuantity(val)
                                    }}
                                    min={1}
                                    max={maxStock}
                                    className="w-16 text-center border-y-0 focus-visible:ring-0 shadow-none"
                                    disabled={maxStock === 0}
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setQuantity(q => Math.min(maxStock, q + 1))}
                                    disabled={quantity >= maxStock || maxStock === 0}
                                    className="h-9 w-9"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Add to Cart Button */}
                        <div className="pt-4">
                            <Button
                                className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                onClick={handleAddToCart}
                                disabled={product.stock === 0 || quantity > maxStock || quantity < 1}
                            >
                                <ShoppingCart className="h-5 w-5 mr-2" /> Thêm vào Giỏ hàng
                            </Button>
                        </div>
                         <div className="text-center pt-2">
                             <Button variant="link" onClick={() => {onClose(); handleViewDetails(product._id);}}>
                                 Xem trang chi tiết đầy đủ &rarr;
                             </Button>
                         </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// =========================================================
// COMPONENT CHÍNH CategoryPage
// =========================================================

const CategoryPage = () => {
    const { name } = useParams()
    const navigate = useNavigate()

    const [category, setCategory] = useState(null)
    const [products, setProducts] = useState([])
    const [filter, setFilter] = useState({ price: "asc", brand: "all" })
    const [viewMode, setViewMode] = useState("grid")
    const [hoveredProduct, setHoveredProduct] = useState(null)
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(true)
    const itemsPerPage = 8
    const [totalPages, setTotalPages] = useState(1)
    
    // Thêm state cho Quick View Dialog
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false)
    const [quickViewProduct, setQuickViewProduct] = useState(null)
    const [quantity, setQuantity] = useState(1) // State cho số lượng trong dialog

    // Lấy thông tin category theo slug (Không đổi)
    useEffect(() => {
        if (!name) return
        const fetchCategory = async () => {
            try {
                // Endpoint đã sửa lỗi 404
                const res = await api.get(`/categories/slug/${name}`)
                setCategory(res.data)
            } catch (err) {
                console.error("Lỗi khi lấy category:", err)
            }
        }
        fetchCategory()
    }, [name])

    // Lấy sản phẩm theo category ID + filter + page (ĐÃ SỬA ĐỔI)
    useEffect(() => {
        // KIỂM TRA: Đảm bảo category đã có và có _id
        if (!category || !category._id) return

        const fetchProducts = async () => {
            try {
                setLoading(true)
                
                // Thiết lập các tham số truy vấn (query parameters)
                const params = {
                    sortBy: "price",
                    order: filter.price,
                    brand: filter.brand !== "all" ? filter.brand : undefined,
                    page,
                    limit: itemsPerPage
                }
                
                // GỌI API BẰDNG CATEGORY ID và truyền params
                const res = await api.get(`/categories/${category._id}/products`, { params })
                
                // Cập nhật state với dữ liệu phân trang
                setProducts(res.data.products || [])
                setTotalPages(res.data.totalPages || 1)

            } catch (err) {
                console.error("Lỗi khi lấy sản phẩm:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchProducts()
    }, [category, filter, page]) // Phụ thuộc vào category (object), filter, và page

    const handleViewDetails = (id) => {
        navigate(`/product/${id}`)
    }
    
    // Hàm mở Quick View Dialog
    const handleQuickView = (product) => {
        setQuickViewProduct(product)
        setQuantity(1) // Reset số lượng về 1
        setIsQuickViewOpen(true)
    }

    if (!category) {
        return <p className="text-center py-12">Đang tải danh mục...</p>
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Breadcrumb */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 md:py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="hover:text-blue-600 cursor-pointer" onClick={() => navigate("/")}>
                            Trang chủ
                        </span>
                        <span>/</span>
                        <span
                            className="hover:text-blue-600 cursor-pointer capitalize"
                            onClick={() => navigate(`/category/${category.slug}`)}
                        >
                            {category.name}
                        </span>
                    </div>
                </div>
            </div>

            {/* Hero Banner */}
            <div className="w-full px-4 md:px-8 py-4 md:py-8">
                <div className="max-w-7xl mx-auto relative overflow-hidden rounded-2xl md:rounded-3xl h-[250px] md:h-[400px] shadow-2xl">
                    <img src={`/phongkhach.jpg`} alt={category.name} className="w-full h-full object-cover" />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-8">
                {/* Filter Bar */}
                <div className="bg-white rounded-xl shadow-md p-4 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3 flex-1">
                        <span className="text-gray-600 font-medium">Lọc theo:</span>

                        {/* Sắp xếp theo giá */}
                        <Select onValueChange={(val) => {
                            setFilter({ ...filter, price: val })
                            setPage(1) // Reset trang khi thay đổi filter
                        }}>
                            <SelectTrigger className="w-[180px] border-gray-300">
                                <SelectValue placeholder="Sắp xếp theo giá" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="asc">Giá: Thấp đến cao</SelectItem>
                                <SelectItem value="desc">Giá: Cao đến thấp</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Lọc theo thương hiệu */}
                        <Select onValueChange={(val) => {
                            setFilter({ ...filter, brand: val })
                            setPage(1) // Reset trang khi thay đổi filter
                        }}>
                            <SelectTrigger className="w-[180px] border-gray-300">
                                <SelectValue placeholder="Thương hiệu" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả thương hiệu</SelectItem>
                                <SelectItem value="japan">Nhật Bản</SelectItem>
                                <SelectItem value="europe">Châu Âu</SelectItem>
                                <SelectItem value="korea">Hàn Quốc</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Toggle View */}
                    <div className="flex gap-2 justify-end border-t md:border-t-0 pt-4 md:pt-0 md:pl-4">
                        <Button
                            variant={viewMode === "grid" ? "default" : "outline"}
                            size="icon"
                            onClick={() => setViewMode("grid")}
                        >
                            <Grid3x3 className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === "list" ? "default" : "outline"}
                            size="icon"
                            onClick={() => setViewMode("list")}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Loading state */}
                {loading ? (
                    <p className="text-center text-gray-500 py-12">Đang tải sản phẩm...</p>
                ) : products.length === 0 ? (
                    <p className="text-center text-gray-500 py-12">Không tìm thấy sản phẩm nào trong danh mục này.</p>
                ) : (
                    <>
                        {/* Results Count */}
                        <div className="mb-4">
                            <p className="text-sm text-gray-600">
                                Hiển thị <span className="font-semibold text-gray-900">{products.length}</span> sản phẩm
                            </p>
                        </div>

                        {/* Product Grid */}
                        <div className={`grid ${viewMode === "grid" ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1"} gap-6 mb-12`}>
                            {products.map((p) => (
                                <Card
                                    key={p._id}
                                    className="group relative overflow-hidden border-0 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
                                    onMouseEnter={() => setHoveredProduct(p._id)}
                                    onMouseLeave={() => setHoveredProduct(null)}
                                >
                                    <CardContent className="p-0">
                                        <div className="relative overflow-hidden">
                                            {p.discount > 0 && (
                                                <div className="absolute top-2 left-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold z-10">
                                                    -{p.discount}%
                                                </div>
                                            )}

                                            <button className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                <Heart className="h-4 w-4 text-gray-600 hover:text-red-500" />
                                            </button>

                                            <div className="relative aspect-square overflow-hidden bg-gray-100">
                                                <img
                                                    src={p.images && p.images.length > 0 ? p.images[0] : "/placeholder.png"}
                                                    alt={p.name}
                                                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                                                />
                                                <div
                                                    className={`absolute inset-0 bg-black/40 flex items-center justify-center gap-3 transition-opacity duration-300 ${
                                                        hoveredProduct === p._id ? "opacity-100" : "opacity-0"
                                                    }`}
                                                >
                                                     {/* NÚT XEM NHANH */}
                                                    <Button
                                                        size="sm"
                                                        className="bg-white text-gray-900 hover:bg-gray-100"
                                                        onClick={(e) => { e.stopPropagation(); handleQuickView(p); }}
                                                    >
                                                        <Box className="h-4 w-4 mr-1"/> Chọn sản phẩm
                                                    </Button>
                                                    
                                                     {/* Nút Xem Chi tiết (chuyển trang) */}
                                                    <Button
                                                         size="sm"
                                                         className="bg-blue-500 text-white hover:bg-blue-600"
                                                         onClick={() => handleViewDetails(p._id)}
                                                    >
                                                         Chi tiết
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4">
                                            <h3 className="font-semibold text-base mb-2 line-clamp-2">{p.name}</h3>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-lg font-bold text-red-600">{formatPrice(p.price)}</span>
                                                {/* Hiển thị giá cũ nếu có discount */}
                                                {p.discount > 0 && (
                                                    <span className="text-sm text-gray-400 line-through">
                                                         {formatPrice(p.price / (1 - p.discount / 100))} 
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {/* Đã loại bỏ hiển thị đánh giá sao trong card */}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Pagination */}
                        <Pagination>
                            <PaginationContent>
                                {Array.from({ length: totalPages }).map((_, i) => (
                                    <PaginationItem key={i}>
                                        <PaginationLink
                                            isActive={page === i + 1}
                                            onClick={() => setPage(i + 1)}
                                            className="cursor-pointer"
                                        >
                                            {i + 1}
                                        </PaginationLink>
                                    </PaginationItem>
                                ))}
                            </PaginationContent>
                        </Pagination>
                    </>
                )}
            </div>
            
            {/* QUICK VIEW DIALOG */}
            <ProductQuickViewDialog
                product={quickViewProduct}
                isOpen={isQuickViewOpen}
                onClose={() => setIsQuickViewOpen(false)}
                quantity={quantity}
                setQuantity={setQuantity}
                handleViewDetails={handleViewDetails}
                navigate={navigate} 
            />
        </div>
    )
}

export default CategoryPage