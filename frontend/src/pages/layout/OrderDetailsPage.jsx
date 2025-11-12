import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import api from '@/lib/axios'; // Import axios instance của bạn
import { Loader2, Package, MapPin, DollarSign, Clock, MessageSquare, XCircle, ChevronLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

// Helper Functions
const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
const formatDate = (dateString) => new Date(dateString).toLocaleString('vi-VN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const getStatusBadge = (status) => {
    const statuses = {
        'pending': { text: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
        'processing': { text: 'Đang xử lý', color: 'bg-blue-100 text-blue-800 border-blue-300' },
        'shipped': { text: 'Đang giao', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
        'delivered': { text: 'Đã giao hàng', color: 'bg-green-100 text-green-800 border-green-300' },
        'cancelled': { text: 'Đã hủy', color: 'bg-red-100 text-red-800 border-red-300' },
    };
    const badge = statuses[status] || statuses['pending'];
    return <span className={`px-3 py-1 rounded-full text-sm font-medium border ${badge.color}`}>{badge.text}</span>;
};

const OrderDetailsPage = () => {
    const { id } = useParams(); // Lấy ID đơn hàng từ URL
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrder = async () => {
            if (!id) {
                setLoading(false);
                return;
            }
            try {
                // Gọi API GET /api/orders/:id (Đã dùng optionalProtect)
                const { data } = await api.get(`/orders/${id}`);
                setOrder(data);
            } catch (err) {
                setError(err.response?.data?.message || "Lỗi không xác định khi tải đơn hàng.");
                toast.error(err.response?.data?.message || "Không thể tải chi tiết đơn hàng.");
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [id, navigate]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-black" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="text-center py-16">
                <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold mb-2">{error || "Lỗi: Không tìm thấy đơn hàng"}</h1>
                <Button asChild className="mt-4">
                    <Link to="/my-orders">Quay lại danh sách đơn hàng</Link>
                </Button>
            </div>
        );
    }

    const shortId = order._id.substring(0, 8);
    const shippingAddress = order.shippingAddress || {};

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
            <Button onClick={() => navigate(-1)} variant="ghost" className="mb-4 text-gray-600 hover:text-black">
                <ChevronLeft className="w-5 h-5 mr-1" /> Quay lại
            </Button>
            <div className="flex justify-between items-center mb-6 border-b pb-2">
                <h1 className="text-3xl font-extrabold text-gray-800">Chi Tiết Đơn Hàng #{shortId}</h1>
                {getStatusBadge(order.orderStatus)}
            </div>

            {/* Thông tin cơ bản */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Cột 1: Thông tin người dùng/thời gian */}
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                    <h2 className="text-xl font-semibold mb-3 flex items-center gap-2 text-gray-700"><Clock className="w-5 h-5" /> Thời gian</h2>
                    <p className="text-sm"><strong>Đặt hàng:</strong> {formatDate(order.createdAt)}</p>

                    {/* ✅ FIX 1: KIỂM TRA 'order.user' TRƯỚC KHI TRUY CẬP (ĐỂ HỖ TRỢ GUEST) */}
                    {order.user ? (
                        <p className="text-sm"><strong>Người đặt:</strong> {order.user.username || 'N/A'} ({order.user.email})</p>
                    ) : (
                        <p className="text-sm"><strong>Người đặt:</strong> Khách vãng lai</p>
                    )}

                    <p className="text-sm"><strong>Thanh toán:</strong> <span className={order.isPaid ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>{order.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}</span></p>
                </div>

                {/* Cột 2: Địa chỉ giao hàng (Giữ nguyên) */}
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                    <h2 className="text-xl font-semibold mb-3 flex items-center gap-2 text-gray-700"><MapPin className="w-5 h-5" /> Giao hàng</h2>
                    <p className="text-sm"><strong>Người nhận:</strong> {shippingAddress.name || shippingAddress.fullName}</p>
                    <p className="text-sm"><strong>SĐT:</strong> {shippingAddress.phone}</p>
                    <p className="text-sm"><strong>Địa chỉ:</strong> {shippingAddress.address}, {shippingAddress.city}</p>
                </div>

                {/* Cột 3: Trạng thái thanh toán (Giữ nguyên) */}
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                    <h2 className="text-xl font-semibold mb-3 flex items-center gap-2 text-gray-700"><DollarSign className="w-5 h-5" /> Thanh toán</h2>
                    <p className="text-sm"><strong>Phương thức:</strong> {order.paymentMethod}</p>
                    <p className="text-sm"><strong>Tình trạng:</strong> <span className={order.isPaid ? "text-green-600 font-bold" : "text-red-600 font-bold"}>{order.isPaid ? 'ĐÃ THANH TOÁN' : 'CHƯA THANH TOÁN'}</span></p>
                    {order.paymentResult?.id && <p className="text-xs text-gray-500 mt-1">Mã GD: {order.paymentResult.id}</p>}
                </div>
            </div>

            {/* THÔNG TIN GHI CHÚ (Giữ nguyên) */}
            {order.note && (
                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 mb-8">
                    <h3 className="font-semibold text-orange-700 mb-2 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" /> Ghi chú của Khách hàng
                    </h3>
                    <p className="text-sm text-orange-900 italic">{order.note}</p>
                </div>
            )}

            {/* Chi tiết sản phẩm và tổng tiền */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                <h2 className="text-xl font-semibold mb-4 border-b pb-2 flex items-center gap-2 text-gray-700"><Package className="w-5 h-5" /> Sản phẩm</h2>

                {/* Danh sách sản phẩm (Giữ nguyên) */}
                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-3">
                    {order.orderItems.map((item, index) => (
                        <div key={index} className="flex items-center justify-between border-b last:border-b-0 pb-3">
                            <div className="flex items-center gap-4">
                                <img
                                    src={item.product?.images?.[0] || item.images?.[0] || '/images/no-image.jpg'}
                                    alt={item.product?.name || item.name}
                                    className="w-16 h-16 object-cover rounded-md border"
                                />
                                <div>
                                    <p className="font-medium text-gray-800">{item.product?.name || item.name}</p>
                                    <p className="text-sm text-gray-500">SL: {item.qty} x {formatCurrency(item.price)}</p>
                                </div>
                            </div>
                            <span className="font-semibold text-lg">{formatCurrency(item.price * item.qty)}</span>
                        </div>
                    ))}
                </div>

                {/* Tóm tắt giá */}
                <Separator className="my-4" />
                <div className="space-y-2 text-md max-w-sm ml-auto">
                    <div className="flex justify-between">
                        <span>Tổng tiền hàng:</span>
                        <span className="font-medium">{formatCurrency(order.itemsPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Phí vận chuyển:</span>
                        <span className="font-medium">{formatCurrency(order.shippingPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Thuế (VAT):</span>
                        <span className="font-medium">{formatCurrency(order.taxPrice)}</span>
                    </div>

                    {/* ✅ FIX 2: THÊM DÒNG GIẢM GIÁ */}
                    {order.discountAmount > 0 && (
                        <div className="flex justify-between text-green-600">
                            <span>Giảm giá (Voucher):</span>
                            <span className="font-medium">-{formatCurrency(order.discountAmount)}</span>
                        </div>
                    )}

                    <Separator />
                    <div className="flex justify-between text-xl pt-2">
                        <span className="font-bold">TỔNG THANH TOÁN:</span>
                        {/* ✅ FIX 3: SỬA THÀNH finalTotal */}
                        <span className="font-bold text-red-600">{formatCurrency(order.finalTotal)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailsPage;