import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "@/lib/axios"; // ✅ dùng axios instance đã cấu hình baseURL
import ProductCard from "@/components/ProductCard";

const SearchPage = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const query = queryParams.get("query") || "";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // ✅ Gọi API từ backend (http://localhost:5000/api/products)
        const { data } = await api.get(`/products?search=${encodeURIComponent(query)}`);

        // ✅ Đảm bảo luôn là mảng
        const safeData = Array.isArray(data) ? data : data?.data || [];
        setProducts(safeData);
      } catch (error) {
        console.error("Search error:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    if (query) fetchProducts();
  }, [query]);

  return (
    <div className="px-4 md:px-[100px] py-6">
      <h1 className="text-2xl font-semibold mb-4">
        Kết quả tìm kiếm cho: "{query}"
      </h1>

      {loading ? (
        <p>Đang tải...</p>
      ) : products.length === 0 ? (
        <p>Không tìm thấy sản phẩm nào.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
