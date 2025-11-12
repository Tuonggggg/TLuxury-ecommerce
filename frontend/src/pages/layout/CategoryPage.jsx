import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Grid3x3, List, ShoppingCart, Loader2 } from "lucide-react"
import api from "@/lib/axios"
import { toast } from "sonner"
import ProductCard from "@/components/ProductCard"

// [GUEST] 1. Import hooks và actions từ Redux
import { useDispatch, useSelector } from "react-redux"
import { addToGuestCart } from "@/store/slices/cartSlice" // <-- Đảm bảo đường dẫn đúng

const CategoryPage = () => {
    const { name } = useParams()
    const navigate = useNavigate()
    const [category, setCategory] = useState(null)
    const [products, setProducts] = useState([])
    const [brandsList, setBrandsList] = useState([])
    const [filter, setFilter] = useState({ price: "asc", brand: "all" })
    const [viewMode, setViewMode] = useState("grid")
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(true)
    const [totalPages, setTotalPages] = useState(1)
    const [isAddingToCart, setIsAddingToCart] = useState({})
    const itemsPerPage = 9

    // [GUEST] 2. Khởi tạo Redux
    const dispatch = useDispatch()
    const { userInfo } = useSelector((state) => state.auth)

    // ✅ HÀM LẤY DANH SÁCH THƯƠNG HIỆU ĐỘNG (Không đổi)
    const fetchBrandsList = useCallback(async () => {
        try {
            const res = await api.get('/products/brands');
            setBrandsList(res.data);
        } catch (error) {
            console.error("Không thể tải danh sách thương hiệu:", error);
        }
    }, [])

    // ✅ HÀM GỌI API LẤY SẢN PHẨM (Không đổi)
    const fetchProducts = useCallback(async () => {
        if (!category) return
        try {
            setLoading(true)
            const params = {
                category: name,
                sortBy: "price",
                order: filter.price,
                brand: filter.brand !== "all" ? filter.brand : undefined,
                page,
                limit: itemsPerPage,
            }
            const res = await api.get(`/products`, { params })
            setProducts(res.data.products || [])
            setTotalPages(res.data.totalPages || 1)
        } catch (err) {
            console.error("Lỗi khi lấy sản phẩm:", err)
        } finally {
            setLoading(false)
        }
    }, [category, filter, page, itemsPerPage, name])

    // =======================================================
    // [GUEST] 3. HÀM ADD TO CART (ĐÃ CẬP NHẬT)
    // =======================================================
    const handleAddToCart = async (productToAdd, qty = 1) => {
        const productId = productToAdd._id;

        if (productToAdd.stock === 0) {
            toast.error(`"${productToAdd.name}" đã hết hàng.`);
            return;
        }

        // (Logic kiểm tra số lượng tối đa 5)
        if (qty > 5) {
            toast.error(`Bạn chỉ có thể mua tối đa 5 sản phẩm này.`);
            return;
        }

        setIsAddingToCart(prev => ({ ...prev, [productId]: true }));

        try {
            // [GUEST] Phân luồng
            if (userInfo) {
                // ----- LOGIC CHO USER (CŨ) -----
                const payload = { productId: productId, qty: qty };
                await api.post("/cart", payload);
            } else {
                // ----- LOGIC CHO KHÁCH (MỚI) -----
                // (cartSlice đã được nâng cấp để nhận qty)
                dispatch(addToGuestCart({ product: productToAdd, qty: qty }));
            }

            // Cập nhật tồn kho (Stock - qty) trên FE
            setProducts(prevProducts => prevProducts.map(p =>
                p._id === productId ? { ...p, stock: p.stock - qty } : p
            ));

        } catch (error) {
            // Lỗi này chủ yếu xảy ra khi User (API) thất bại
            const errorMessage = error.response?.data?.message || "Lỗi kết nối hoặc phiên đăng nhập đã hết hạn.";
            toast.error("Thêm vào giỏ hàng thất bại.", { description: errorMessage });
        } finally {
            setIsAddingToCart(prev => ({ ...prev, [productId]: false }));
        }
    };

    // (useEffect fetchCategory - Không đổi)
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
        fetchBrandsList();
    }, [name, fetchBrandsList])

    // (useEffect fetchProducts - Không đổi)
    useEffect(() => {
        fetchProducts()
    }, [category, filter, page, fetchProducts])

    // (handleQuickView - Không đổi)
    const handleQuickView = (product) => {
        navigate(`/product/${product._id || product.slug}`);
    }

    if (!category && loading) return (
        <p className="text-center py-12 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Đang tải danh mục...
        </p>
    )

    if (!category && !loading) return <p className="text-center py-12 text-red-500">Không tìm thấy danh mục.</p>


    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Breadcrumb & Banner (Giữ nguyên) */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 md:py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="hover:text-blue-600 cursor-pointer" onClick={() => navigate("/")}>Trang chủ</span>
                        <span>/</span>
                        <span className="hover:text-blue-600 cursor-pointer capitalize font-semibold text-blue-600">{category.name}</span>
                    </div>
                </div>
            </div>

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
                {/* Thanh lọc (Giữ nguyên) */}
                <div className="bg-white rounded-xl shadow-md p-4 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3 flex-1">
                        <span className="text-gray-600 font-medium">Lọc theo:</span>
                        <Select
                            value={filter.price}
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
                            value={filter.brand}
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
                                {brandsList.map((brand) => (
                                    <SelectItem key={brand.value} value={brand.value}>
                                        {brand.label}
                                    </SelectItem>
                                ))}
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

                {/* Kết quả (Giữ nguyên) */}
                {loading ? (
                    <p className="text-center text-gray-500 py-12 flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" /> Đang tải sản phẩm...
                    </p>
                ) : products.length === 0 ? (
                    <p className="text-center text-gray-500 py-12">Không tìm thấy sản phẩm nào.</p>
                ) : (
                    <>
                        <div className={`grid ${viewMode === "grid" ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-3" : "grid-cols-1"} gap-6 mb-12`}>
                            {products.map((p) => (
                                <ProductCard
                                    key={p._id}
                                    product={p}
                                    onAddToCart={handleAddToCart}
                                    onQuickView={() => handleQuickView(p)}
                                    isPending={!!isAddingToCart[p._id]}
                                />
                            ))}
                        </div>

                        {/* Phân trang (Giữ nguyên) */}
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
        </div>
    )
}

export default CategoryPage