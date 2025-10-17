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

const CartPage = () => {
  
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState(null); 
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 4;

  // Format tiền tệ
  const formatPrice = (price) => {
    return price?.toLocaleString("vi-VN") + "₫";
  };


  // ✅ Lấy giỏ hàng từ backend (ĐÃ SỬA LỖI MAPPING DỮ LIỆU)
  const fetchCart = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/cart");
      
      const rawCart = (data && data.items) ? data : { items: [] };

      // 🚨 ÁNH XẠ DỮ LIỆU TỪ BACKEND ĐỂ KHỚP VỚI FRONT-END
      const mappedItems = rawCart.items.map(item => ({
          // Backend dùng item.product._id, Front-end cần item.id
          id: item.product._id, 
          // Backend dùng item.qty, Front-end cần item.quantity
          quantity: item.qty, 
          // Lấy các trường cần thiết khác từ item.product
          name: item.product.name, 
          price: item.price, // Giá đã lưu trong giỏ hàng (giá cuối cùng)
          image: item.product.images && item.product.images.length > 0 ? item.product.images[0] : "/placeholder.png", // Lấy ảnh đầu tiên
          stock: item.product.stock, // Tồn kho cho việc kiểm tra cập nhật
      }));
      
      setCartItems(mappedItems);
    } catch (error) {
      console.error("Lỗi khi tải giỏ hàng:", error);
      toast.error("Không thể tải giỏ hàng.", {
          description: error.response?.data?.message || "Vui lòng kiểm tra lại kết nối và đăng nhập.",
      });
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // ✅ Cập nhật số lượng
  const updateQuantity = async (id, newQty) => {
    const item = cartItems.find(i => i.id === id);
    if (!item) return;

    if (newQty < 1) {
      removeItem(id); 
      return;
    }
    
    const maxStock = item.stock || 999; 

    if (newQty > maxStock) {
      toast.warning("Vượt quá giới hạn tồn kho!", {
          description: `Chỉ còn ${maxStock} sản phẩm ${item.name} trong kho.`,
      });
      return;
    }

    setUpdatingItemId(id); 
    try {
      // Backend dùng tham số URL là productId và payload là qty
      await api.put(`/cart/${id}`, { qty: newQty }); 
      
      setCartItems((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, quantity: newQty } : i
        )
      );
      toast.success("Cập nhật số lượng thành công!");

    } catch (error) {
      console.error("Lỗi khi cập nhật số lượng:", error);
      toast.error("Cập nhật số lượng thất bại.", {
          description: error.response?.data?.message || "Đã xảy ra lỗi hệ thống.",
      });
    } finally {
      setUpdatingItemId(null); 
    }
  };

  // ✅ Xóa sản phẩm khỏi giỏ
  const removeItem = async (id) => {
    const item = cartItems.find(i => i.id === id);
    if (!item) return;
    
    setUpdatingItemId(id); 
    try {
      // Backend dùng tham số URL là productId
      await api.delete(`/cart/${id}`); 
      
      setCartItems((prev) => prev.filter((i) => i.id !== id));
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
  };

  // ✅ Phân trang
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

      {loading ? (
        <p className="text-center py-10 flex justify-center items-center text-lg text-gray-600">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Đang tải giỏ hàng...
        </p>
      ) : totalItems === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-lg">
          <p className="text-lg text-gray-600">Giỏ hàng của bạn đang trống.</p>
          <Button className="mt-6 cursor-pointer bg-blue-600 hover:bg-blue-700">
            {/* Sử dụng <Link> đã được import */}
            <Link to="/">Tiếp tục mua sắm</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Danh sách sản phẩm */}
          <div className="lg:col-span-2 space-y-6">
            {currentItems.map((item) => {
                const isUpdating = updatingItemId === item.id;
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
                                disabled={isUpdating || item.quantity <= 1}
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
            )})}

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
            <Button className="w-full mt-6 bg-blue-600 hover:bg-blue-700">
              <Link to="/cart/checkout">Tiến hành thanh toán</Link>
            </Button>
            <Button variant="outline" className="w-full mt-3 cursor-pointer border-blue-600 text-blue-600 hover:bg-blue-50">
              <Link to="/">Tiếp tục mua sắm</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;