import { useEffect, useState } from "react";
import HeroSlider from "@/components/HeroSilder";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// [GUEST] Import hooks từ Redux
import { useDispatch, useSelector } from "react-redux";
// [GUEST] Import action từ cartSlice
// (Đảm bảo đường dẫn này chính xác với cấu trúc thư mục của bạn)
import { addToGuestCart } from "@/store/slices/cartSlice";

const HOME_CATEGORIES = [
  { slug: "phong-khach", title: "Phòng Khách" },
  { slug: "phong-bep", title: "Phòng Bếp" },
  { slug: "phong-ngu", title: "Phòng Ngủ" },
  { slug: "ngoai-troi", title: "Sân vườn - Ngoài trời" },
  { slug: "nha-hang-cafe", title: "Nhà hàng - Cafe" },
  { slug: "van-phong", title: "Văn phòng" },
];

const SectionHeader = ({ title, onViewAll }) => (
  <div className="flex justify-between items-center border-b pb-3 mb-6">
    <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
    {onViewAll && (
      <Button variant="outline" size="sm" className="rounded-full" onClick={onViewAll}>
        Xem tất cả
      </Button>
    )}
  </div>
);

const HomePage = () => {
  const navigate = useNavigate();
  const [categorizedProducts, setCategorizedProducts] = useState({});
  const [flashSaleProducts, setFlashSaleProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState({});

  // [GUEST] Lấy dispatch và trạng thái đăng nhập từ Redux
  const dispatch = useDispatch();
  // (Giả sử slice của bạn tên là 'auth')
  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const newProducts = {};

        const flashSalePromise = api
          .get(`/products`, {
            params: { isSale: "true", limit: 8 },
          })
          .then((res) => {
            const rawSale = res.data.products || [];
            setFlashSaleProducts(rawSale);
            return rawSale;
          });

        const categoryPromises = HOME_CATEGORIES.map(async (cat) => {
          const res = await api.get(`/products`, { params: { category: cat.slug, limit: 8 } });
          newProducts[cat.slug] = res.data.products || res.data.data || [];
        });

        await Promise.all([flashSalePromise, ...categoryPromises]);
        setCategorizedProducts(newProducts);
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu trang chủ:", error);
        toast.error("Không thể tải sản phẩm. Vui lòng kiểm tra API /products.");
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const getProductsBySlug = (slug) => categorizedProducts[slug] || [];

  // =======================================================
  // [GUEST] HÀM handleAddToCart ĐÃ ĐƯỢC CẬP NHẬT
  // =======================================================
  const handleAddToCart = async (productToAdd) => {
    const productId = productToAdd._id;

    if (productToAdd.stock === 0) {
      toast.error(`"${productToAdd.name}" đã hết hàng.`);
      return;
    }

    setIsAddingToCart((prev) => ({ ...prev, [productId]: true }));

    try {
      // [GUEST] KIỂM TRA XEM USER ĐÃ ĐĂNG NHẬP HAY CHƯA
      if (userInfo) {
        // ----- TRƯỜNG HỢP 1: USER ĐÃ ĐĂNG NHẬP (Logic cũ) -----
        const payload = {
          productId: productId,
          qty: 1,
        };
        // Gọi API để lưu vào giỏ hàng DB
        await api.post("/cart", payload);

        toast.success(`Đã thêm vào giỏ hàng!`, {
          description: `1 x ${productToAdd.name} đã được thêm thành công.`,
          action: {
            label: "Xem giỏ",
            onClick: () => navigate("/cart"),
          },
        });

        // Cập nhật stock ở UI (tạm thời)
        setFlashSaleProducts((prevProducts) =>
          prevProducts.map((p) => (p._id === productId ? { ...p, stock: p.stock - 1 } : p))
        );
        setCategorizedProducts((prevCategories) => {
          const newCategories = { ...prevCategories };
          for (const slug in newCategories) {
            newCategories[slug] = newCategories[slug].map((p) =>
              p._id === productId ? { ...p, stock: p.stock - 1 } : p
            );
          }
          return newCategories;
        });
      } else {
        // ----- TRƯỜNG HỢP 2: KHÁCH VÃNG LAI (Logic mới) -----
        // Gọi action Redux, action này sẽ tự xử lý logic
        // (kiểm tra tồn kho, giới hạn mua, lưu vào localStorage)
        dispatch(addToGuestCart({ product: productToAdd, qty: 1 }));
      }
    } catch (error) {
      // Catch lỗi (chỉ xảy ra nếu user đăng nhập và api.post thất bại)
      console.error("Lỗi khi thêm vào giỏ hàng:", error);
      const errorMessage = error.response?.data?.message || "Lỗi kết nối hoặc phiên đăng nhập đã hết hạn.";
      toast.error("Thêm vào giỏ hàng thất bại.", { description: errorMessage });
    } finally {
      // Tắt loading cho dù thành công hay thất bại
      setIsAddingToCart((prev) => ({ ...prev, [productId]: false }));
    }
  };

  // ✅ CẬP NHẬT ProductCarousel Component (Không đổi)
  const ProductCarousel = ({ products, onAddToCart, isAddingToCart }) => {
    const showArrows = products.length > 3;

    return (
      <div className="relative px-8 md:px-10 group">
        <Carousel
          opts={{
            align: "start",
            loop: showArrows,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-6">
            {products.map((p) => (
              <CarouselItem
                key={p._id}
                className="pl-6 basis-1/2 sm:basis-1/3"
              >
                <ProductCard
                  product={p}
                  onAddToCart={onAddToCart}
                  isPending={!!isAddingToCart[p._id]}
                />
              </CarouselItem>
            ))}
          </CarouselContent>

          {showArrows && (
            <>
              <CarouselPrevious
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10
                           opacity-0 group-hover:opacity-100 transition-opacity duration-300
                           hidden sm:inline-flex w-10 h-10 rounded-full bg-white border border-gray-300 shadow-md
                           hover:bg-gray-100 hover:border-gray-400"
              />
              <CarouselNext
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10
                           opacity-0 group-hover:opacity-100 transition-opacity duration-300
                           hidden sm:inline-flex w-10 h-10 rounded-full bg-white border border-gray-300 shadow-md
                           hover:bg-gray-100 hover:border-gray-400"
              />
            </>
          )}
        </Carousel>
      </div>
    );
  };

  return (
    <>
      <div className="min-h-screen w-full bg-white relative">
        {/* ... (Nền lưới) ... */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(45deg, transparent 49%, #e5e7eb 49%, #e5e7eb 51%, transparent 51%),
            linear-gradient(-45deg, transparent 49%, #e5e7eb 49%, #e5e7eb 51%, transparent 51%)`,
            backgroundSize: "40px 40px",
          }}
        />

        <HeroSlider />

        <main className="py-12 relative z-20">
          <div className="max-w-[1250px] mx-auto px-4 space-y-16">
            {loading ? (
              // ... (Loading spinner) ...
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <p className="ml-3 text-lg text-gray-600">Đang tải sản phẩm...</p>
              </div>
            ) : (
              <>
                {/* FLASH SALE */}
                {flashSaleProducts.length > 0 && (
                  <section className="bg-gradient-to-r from-red-500 to-orange-400 rounded-xl p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-white">🔥 Flash Sale</h2>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="rounded-full"
                        onClick={() => navigate("/category/flashsale")}
                      >
                        Xem tất cả
                      </Button>
                    </div>

                    <ProductCarousel
                      products={flashSaleProducts}
                      onAddToCart={handleAddToCart}
                      isAddingToCart={isAddingToCart}
                    />
                  </section>
                )}

                {/* PHÒNG KHÁCH */}
                <section>
                  <SectionHeader title="Phòng khách" onViewAll={() => navigate("/category/phong-khach")} />
                  <ProductCarousel
                    products={getProductsBySlug("phong-khach")}
                    onAddToCart={handleAddToCart}
                    isAddingToCart={isAddingToCart}
                  />
                </section>

                {/* PHÒNG BẾP */}
                <section className="bg-gray-50 rounded-xl p-6">
                  <SectionHeader title="Phòng bếp" onViewAll={() => navigate("/category/phong-bep")} />
                  <ProductCarousel
                    products={getProductsBySlug("phong-bep")}
                    onAddToCart={handleAddToCart}
                    isAddingToCart={isAddingToCart}
                  />
                </section>

                {/* PHÒNG NGỦ */}
                <section>
                  <SectionHeader title="Phòng ngủ" onViewAll={() => navigate("/category/phong-ngu")} />
                  <ProductCarousel
                    products={getProductsBySlug("phong-ngu")}
                    onAddToCart={handleAddToCart}
                    isAddingToCart={isAddingToCart}
                  />
                </section>

                {/* SÂN VƯỜN - NGOÀI TRỜI */}
                <section className="bg-green-50 rounded-xl p-6">
                  <SectionHeader title="Sân vườn - Ngoài trời" onViewAll={() => navigate("/category/ngoai-troi")} />
                  <ProductCarousel
                    products={getProductsBySlug("ngoai-troi")}
                    onAddToCart={handleAddToCart}
                    isAddingToCart={isAddingToCart}
                  />
                </section>

                {/* NHÀ HÀNG - CAFE */}
                <section>
                  <SectionHeader title="Nhà hàng - Cafe" onViewAll={() => navigate("/category/nha-hang-cafe")} />
                  <ProductCarousel
                    products={getProductsBySlug("nha-hang-cafe")}
                    onAddToCart={handleAddToCart}
                    isAddingToCart={isAddingToCart}
                  />
                </section>

                {/* VĂN PHÒNG */}
                <section className="bg-gray-50 rounded-xl p-6">
                  <SectionHeader title="Văn phòng" onViewAll={() => navigate("/category/van-phong")} />
                  <ProductCarousel
                    products={getProductsBySlug("van-phong")}
                    onAddToCart={handleAddToCart}
                    isAddingToCart={isAddingToCart}
                  />
                </section>
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default HomePage;