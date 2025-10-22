    import { useState, useEffect } from "react"
    import { useParams, useNavigate, Link } from "react-router-dom"
    import { Button } from "@/components/ui/button"
    import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination"
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
    import { Grid3x3, List, ShoppingCart, Minus, Plus, Loader2 } from "lucide-react"
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
    import { Input } from "@/components/ui/input"
    import api from "@/lib/axios"
    import { toast } from "sonner"
    import ProductCard from "@/components/ProductCard"

    // =========================================================
    // HÀM TIỆN ÍCH
    // =========================================================
    const formatPrice = (price) => {
        if (price === null || price === undefined) return "N/A"
        const validPrice = typeof price === "number" && isFinite(price) ? Math.round(price) : 0
        return validPrice.toLocaleString("vi-VN") + "₫"
    }

    // =========================================================
    // COMPONENT QUICK VIEW DIALOG
    // =========================================================
    // (Giữ nguyên logic Quick View Dialog như bạn đã cung cấp)
    const ProductQuickViewDialog = ({ product, isOpen, onClose, quantity, setQuantity, handleViewDetails, navigate }) => {
        if (!product) return null
        const maxStock = product.stock || 100
        const hasDiscount = product.discount > 0
        const finalPrice =
            product.finalPrice ||
            (hasDiscount ? Math.round(product.price * (1 - product.discount / 100)) : product.price)

        // Hàm AddToCart riêng của QuickView (vì nó dùng state 'quantity')
        const handleQuickViewAddToCart = async () => {
            if (product.stock === 0) {
                toast.error(`Sản phẩm "${product.name}" đã hết hàng.`, {
                    description: "Vui lòng chọn sản phẩm khác hoặc đợi hàng về.",
                })
                return
            }

            try {
                const payload = { productId: product._id, qty: quantity }
                await api.post("/cart", payload)
                toast.success(`Đã thêm vào giỏ hàng!`, {
                    description: `${quantity} x ${product.name} đã được thêm thành công.`,
                    action: {
                        label: "Xem giỏ hàng",
                        onClick: () => {
                            onClose()
                            navigate("/cart")
                        },
                    },
                })
                onClose()
                // Tùy chọn: Gọi lại hàm fetchProducts từ component cha để cập nhật tồn kho
            } catch (error) {
                console.error("Lỗi khi thêm vào giỏ hàng:", error)
                const errorMessage = error.response?.data?.message || "Lỗi kết nối hoặc phiên đăng nhập đã hết hạn."
                toast.error("Thêm vào giỏ hàng thất bại.", { description: errorMessage })
            }
        }

        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-3xl p-0 overflow-hidden rounded-lg">
                    <div className="grid md:grid-cols-2 gap-0">
                        {/* Image Section */}
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

                            {/* Giá sản phẩm */}
                            <div className="flex items-center gap-4 py-2">
                                <span className="text-3xl font-extrabold text-red-600">{formatPrice(finalPrice)}</span>
                                {hasDiscount && (
                                    <span className="text-lg text-gray-400 line-through">{formatPrice(product.price)}</span>
                                )}
                            </div>

                            {/* Tình trạng */}
                            <div className="flex justify-between items-center text-sm">
                                <p className="text-gray-600">Tình trạng:</p>
                                <span
                                    className={`font-medium px-3 py-1 rounded-full ${product.stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                        }`}
                                >
                                    {product.stock > 0 ? `Còn hàng (${product.stock})` : "Hết hàng"}
                                </span>
                            </div>

                            {/* Mô tả */}
                            <p className="text-gray-700 text-sm italic mb-2">Mô tả: {product.description}</p>

                            {/* Chọn số lượng */}
                            <div className="flex items-center gap-3 pt-4 border-t">
                                <span className="text-base font-medium text-gray-700">Chọn Số lượng:</span>
                                <div className="flex items-center border rounded-md">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
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
                                        onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
                                        disabled={quantity >= maxStock || maxStock === 0}
                                        className="h-9 w-9"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Nút thêm vào giỏ */}
                            <div className="pt-4">
                                <Button
                                    className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    onClick={handleQuickViewAddToCart} // Gọi hàm AddToCart cho Quick View
                                    disabled={product.stock === 0 || quantity > maxStock || quantity < 1}
                                >
                                    <ShoppingCart className="h-5 w-5 mr-2" /> Thêm vào Giỏ hàng
                                </Button>
                            </div>
                            <div className="text-center pt-2">
                                <Button variant="link" onClick={() => { onClose(); handleViewDetails(product._id) }}>
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
        const [page, setPage] = useState(1)
        const [loading, setLoading] = useState(true)
        const [totalPages, setTotalPages] = useState(1)
        const [isQuickViewOpen, setIsQuickViewOpen] = useState(false)
        const [quickViewProduct, setQuickViewProduct] = useState(null)
        const [quantity, setQuantity] = useState(1) // State cho QuickView
        const [isAddingToCart, setIsAddingToCart] = useState({}) // State loading cho các nút AddToCart
        const itemsPerPage = 8

        // Tách hàm fetchProducts để có thể gọi lại
        const fetchProducts = async () => {
            if (!category || !category._id) return
            try {
                setLoading(true)
                const params = {
                    sortBy: "price",
                    order: filter.price,
                    brand: filter.brand !== "all" ? filter.brand : undefined,
                    page,
                    limit: itemsPerPage,
                }
                const res = await api.get(`/categories/${category._id}/products`, { params })
                setProducts(res.data.products || [])
                setTotalPages(res.data.totalPages || 1)
            } catch (err) {
                console.error("Lỗi khi lấy sản phẩm:", err)
            } finally {
                setLoading(false)
            }
        }

        // Lấy thông tin danh mục
        useEffect(() => {
            if (!name) return
            const fetchCategory = async () => {
                try {
                    const res = await api.get(`/categories/slug/${name}`)
                    setCategory(res.data)
                } catch (err) {
                    console.error("Lỗi khi lấy category:", err)
                }
            }
            fetchCategory()
        }, [name])

        // Lấy sản phẩm khi category, filter hoặc page thay đổi
        useEffect(() => {
            fetchProducts()
        }, [category, filter, page])

        const handleViewDetails = (id) => navigate(`/product/${id}`)
        const handleQuickView = (product) => {
            setQuickViewProduct(product)
            setQuantity(1)
            setIsQuickViewOpen(true)
        }

        // ✅ LOGIC ADD TO CART (Được truyền xuống ProductCard)
        const handleAddToCart = async (productToAdd) => {
            const productId = productToAdd._id;

            if (productToAdd.stock === 0) {
                toast.error(`"${productToAdd.name}" đã hết hàng.`);
                return;
            }

            setIsAddingToCart(prev => ({ ...prev, [productId]: true })); // Bật loading

            try {
                const payload = {
                    productId: productId,
                    qty: 1 // Thêm 1 sản phẩm
                };
                await api.post("/cart", payload);

                toast.success(`Đã thêm vào giỏ hàng!`, {
                    description: `1 x ${productToAdd.name} đã được thêm thành công.`,
                    action: {
                        label: "Xem giỏ",
                        onClick: () => navigate('/cart')
                    }
                });

                // Cập nhật tồn kho (UX)
                setProducts(prevProducts => prevProducts.map(p =>
                    p._id === productId ? { ...p, stock: p.stock - 1 } : p
                ));

            } catch (error) {
                console.error("Lỗi khi thêm vào giỏ hàng:", error);
                const errorMessage = error.response?.data?.message || "Lỗi kết nối hoặc phiên đăng nhập đã hết hạn.";
                toast.error("Thêm vào giỏ hàng thất bại.", { description: errorMessage });
            } finally {
                setIsAddingToCart(prev => ({ ...prev, [productId]: false })); // Tắt loading
            }
        };


        if (!category) return <p className="text-center py-12">Đang tải danh mục...</p>

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
                            <span className="hover:text-blue-600 cursor-pointer capitalize" onClick={() => navigate(`/category/${category.slug}`)}>
                                {category.name}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Banner */}
                <div className="w-full px-4 md:px-8 py-4 md:py-8">
                    <div className="max-w-7xl mx-auto relative overflow-hidden rounded-2xl md:rounded-3xl h-[250px] md:h-[400px] shadow-2xl">
                        <img
                            src={`/${category.image}`}
                            alt={category.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                {/* Bộ lọc & sản phẩm */}
                <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-8">
                    {/* Thanh lọc */}
                    <div className="bg-white rounded-xl shadow-md p-4 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-3 flex-1">
                            <span className="text-gray-600 font-medium">Lọc theo:</span>
                            <Select
                                onValueChange={(val) => {
                                    setFilter({ ...filter, price: val })
                                    setPage(1)
                                }}
                            >
                                <SelectTrigger className="w-[180px] border-gray-300">
                                    <SelectValue placeholder="Sắp xếp theo giá" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="asc">Giá: Thấp đến cao</SelectItem>
                                    <SelectItem value="desc">Giá: Cao đến thấp</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select
                                onValueChange={(val) => {
                                    setFilter({ ...filter, brand: val })
                                    setPage(1)
                                }}
                            >
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

                    {/* Kết quả */}
                    {loading ? (
                        <p className="text-center text-gray-500 py-12">Đang tải sản phẩm...</p>
                    ) : products.length === 0 ? (
                        <p className="text-center text-gray-500 py-12">Không tìm thấy sản phẩm nào.</p>
                    ) : (
                        <>
                            {/* ✅ SỬ DỤNG PRODUCTCARD ĐÃ TÁCH RỜI */}
                            <div className={`grid ${viewMode === "grid" ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1"} gap-6 mb-12`}>
                                {products.map((p) => (
                                    <ProductCard
                                        key={p._id}
                                        product={p}
                                        onAddToCart={handleAddToCart}
                                        isPending={!!isAddingToCart[p._id]} // Truyền trạng thái loading
                                    />
                                ))}
                            </div>

                            {/* Phân trang */}
                            <Pagination>
                                <PaginationContent>
                                    {Array.from({ length: totalPages }).map((_, i) => (
                                        <PaginationItem key={i}>
                                            <PaginationLink isActive={page === i + 1} onClick={() => setPage(i + 1)} className="cursor-pointer">
                                                {i + 1}
                                            </PaginationLink>
                                        </PaginationItem>
                                    ))}
                                </PaginationContent>
                            </Pagination>
                        </>
                    )}
                </div>

                {/* Quick View Dialog */}
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