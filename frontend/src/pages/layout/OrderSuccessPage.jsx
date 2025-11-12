import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/axios'; // Import axios instance của bạn

const OrderSuccessPage = () => {
    // Lấy orderId từ URL
    const { orderId } = useParams(); 
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            if (!orderId) {
                setLoading(false);
                return;
            }
            try {
                // Gọi API để lấy thông tin đơn hàng
                const { data } = await api.get(`/orders/${orderId}`);
                setOrder(data);
            } catch (error) {
                console.error("Không thể tải đơn hàng:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderId]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
            <CheckCircle2 className="w-16 h-16 text-green-500 mb-6" />
            <h1 className="text-3xl font-bold mb-4">Đặt hàng thành công!</h1>
            
            {loading ? (
                <p className="text-gray-600">Đang tải thông tin đơn hàng...</p>
            ) : order ? (
                <>
                    <p className="text-lg text-gray-700 mb-2">
                        Cảm ơn bạn đã mua hàng. Đơn hàng của bạn đã được ghi nhận.
                    </p>
                    <p className="text-gray-600 mb-8">
                        Mã đơn hàng của bạn là: 
                        <span className="font-semibold text-gray-900 ml-2">#{order._id}</span>
                    </p>
                    <div className="flex gap-4">
                        <Button asChild variant="outline">
                            <Link to="/my-orders">Xem đơn hàng</Link>
                        </Button>
                        <Button asChild>
                            <Link to="/">Tiếp tục mua sắm</Link>
                        </Button>
                    </div>
                </>
            ) : (
                <p className="text-primary">Vui lòng kiểm tra email để xem chi tiết.</p>
            )}
        </div>
    );
};

export default OrderSuccessPage;