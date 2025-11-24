import React, { useEffect, useState, useCallback } from "react";
import api from "@/lib/axios";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, List } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { toast } from 'sonner';

// ==========================
// 🧱 Component: BlogCard (Hiển thị 1 bài blog)
// ==========================
const BlogCard = ({ post }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/blog/${post.slug}`);
  };

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg overflow-hidden cursor-pointer group hover:shadow-lg transition-shadow duration-300"
      onClick={handleClick}
    >
      <div className="relative overflow-hidden bg-gray-100 aspect-[4/3]">
        <img
          src={post.featuredImage?.url || "/placeholder.png"}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      <div className="p-4">
        <p className="text-xs text-gray-500 mb-1">
          {new Date(post.createdAt).toLocaleDateString('vi-VN')}
        </p>
        <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
          {post.title}
        </h3>
        <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
          {post.excerpt}
        </p>
      </div>
    </div>
  );
};

// ==========================
// 🧱 Component: CategorySidebar (Lấy dữ liệu động)
// ==========================
const CategorySidebar = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Tải danh mục sản phẩm
  useEffect(() => {
    const fetchProductCategories = async () => {
      try {
        const res = await api.get('/categories');
        // Lọc ra các danh mục cha (parent === null)
        const parentCategories = (res.data || []).filter(cat => cat.parent === null);
        setCategories(parentCategories);
      } catch (err) {
        console.error("Lỗi tải danh mục sản phẩm:", err);
        toast.error("Không thể tải danh mục sản phẩm.");
      } finally {
        setLoading(false);
      }
    };
    fetchProductCategories();
  }, []);

  // Hàm điều hướng khi nhấn vào danh mục
  const handleCategoryClick = (slug) => {
    navigate(`/category/${slug}`);
  };

  return (
    <div className="bg-white border border-gray-200">
      <div className="bg-orange-500 text-white px-4 py-3">
        <h2 className="text-base font-bold flex items-center gap-2">
          <List className="w-4 h-4" />
          NHÓM SẢN PHẨM NỔI BẬT
        </h2>
      </div>
      <div className="divide-y divide-gray-200">
        {loading && (
          <p className="p-4 text-sm text-gray-500">Đang tải danh mục...</p>
        )}
        {categories.map((category) => (
          <button
            key={category._id}
            onClick={() => handleCategoryClick(category.slug)}
            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
};

// ==========================
// 🧱 Component: Pagination (Logic giới hạn nút hiển thị)
// ==========================
const PaginationComponent = ({ currentPage, totalPages, onPageChange }) => {
  // Hàm tạo mảng số trang để hiển thị
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5; // Hiển thị tối đa 5 nút số trang

    // Logic hiển thị 5 trang xung quanh trang hiện tại
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    // Điều chỉnh khi ở cuối danh sách
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Trường hợp tổng số trang ít hơn giới hạn hiển thị
    if (totalPages <= maxPagesToShow) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    return pages;
  };

  return (
    <Pagination className="mt-8">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => { e.preventDefault(); onPageChange(currentPage - 1); }}
            disabled={currentPage === 1}
            className={currentPage === 1 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          />
        </PaginationItem>

        {/* Render danh sách số trang đã tính toán */}
        {getPageNumbers().map((pageNumber) => (
          <PaginationItem key={pageNumber}>
            <PaginationLink
              href="#"
              onClick={(e) => { e.preventDefault(); onPageChange(pageNumber); }}
              isActive={currentPage === pageNumber}
              className="cursor-pointer"
            >
              {pageNumber}
            </PaginationLink>
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => { e.preventDefault(); onPageChange(currentPage + 1); }}
            disabled={currentPage === totalPages}
            className={currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

// ==========================
// 📰 Component: BlogPage (Trang Chính)
// ==========================
const BlogPage = () => {
  // ✅ Đổi tên state để rõ nghĩa: posts chứa TẤT CẢ bài viết
  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Cấu hình số lượng hiển thị (Client-side)
  const itemsPerPage = 9;

  // ✅ HÀM TẢI DỮ LIỆU: Tải HẾT về (limit lớn hoặc không gửi page)
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/blogs", {
        params: {
          // Bỏ 'page' để không phân trang ở server
          limit: 1000, // Lấy số lượng lớn để đảm bảo lấy hết
          status: "published"
        },
      });

      // Lưu tất cả dữ liệu vào state
      // Lưu ý: Kiểm tra xem API trả về mảng ở đâu (res.data hoặc res.data.posts)
      // Nếu API trả về dạng { posts: [...], totalPages: ... } thì dùng res.data.posts
      // Nếu API trả về mảng [...] luôn thì dùng res.data
      setAllPosts(res.data.posts || res.data || []);

    } catch (error) {
      console.error("❌ Lỗi khi tải bài viết:", error);
      toast.error("Không thể tải danh sách bài viết.");
      setAllPosts([]);
    } finally {
      setLoading(false);
    }
  }, []); // Chỉ chạy 1 lần khi mount

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // ✅ TÍNH TOÁN PHÂN TRANG (Client-side)
  // 1. Tính tổng số trang dựa trên tổng số bài đã tải về
  const totalPages = Math.ceil(allPosts.length / itemsPerPage);

  // 2. Cắt mảng để lấy ra các bài viết cho trang hiện tại
  const indexOfLastPost = page * itemsPerPage;
  const indexOfFirstPost = indexOfLastPost - itemsPerPage;
  const currentPosts = allPosts.slice(indexOfFirstPost, indexOfLastPost);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // --- Logic hiển thị nút phân trang (Giống trước) ---
  const getPageNumbers = () => {
    if (totalPages <= 1) return []; // Không cần hiện nếu chỉ có 1 trang
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  };

  // ==========================
  // JSX
  // ==========================
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header và Sidebar giữ nguyên... */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1250px] mx-auto px-4 py-6">
          {/* ... Breadcrumb ... */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/" className="text-orange-500 font-semibold hover:underline">Trang chủ</Link>
            <span>/</span>
            <span className="font-semibold text-gray-800">Tin tức</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1250px] mx-auto px-4 py-6">
        <div className="flex gap-6">
          <aside className="w-64 flex-shrink-0 hidden lg:block">
            <CategorySidebar /> {/* Nhớ import lại component này nếu tách file */}
          </aside>

          <main className="flex-1">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 uppercase border-l-4 border-orange-500 pl-4">
                Tin tức
              </h1>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-96">
                <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
              </div>
            ) : allPosts.length === 0 ? (
              <div className="text-center py-20 bg-white border border-gray-200">
                <p className="text-gray-500 text-lg">Chưa có bài viết nào.</p>
              </div>
            ) : (
              <>
                {/* ✅ Render currentPosts (đã cắt) thay vì posts */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
                  {currentPosts.map((post) => (
                    <BlogCard key={post._id} post={post} />
                    // Nhớ import BlogCard
                  ))}
                </div>

                {/* ✅ Pagination Component */}
                {totalPages > 1 && (
                  <Pagination className="mt-8">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => { e.preventDefault(); handlePageChange(page - 1) }}
                          className={page === 1 ? "opacity-50 pointer-events-none" : "cursor-pointer"}
                        />
                      </PaginationItem>

                      {getPageNumbers().map((p) => (
                        <PaginationItem key={p}>
                          <PaginationLink
                            href="#"
                            isActive={page === p}
                            onClick={(e) => { e.preventDefault(); handlePageChange(p) }}
                            className="cursor-pointer"
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => { e.preventDefault(); handlePageChange(page + 1) }}
                          className={page === totalPages ? "opacity-50 pointer-events-none" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default BlogPage;