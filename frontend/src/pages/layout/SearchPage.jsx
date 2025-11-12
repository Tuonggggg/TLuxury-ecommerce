import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom"; // [GUEST] Import useNavigate
import api from "@/lib/axios";
import ProductCard from "@/components/ProductCard";
import { Loader2 } from "lucide-react";
import { toast } from "sonner"; // [GUEST] Import toast

// [GUEST] 1. Import Redux
import { useDispatch, useSelector } from "react-redux";
import { addToGuestCart } from "@/store/slices/cartSlice";

const SearchPage = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const query = queryParams.get("query") || "";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState({}); // [GUEST] 3. Thêm state loading giỏ hàng

  // [GUEST] 4. Khởi tạo Redux
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/products?search=${encodeURIComponent(query)}`);
        const safeData = Array.isArray(data.products) ? data.products : [];

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
    else setProducts([]);
  }, [query]);

  // =======================================================
  // [GUEST] 5. HÀM ADD TO CART "THÔNG MINH"
  // =======================================================
  const handleAddToCart = async (productToAdd, qty = 1) => {
    const productId = productToAdd._id;

    if (productToAdd.stock === 0) {
      toast.error(`"${productToAdd.name}" đã hết hàng.`);
      return;
    }

    setIsAddingToCart(prev => ({ ...prev, [productId]: true }));

    try {
      // [GUEST] Phân luồng
      if (userInfo) {
        // ----- LOGIC CHO USER (API) -----
        const payload = { productId: productId, qty: qty };
        await api.post("/cart", payload);
      } else {
        // ----- LOGIC CHO KHÁCH (REDUX) -----
        dispatch(addToGuestCart({ product: productToAdd, qty: qty }));
      }

      // Cập nhật tồn kho (Stock - qty) trên FE
      setProducts(prevProducts => prevProducts.map(p =>
        p._id === productId ? { ...p, stock: p.stock - qty } : p
      ));

    } catch (error) {
      const errorMessage = error.response?.data?.message || "Lỗi kết nối hoặc phiên đăng nhập đã hết hạn.";
      toast.error("Thêm vào giỏ hàng thất bại.", { description: errorMessage });
    } finally {
      setIsAddingToCart(prev => ({ ...prev, [productId]: false }));
    }
  };


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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-4 md:gap-6">
            {products.map((product) => (
              // [GUEST] 6. Truyền props vào ProductCard
              <ProductCard
                key={product._id}
                product={product}
                onAddToCart={handleAddToCart}
                isPending={!!isAddingToCart[product._id]}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage;