import React, { useEffect, useState, useCallback } from "react";
import api from "@/lib/axios";
import { useNavigate, Link } from "react-router-dom"; // ✅ Thêm Link
import { Loader2, ChevronLeft, ChevronRight, List } from "lucide-react"; // ✅ Thêm List
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { toast } from 'sonner';

// ==========================
// 🧱 Component: BlogCard (Hiển thị 1 bài blog)
// (Giữ nguyên logic của bạn)
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
          src={post.featuredImage?.url || "/placeholder.png"} // Sửa lại placeholder
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
// 🧱 Component: CategorySidebar (ĐÃ SỬA: Lấy dữ liệu động)
// ==========================
const CategorySidebar = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Tải danh mục sản phẩm (giống Navbar)
  useEffect(() => {
    const fetchProductCategories = async () => {
      try {
        // Gọi API lấy danh mục (giống như Navbar)
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
  }, []); // Chỉ chạy 1 lần

  // Hàm điều hướng khi nhấn vào danh mục
  const handleCategoryClick = (slug) => {
    navigate(`/category/${slug}`);
  };

  return (
    <div className="bg-white border border-gray-200">
      <div className="bg-orange-500 text-white px-4 py-3">
        <h2 className="text-base font-bold flex items-center gap-2">
          <List className="w-4 h-4" /> {/* Icon */}
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
            // Điều hướng đến trang /category/slug
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
// 🧱 Component: Pagination (Đã sửa đổi để dùng component Shadcn)
// ==========================
const PaginationComponent = ({ currentPage, totalPages, onPageChange }) => {
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

        {/* Tạo các nút số trang (Logic cơ bản) */}
        {Array.from({ length: totalPages }).map((_, i) => (
          <PaginationItem key={i}>
            <PaginationLink
              href="#"
              onClick={(e) => { e.preventDefault(); onPageChange(i + 1); }}
              isActive={currentPage === i + 1}
              className="cursor-pointer"
            >
              {i + 1}
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
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 12;

  // ✅ Dùng useCallback để tối ưu hóa việc gọi API
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      // Gọi API public (không cần JWT)
      const res = await api.get("/blogs", {
        params: {
          page,
          limit,
          status: "published"
          // ❗️ Ghi chú: Logic lọc theo category (activeCategory) đã bị xóa
          // vì nó đang lọc bài viết (Blog) theo danh mục sản phẩm (Product)
        },
      });

      setPosts(res.data.posts || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      console.error("❌ Lỗi khi tải bài viết:", error);
      toast.error("Không thể tải danh sách bài viết.");
      setPosts([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, limit]); // Chỉ phụ thuộc vào page và limit

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]); // Gọi hàm đã được bọc trong useCallback


  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ==========================
  // JSX
  // ==========================
  return (
    <div className="bg-gray-50 min-h-screen">
  {/* --- Header --- */}
  <div className="bg-white border-b border-gray-200">
    <div className="max-w-[1250px] mx-auto px-4 py-6">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Link to="/" className="text-orange-500 font-semibold hover:underline">
          🏠 Trang chủ
        </Link>
        <span>/</span>
        <span className="font-semibold text-gray-800">Tin tức</span>
      </div>
    </div>
  </div>

  {/* --- Main Content --- */}
  <div className="max-w-[1250px] mx-auto px-4 py-6">
    <div className="flex gap-6  ">
      {/* Sidebar (Tải danh mục sản phẩm động) */}
      <aside className="w-64 flex-shrink-0 hidden lg:block">
        <CategorySidebar/>
      </aside>

      {/* Content Area (Tin tức nằm bên phải) */}
      <main className="flex-1">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 uppercase border-l-4 border-orange-500 pl-4">
            Tin tức
          </h1>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 bg-white border border-gray-200">
            <p className="text-gray-500 text-lg">
              Chưa có bài viết nào được đăng.
            </p>
          </div>
        ) : (
          <>
            {/* Grid Layout */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {posts.map((post) => (
                <BlogCard key={post._id} post={post} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <PaginationComponent
                currentPage={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
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