// src/pages/CartPage.jsx (ĐÃ CẬP NHẬT HOÀN CHỈNH)
import React, { useState, useEffect } from "react";
import { Trash2, Plus, Minus, ShoppingBag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Link } from "react-router-dom";
import api from "@/lib/axios";
import { toast } from "sonner";

// [GUEST] Import hooks và actions từ Redux
import { useSelector, useDispatch } from "react-redux";
import {
  setCartFromAPI,
  updateGuestCartQty,
  removeGuestCartItem,
} from "@/store/slices/cartSlice"; // <-- Đảm bảo đường dẫn đúng

const CartPage = () => {
  // [GUEST] Lấy state từ Redux
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);
  const { cartItems } = useSelector((state) => state.cart);

  // [GUEST] 'loading' giờ dùng cho API, 'updatingItemId' dùng cho cả 2
  const [loading, setLoading] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 4;

  // Format tiền tệ
  const formatPrice = (price) => {
    return price?.toLocaleString("vi-VN") + "₫";
  };

  // ✅ Lấy giỏ hàng
  useEffect(() => {
    const fetchCart = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/cart");
        const rawCart = (data && data.items) ? data : { items: [] };

        // 🚨 ÁNH XẠ DỮ LIỆU TỪ BACKEND
        const mappedItems = rawCart.items.map(item => ({
          id: item.product._id,
          quantity: item.qty,
          name: item.product.name,
          price: item.price, // Giá đã lưu trong giỏ hàng
          image: item.product.images && item.product.images.length > 0 ? item.product.images[0] : "/placeholder.png",
          stock: item.product.stock,
        }));

        // [GUEST] Thay vì setCartItems, dispatch vào Redux
        dispatch(setCartFromAPI(mappedItems));
      } catch (error) {
        console.error("Lỗi khi tải giỏ hàng:", error);
        toast.error("Không thể tải giỏ hàng.", {
          description: error.response?.data?.message || "Vui lòng kiểm tra lại kết nối.",
        });
        // [GUEST] Nếu lỗi, dispatch giỏ hàng rỗng
        dispatch(setCartFromAPI([]));
      } finally {
        setLoading(false);
      }
    };

    // [GUEST] Chỉ gọi API nếu đã đăng nhập
    if (userInfo) {
      fetchCart();
    }
    // Nếu là khách, cartItems đã được nạp từ localStorage (bởi cartSlice)
  }, [userInfo, dispatch]); // Thêm userInfo và dispatch vào dependencies

  // Đồng bộ cartItems với localStorage cho guest
  useEffect(() => {
    if (!userInfo) {
      localStorage.setItem('guestCart', JSON.stringify(cartItems));
    }
  }, [cartItems, userInfo]);

  // ✅ Cập nhật số lượng (Hàm "thông minh")
  const updateQuantity = async (id, newQty) => {
    const item = cartItems.find(i => i.id === id);
    if (!item) return;

    if (newQty < 1) {
      removeItem(id); // Gọi hàm xóa nếu số lượng < 1
      return;
    }

    // [GUEST] Kiểm tra tồn kho ở local trước khi gọi
    const maxStock = item.stock || 999;
    if (newQty > maxStock) {
      toast.warning("Vượt quá giới hạn tồn kho!", {
        description: `Chỉ còn ${maxStock} sản phẩm ${item.name} trong kho.`,
      });
      return;
    }

    // [GUEST] Giới hạn mua (nếu có, ví dụ 5)
    const MAX_QTY_PER_ITEM = 5;
    if (newQty > MAX_QTY_PER_ITEM) {
      toast.warning(`Bạn chỉ có thể mua tối đa ${MAX_QTY_PER_ITEM} sản phẩm này.`);
      return;
    }

    setUpdatingItemId(id);

    if (userInfo) {
      // ----- LOGIC CHO USER (API) -----
      try {
        await api.put(`/cart/${id}`, { qty: newQty });
        // Cập nhật lại state bằng cách fetch lại
        const { data } = await api.get("/cart");
        const mappedItems = data.items.map(item => ({
          id: item.product._id, quantity: item.qty, name: item.product.name,
          price: item.price, image: item.product.images?.[0], stock: item.product.stock,
        }));
        dispatch(setCartFromAPI(mappedItems));
        toast.success("Cập nhật số lượng thành công!");
      } catch (error) {
        console.error("Lỗi khi cập nhật số lượng:", error);
        toast.error("Cập nhật số lượng thất bại.", {
          description: error.response?.data?.message || "Đã xảy ra lỗi.",
        });
      } finally {
        setUpdatingItemId(null);
      }
    } else {
      // ----- LOGIC CHO KHÁCH (REDUX) -----
      dispatch(updateGuestCartQty({ id, newQty }));
      // (toast.success/error đã được xử lý bên trong slice)
      setUpdatingItemId(null);
    }
  };

  // ✅ Xóa sản phẩm khỏi giỏ (Hàm "thông minh")
  const removeItem = async (id) => {
    const item = cartItems.find(i => i.id === id);
    if (!item) return;

    setUpdatingItemId(id);

    if (userInfo) {
      // ----- LOGIC CHO USER (API) -----
      try {
        await api.delete(`/cart/${id}`);
        // Cập nhật lại state
        const updatedItems = cartItems.filter((i) => i.id !== id);
        dispatch(setCartFromAPI(updatedItems)); // Tạm thời cập nhật UI
        toast.success(`Đã xóa "${item.name}" khỏi giỏ hàng.`);

        if (currentItems.length === 1 && currentPage > 1) {
          setCurrentPage(prev => prev - 1);
        }
      } catch (error) {
        console.error("Lỗi khi xóa sản phẩm:", error);
        toast.error("Xóa sản phẩm thất bại.", {
          description: error.response?.data?.message || "Vui lòng thử lại.",
        });
      } finally {
        setUpdatingItemId(null);
      }
    } else {
      // ----- LOGIC CHO KHÁCH (REDUX) -----
      dispatch(removeGuestCartItem(id));
      // (toast.success đã được xử lý bên trong slice)
      if (currentItems.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }
      setUpdatingItemId(null);
    }
  };

  // ✅ Phân trang
  // [GUEST] Nguồn dữ liệu giờ là 'cartItems' từ Redux
  const totalItems = cartItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = cartItems.slice(startIndex, startIndex + itemsPerPage);

  // ✅ Tổng tiền
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <ShoppingBag className="w-8 h-8 text-blue-600" /> Giỏ hàng của bạn
      </h1>

      {/* [GUEST] 'loading' chỉ áp dụng khi user đăng nhập,
          khách vãng lai luôn thấy giỏ hàng ngay lập tức */}
      {loading && userInfo ? (
        <p className="text-center py-10 flex justify-center items-center text-lg text-gray-600">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Đang tải giỏ hàng...
        </p>
      ) : totalItems === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-lg">
          <p className="text-lg text-gray-600">Giỏ hàng của bạn đang trống.</p>
          <Button asChild className="mt-6 cursor-pointer bg-blue-600 hover:bg-blue-700">
            <Link to="/">Tiếp tục mua sắm</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Danh sách sản phẩm */}
          <div className="lg:col-span-2 space-y-6">
            {currentItems.map((item) => {
              const isUpdating = updatingItemId === item.id;
              // [GUEST] Đảm bảo 'item' có 'stock' (slice mới đã đảm bảo)
              const maxStock = item.stock || 999;

              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-4 bg-white rounded-xl shadow-sm p-4 border transition-opacity ${isUpdating ? 'opacity-70' : ''}`}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-24 h-24 object-cover rounded-md border"
                  />
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold">{item.name}</h2>
                    <p className="text-red-600 font-bold">
                      {formatPrice(item.price)}
                    </p>

                    {/* Số lượng */}
                    <div className="flex items-center gap-3 mt-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={isUpdating} // [GUEST] Logic disabled < 1 đã chuyển vào hàm
                      >
                        <Minus size={16} />
                      </Button>
                      <span className="px-3 min-w-[30px] text-center font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={isUpdating || item.quantity >= maxStock}
                      >
                        <Plus size={16} />
                      </Button>
                      {isUpdating && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                    </div>
                  </div>

                  {/* Xóa sản phẩm */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                    disabled={isUpdating}
                  >
                    <Trash2 className="w-5 h-5 text-red-500 hover:text-red-700" />
                  </Button>
                </div>
              )
            })}

            {/* Phân trang */}
            {totalPages > 1 && (
              <Pagination className="mt-6">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        setCurrentPage((p) => Math.max(1, p - 1))
                      }
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        isActive={currentPage === i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        className="cursor-pointer"
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>

          {/* Thanh toán */}
          <div className="bg-white rounded-xl shadow-lg p-6 h-fit lg:sticky lg:top-20 border">
            <h2 className="text-xl font-bold mb-4">Tóm tắt đơn hàng ({totalItems} sản phẩm)</h2>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Tạm tính</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Phí vận chuyển</span>
              <span>Miễn phí</span>
            </div>
            <div className="border-t my-4"></div>
            <div className="flex justify-between font-bold text-xl">
              <span>Tổng cộng</span>
              <span className="text-blue-600">
                {formatPrice(totalPrice)}
              </span>
            </div>
            {/* [GUEST] Dùng <Link> bọc Button để điều hướng */}
            <Button asChild className="w-full mt-6 bg-blue-600 hover:bg-blue-700">
              {/* [GUEST] Dù là khách hay user đều đi đến trang checkout */}
              <Link to="/cart/checkout">Tiến hành thanh toán</Link>
            </Button>
            <Button asChild variant="outline" className="w-full mt-3 cursor-pointer border-blue-600 text-blue-600 hover:bg-blue-50">
              <Link to="/">Tiếp tục mua sắm</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;