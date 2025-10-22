import { useEffect, useState, useMemo, useCallback } from "react";
import api from "@/lib/axios";
import ProductCard from "@/components/ProductCard";
import { Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// Components từ Shadcn/ui
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

// --- Cấu hình ---
const PRODUCTS_PER_PAGE = 12; // Số sản phẩm trên mỗi trang

// --- Component Chính ---
const FlashSalePage = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("default"); // Mặc định là 'default'
  const [searchTerm, setSearchTerm] = useState("");
  const [endDate, setEndDate] = useState(null);
  const [countdown, setCountdown] = useState({ hours: "00", minutes: "00", seconds: "00" });
  const [loadingProducts, setLoadingProducts] = useState(new Set()); // Thêm state cho sản phẩm đang thêm vào giỏ
  const navigate = useNavigate();

  // --- Logic Lấy Dữ Liệu ---
  useEffect(() => {
    const fetchFlashSale = async () => {
      setLoading(true);
      try {
        const res = await api.get("/products/flashsale");
        const products = res.data.products || [];
        setAllProducts(products);

        if (products.length > 0) {
          // --- YÊU CẦU 2: CÀI ĐẶT GIỜ FLASHSALE NGẪU NHIÊN ---
          // Sử dụng localStorage để lưu trữ endDate, đảm bảo nhất quán qua các lần tải trang
          // Tự động renew khi hết hạn
          initializeEndDate();
        }
      } catch (error) {
        console.error("❌ Lỗi tải Flash Sale:", error);
        toast.error("Không thể tải sản phẩm Flash Sale! Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchFlashSale();
  }, []);

  // Hàm tạo endTime ngẫu nhiên (trả về timestamp)
  const createRandomEndTime = () => {
    const now = Date.now();
    const randomHours = Math.floor(Math.random() * 12) + 1;
    const randomMinutes = Math.floor(Math.random() * 60);
    const randomSeconds = Math.floor(Math.random() * 60);
    return now + (randomHours * 3600000) + (randomMinutes * 60000) + (randomSeconds * 1000);
  };

  // Khởi tạo endDate từ localStorage hoặc tạo mới
  const initializeEndDate = () => {
    const now = Date.now();
    let storedEnd = localStorage.getItem("flashSaleEndDate");
    let endTime;

    if (storedEnd) {
      endTime = new Date(storedEnd).getTime();
      if (endTime <= now) {
        endTime = createRandomEndTime();
        localStorage.setItem("flashSaleEndDate", new Date(endTime).toISOString());
      }
    } else {
      endTime = createRandomEndTime();
      localStorage.setItem("flashSaleEndDate", new Date(endTime).toISOString());
    }

    setEndDate(new Date(endTime));
  };

  // --- Logic Đếm Ngược (riêng biệt để renew khi endDate thay đổi) ---
  useEffect(() => {
    if (!endDate) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = endDate.getTime() - now;

      if (diff <= 0) {
        setCountdown({ hours: "00", minutes: "00", seconds: "00" });
        clearInterval(interval);

        // Tự động renew endDate mới
        const newEndTime = createRandomEndTime();
        localStorage.setItem("flashSaleEndDate", new Date(newEndTime).toISOString());
        setEndDate(new Date(newEndTime));
        toast.info("Flash sale đã kết thúc! Một đợt flash sale mới đã bắt đầu.");

        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, "0");
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, "0");
      const seconds = Math.floor((diff % (1000 * 60)) / 1000).toString().padStart(2, "0");

      setCountdown({ hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, [endDate]);

  // Reset trang về 1 khi sort hoặc search thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [sortBy, searchTerm]);

  // --- Hàm xử lý thêm vào giỏ hàng ---
  const handleAddToCart = async (product) => {
    const productId = product._id;
    setLoadingProducts((prev) => new Set([...prev, productId]));

    try {
      const payload = {
        productId: productId,
        qty: 1,
      };
      await api.post("/cart", payload);

      toast.success(`Đã thêm vào giỏ hàng!`, {
        description: `1 x ${product.name} đã được thêm thành công.`,
        action: {
          label: "Xem giỏ",
          onClick: () => navigate("/cart"),
        },
      });
    } catch (error) {
      console.error("❌ Lỗi thêm vào giỏ hàng:", error.response?.data || error.message);
      if (error.response?.status === 401) {
        toast.error("Vui lòng đăng nhập để thêm vào giỏ hàng!");
        // Có thể redirect: navigate("/login");
      } else {
        toast.error(error.response?.data?.message || "Không thể thêm vào giỏ hàng! Vui lòng thử lại.");
      }
    } finally {
      setLoadingProducts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  // --- Logic Lọc & Sắp Xếp (Filtering & Sorting) ---
  const filteredSortedProducts = useMemo(() => {
    let products = [...allProducts];

    // Lọc theo searchTerm (giả sử product có trường 'name')
    if (searchTerm) {
      products = products.filter((product) =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sắp xếp
    switch (sortBy) {
      case "price_asc":
        products.sort((a, b) => a.salePrice - b.salePrice);
        break;
      case "price_desc":
        products.sort((a, b) => b.salePrice - a.salePrice);
        break;
      case "discount_desc":
        products.sort((a, b) => {
          const discA = (a.price - a.salePrice) / a.price;
          const discB = (b.price - b.salePrice) / b.price;
          return discB - discA;
        });
        break;
      case "default":
      default:
        // Giữ nguyên thứ tự từ API
        break;
    }

    return products;
  }, [allProducts, searchTerm, sortBy]);

  // --- Logic Phân Trang (Pagination) ---
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

  // --- Render Trạng thái Tải ---
  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4 min-h-screen">
        <div className="flex items-center justify-center space-x-2 text-red-600 mb-8">
          <Loader2 className="mr-2 h-8 w-8 animate-spin" />
          <span className="text-xl font-semibold">Đang tải các deal chớp nhoáng...</span>
        </div>
        {/* YÊU CẦU 1: 3 SẢN PHẨM / HÀNG (cho Skeleton) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(PRODUCTS_PER_PAGE)].map((_, index) => (
            <Card key={index} className="rounded-2xl overflow-hidden animate-pulse border-none">
              <Skeleton className="w-full h-[250px] rounded-t-2xl bg-gray-200" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4 bg-gray-300" />
                <Skeleton className="h-4 w-1/2 bg-gray-300" />
                <Skeleton className="h-8 w-full bg-red-200 rounded-lg" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // --- Render Giao diện chính ---
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto py-12 px-4">
        {/* 1. Banner và Đồng hồ đếm ngược */}
        <div className="relative bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 text-white shadow-2xl mb-12 rounded-3xl overflow-hidden p-8 md:p-12 text-center">
          <div
            className="absolute inset-0 bg-repeat bg-center opacity-10"
            style={{ backgroundImage: "url('/path/to/your/pattern.svg')" }}
          ></div>
          <div className="relative z-10">
            <h1 className="flex items-center justify-center gap-4 text-4xl md:text-6xl font-extrabold tracking-tight drop-shadow-lg">
              <Zap className="h-10 w-10 animate-pulse" />
              DEAL CHỚP NHOÁNG
              <Zap className="h-10 w-10 animate-pulse" />
            </h1>
            <p className="text-xl font-medium mt-3 drop-shadow-md">Săn Sale Nóng - Chốt Đơn Ngay!</p>

            <div className="flex justify-center items-center gap-2 md:gap-4 mt-8">
              {/* Giờ */}
              <div className="text-center">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 md:p-4 min-w-[70px] md:min-w-[90px]">
                  <span className="text-4xl md:text-6xl font-bold">{countdown.hours}</span>
                </div>
                <span className="text-sm font-semibold mt-2 block">Giờ</span>
              </div>
              <span className="text-4xl md:text-6xl font-bold text-white/50">:</span>
              {/* Phút */}
              <div className="text-center">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 md:p-4 min-w-[70px] md:min-w-[90px]">
                  <span className="text-4xl md:text-6xl font-bold">{countdown.minutes}</span>
                </div>
                <span className="text-sm font-semibold mt-2 block">Phút</span>
              </div>
              <span className="text-4xl md:text-6xl font-bold text-white/50">:</span>
              {/* Giây */}
              <div className="text-center">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 md:p-4 min-w-[70px] md:min-w-[90px]">
                  <span className="text-4xl md:text-6xl font-bold">{countdown.seconds}</span>
                </div>
                <span className="text-sm font-semibold mt-2 block">Giây</span>
              </div>
            </div>
          </div>
        </div>

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
          // YÊU CẦU 1: 3 SẢN PHẨM / HÀNG (cho Danh sách chính)
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

export default FlashSalePage;

// --- Component Phân Trang tùy chỉnh (CustomPagination) ---
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