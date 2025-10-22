import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { Loader2, Package, Eye, XCircle } from 'lucide-react'; // Import XCircle
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Hàm hiển thị trạng thái (Giữ nguyên)
const getStatusBadge = (status) => {
  const statuses = {
    'pending': { text: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-800' },
    'processing': { text: 'Đang xử lý', color: 'bg-blue-100 text-blue-800' },
    'shipped': { text: 'Đang giao', color: 'bg-indigo-100 text-indigo-800' },
    'delivered': { text: 'Đã giao hàng', color: 'bg-green-100 text-green-800' },
    'cancelled': { text: 'Đã hủy', color: 'bg-red-100 text-red-800' },
  };
  const badge = statuses[status] || statuses['pending'];
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>{badge.text}</span>;
};

const MyOrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Lấy fetchOrders ra ngoài để có thể gọi lại sau khi hủy
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/orders/my');
      setOrders(data);
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Vui lòng đăng nhập để xem đơn hàng.");
        navigate('/account/login');
      } else {
        toast.error("Không thể tải danh sách đơn hàng.");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);


  // ✅ HÀM HỦY ĐƠN HÀNG MỚI
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm(`Bạn có chắc chắn muốn hủy đơn hàng #${orderId.substring(0, 8)}...?`)) {
      return;
    }

    try {
      // Gọi route PUT /api/orders/:id/cancel
      await api.put(`/orders/${orderId}/cancel`);
      toast.success("Đơn hàng đã được hủy thành công!");
      fetchOrders(); // Tải lại danh sách
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể hủy đơn hàng.");
    }
  };


  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]); // Phụ thuộc vào fetchOrders

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-6 border-b pb-2">Đơn hàng của tôi</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16 border rounded-lg bg-white shadow-sm">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Bạn chưa có đơn hàng nào.</p>
          <Button asChild className="mt-6">
            <Link to="/">Tiếp tục mua sắm</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order._id} className="bg-white p-4 sm:p-6 rounded-lg shadow-md border">

              <div className="flex justify-between items-center border-b pb-3 mb-3">
                <div>
                  <p className="text-sm text-gray-500">Mã đơn hàng</p>
                  <p className="font-semibold text-lg">#{order._id.substring(0, 8)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Trạng thái</p>
                  {getStatusBadge(order.orderStatus)}
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>Ngày đặt:</strong> {formatDate(order.createdAt)}</p>
                <p><strong>Tổng cộng:</strong> <span className="font-bold text-red-600">{formatCurrency(order.totalPrice)}</span></p>
                <p><strong>Thanh toán:</strong> {order.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'} ({order.paymentMethod})</p>
              </div>

              <Separator className="my-3" />

              <div className="flex justify-between items-center pt-2">
                <p className="text-xs text-gray-500">{order.orderItems.length} sản phẩm</p>
                <div className="flex items-center space-x-2">
                  {/* ✅ NÚT HỦY ĐƠN (CHỈ HIỂN THỊ KHI TRẠNG THÁI LÀ PENDING) */}
                  {order.orderStatus === 'pending' && (
                    <Button
                      onClick={() => handleCancelOrder(order._id)}
                      variant="destructive"
                      size="sm"
                      className="flex items-center gap-1 bg-red-600 hover:bg-red-700"
                    >
                      <XCircle className="w-4 h-4" /> Hủy đơn
                    </Button>
                  )}

                  <Button asChild variant="outline" size="sm">
                    <Link to={`/order/${order._id}`} className="flex items-center gap-1">
                      Xem chi tiết <Eye className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrdersPage;