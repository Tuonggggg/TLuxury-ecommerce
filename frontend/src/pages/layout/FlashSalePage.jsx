import { useEffect, useState, useMemo, useCallback } from "react";
import api from "@/lib/axios";
import ProductCard from "@/components/ProductCard";
import { Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

// [GUEST] 1. Import Redux
import { useDispatch, useSelector } from "react-redux";
import { addToGuestCart } from "@/store/slices/cartSlice"; // <-- Đảm bảo đường dẫn đúng

const PRODUCTS_PER_PAGE = 12;

const FlashSalePage = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("default");
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(new Set());

  // [GUEST] 2. Khởi tạo Redux
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);

  // --- Logic Lấy Dữ Liệu từ Backend (Không đổi) ---
  useEffect(() => {
    const fetchFlashSale = async () => {
      setLoading(true);
      try {
        const res = await api.get("/products/flashsale");
        const products = res.data.products || [];
        setAllProducts(products);
      } catch (error) {
        console.error("❌ Lỗi tải Flash Sale:", error);
        toast.error("Không thể tải sản phẩm Flash Sale! Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };
    fetchFlashSale();
  }, []);

  // Reset trang về 1 khi sort hoặc search thay đổi (Không đổi)
  useEffect(() => {
    setCurrentPage(1);
  }, [sortBy, searchTerm]);

  // =======================================================
  // [GUEST] 3. HÀM ADD TO CART (ĐÃ CẬP NHẬT)
  // =======================================================
  const handleAddToCart = async (product) => {
    const productId = product._id;

    // [GUEST] Thêm kiểm tra tồn kho
    if (product.stock === 0) {
      toast.error(`"${product.name}" đã hết hàng.`);
      return;
    }

    setLoadingProducts((prev) => new Set([...prev, productId]));

    try {
      // [GUEST] Phân luồng
      if (userInfo) {
        // ----- LOGIC CHO USER (API) -----
        const payload = { productId: productId, qty: 1 };
        await api.post("/cart", payload);
      } else {
        // ----- LOGIC CHO KHÁCH (REDUX) -----
        dispatch(addToGuestCart({ product: product, qty: 1 }));
      }

      // [GUEST] Cập nhật UI stock
      setAllProducts(prevProducts => prevProducts.map(p =>
        p._id === productId ? { ...p, stock: p.stock - 1 } : p
      ));

    } catch (error) {
      console.log(error); // Lỗi này chủ yếu từ API (user)
      const errorMessage = error.response?.data?.message || "Lỗi kết nối hoặc phiên đăng nhập đã hết hạn.";
      toast.error("Thêm vào giỏ hàng thất bại.", { description: errorMessage });
    } finally {
      setLoadingProducts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };


  // --- Logic Lọc & Sắp Xếp (Không đổi) ---
  const filteredSortedProducts = useMemo(() => {
    let products = [...allProducts];

    if (searchTerm) {
      products = products.filter((product) =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const getSalePrice = (p) => p.flashSale?.flashPrice || p.finalPrice || p.price;
    const getDiscountValue = (p) => (p.price - getSalePrice(p));

    switch (sortBy) {
      case "price_asc":
        products.sort((a, b) => getSalePrice(a) - getSalePrice(b));
        break;
      case "price_desc":
        products.sort((a, b) => getSalePrice(b) - getSalePrice(a));
        break;
      case "discount_desc":
        products.sort((a, b) => getDiscountValue(b) - getDiscountValue(a));
        break;
      case "default":
      default:
        break;
    }
    return products;
  }, [allProducts, searchTerm, sortBy]);

  // --- Logic Phân Trang (Không đổi) ---
  const totalPages = Math.ceil(filteredSortedProducts.length / PRODUCTS_PER_PAGE);

  const currentProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    return filteredSortedProducts.slice(startIndex, endIndex);
  }, [filteredSortedProducts, currentPage]);

  const handlePageChange = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [totalPages]);


  // --- Render Trạng thái Tải (Không đổi) ---
  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4">
        {/* (Skeleton Banner) */}
        <Skeleton className="h-[250px] w-full rounded-3xl mb-10" />
        {/* (Skeleton Toolbar) */}
        <div className="flex justify-between items-center mb-8">
          <Skeleton className="h-8 w-1/4" />
          <div className="flex gap-4">
            <Skeleton className="h-10 w-[250px]" />
            <Skeleton className="h-10 w-[200px]" />
          </div>
        </div>
        {/* (Skeleton Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[400px] w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  // --- Render Giao diện chính (Không đổi) ---
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto py-12 px-4">
        {/* 1. Banner */}
        <Card className="relative overflow-hidden border-none rounded-3xl shadow-xl mb-10">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-red-600 to-yellow-400 bg-[length:200%_200%] animate-[gradientShift_6s_ease_infinite]" />
          <div className="absolute inset-0 bg-black/20" />
          <CardContent className="relative z-10 flex flex-col items-center justify-center text-center py-16 px-6 text-white space-y-6">
            <div className="flex items-center justify-center space-x-2">
              <Zap className="w-8 h-8 text-yellow-300 animate-pulse" />
              <h2 className="text-4xl md:text-5xl font-extrabold uppercase tracking-tight drop-shadow-lg">
                Flash Sale Bùng Nổ 🔥
              </h2>
            </div>
            <p className="text-lg md:text-xl font-medium text-white/90 leading-relaxed max-w-2xl">
              Ưu đãi <span className="font-bold text-yellow-300">giảm sâu </span>
              cho các sản phẩm hot nhất hôm nay.
              <br />Nhanh tay trước khi hết hàng!
            </p>
            <Button
              size="lg"
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-extrabold px-8 py-3 rounded-full shadow-lg transition-all hover:scale-110"
              onClick={() => window.scrollTo({ top: 600, behavior: 'smooth' })}
            >
              Mua ngay
            </Button>
          </CardContent>
        </Card>

        {/* 2. Thanh Công Cụ (Toolbar) */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4 md:space-y-0">
          <p className="text-base font-semibold text-gray-800">
            <span className="text-red-600 font-bold">{allProducts.length}</span> ưu đãi đang chờ bạn!
          </p>
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-3 md:space-y-0 md:space-x-4 w-full md:w-auto">
            <Input
              placeholder="Tìm kiếm sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-[250px] border-gray-300 focus:ring-red-500 bg-white shadow-sm"
            />
            <div className="flex items-center space-x-3 w-full md:w-auto">
              <span className="text-gray-600 font-medium">Sắp xếp theo:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-[200px] border-gray-300 focus:ring-red-500 bg-white shadow-sm">
                  <SelectValue placeholder="Chọn thứ tự" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Mặc định</SelectItem>
                  <SelectItem value="price_asc">Giá: Thấp đến Cao</SelectItem>
                  <SelectItem value="price_desc">Giá: Cao đến Thấp</SelectItem>
                  <SelectItem value="discount_desc">Giảm giá: Cao đến Thấp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* 3. Danh sách Sản phẩm */}
        {filteredSortedProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-lg border border-gray-100">
            <Zap className="h-12 w-12 text-red-500 mx-auto mb-4 animate-bounce" />
            {allProducts.length === 0 ? (
              <>
                <h3 className="text-2xl font-bold text-gray-900">Chưa có deal hot nào được tung ra.</h3>
                <p className="text-gray-700 mt-2">Vui lòng quay lại sau để không bỏ lỡ các ưu đãi hấp dẫn nhé!</p>
              </>
            ) : (
              <>
                <h3 className="text-2xl font-bold text-gray-900">Không tìm thấy sản phẩm nào.</h3>
                <p className="text-gray-700 mt-2">Hãy thử từ khóa khác nhé!</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {currentProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                isFlashSale={true}
                onAddToCart={handleAddToCart}
                isPending={loadingProducts.has(product._id)}
              />
            ))}
          </div>
        )}

        {/* 4. Phân Trang */}
        {totalPages > 1 && (
          <div className="mt-12 flex justify-center">
            <CustomPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Component Phân Trang (Không đổi)
const CustomPagination = ({ currentPage, totalPages, onPageChange }) => {
  const pageNumbers = useMemo(() => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push("...");
      }
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push("...");
      }
      pages.push(totalPages);
    }
    return pages;
  }, [currentPage, totalPages]);

  return (
    <Pagination>
      <PaginationContent className="bg-white shadow-md rounded-full p-2 border border-gray-200 space-x-1">
        <PaginationItem>
          <PaginationPrevious
            className="hover:bg-red-50 text-red-600 rounded-full cursor-pointer"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          />
        </PaginationItem>
        {pageNumbers.map((page, index) => (
          <PaginationItem key={index}>
            {page === "..." ? (
              <span className="flex items-center justify-center h-10 w-10 text-sm text-gray-600">...</span>
            ) : (
              <PaginationLink
                className={`hover:bg-red-100 rounded-full cursor-pointer ${page === currentPage ? "bg-red-600 text-white hover:bg-red-700" : "text-gray-700"}`}
                onClick={() => onPageChange(page)}
                isActive={page === currentPage}
              >
                {page}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            className="hover:bg-red-50 text-red-600 rounded-full cursor-pointer"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default FlashSalePage;