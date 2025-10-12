import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "@/lib/axios"; // ✅ dùng axios instance đã cấu hình baseURL
import ProductCard from "@/components/ProductCard";
import { Loader2 } from "lucide-react"; // Thêm icon loading

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
        // ✅ Gọi API từ backend 
        const { data } = await api.get(`/products?search=${encodeURIComponent(query)}`);

        // 🚨 ĐÃ TỐI ƯU: Truy cập mảng sản phẩm qua khóa 'products' từ cấu trúc Backend { products: [...] }
        const safeData = Array.isArray(data.products) ? data.products : [];

        // Nếu API trả về mảng trực tiếp (trường hợp cũ), ta cũng xử lý được.
        if (Array.isArray(data) && !data.products) {
          setProducts(data);
        } else {
          setProducts(safeData);
        }

      } catch (error) {
        console.error("Search error:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    if (query) fetchProducts();
    else setProducts([]); // Xóa kết quả nếu query rỗng
  }, [query]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:px-8">
      <h1 className="text-2xl font-semibold mb-6 border-b pb-2">
        Kết quả tìm kiếm cho: "<span className="text-blue-600 font-bold">{query}</span>"
      </h1>

      {loading ? (
        <p className="text-center text-lg text-gray-600 py-12 flex justify-center items-center">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Đang tải sản phẩm...
        </p>
      ) : products.length === 0 ? (
        <p className="text-center text-lg text-gray-500 py-12">
          Không tìm thấy sản phẩm nào khớp với từ khóa của bạn.
        </p>
      ) : (
        <div>
          <p className="text-sm text-gray-600 mb-4">Tìm thấy <span className="font-semibold">{products.length}</span> kết quả:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage;