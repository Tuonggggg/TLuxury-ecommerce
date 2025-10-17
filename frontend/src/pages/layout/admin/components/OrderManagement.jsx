import React, { useState, useEffect, useCallback } from 'react';
import { Package2, Loader2, ListFilter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import api from '@/lib/axios';

// Định nghĩa các trạng thái Đơn hàng (Khớp với DB)
const ORDER_STATUSES = [
    { value: 'all', label: 'Tất cả' },
    { value: 'pending', label: 'Chờ xác nhận', color: 'text-yellow-600 bg-yellow-100' },
    { value: 'processing', label: 'Đang xử lý', color: 'text-blue-600 bg-blue-100' },
    { value: 'shipping', label: 'Đang giao', color: 'text-purple-600 bg-purple-100' },
    { value: 'delivered', label: 'Đã giao', color: 'text-green-600 bg-green-100' },
    { value: 'cancelled', label: 'Đã hủy', color: 'text-red-600 bg-red-100' },
];

const OrderManagement = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 10; // Cố định 10 mục / trang

    const formatCurrency = (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                limit: itemsPerPage,
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
            };
            // Gọi route Admin GET /api/orders
            const res = await api.get('/orders', { params }); 

            setOrders(res.data.orders || []);
            setTotalPages(res.data.totalPages || 1);
        } catch (error) {
            console.error('Lỗi tải đơn hàng:', error);
            toast.error(error.response?.data?.message || 'Không thể tải dữ liệu đơn hàng.');
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, [currentPage, selectedStatus]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // Cập nhật trạng thái đơn hàng (PUT /api/orders/:id/status)
    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            await api.put(`/orders/${orderId}/status`, { status: newStatus });
            toast.success(`Cập nhật trạng thái đơn hàng ${orderId.slice(0, 8)}... thành công!`);
            fetchOrders(); // Tải lại danh sách
        } catch (error) {
            console.error('Lỗi cập nhật trạng thái:', error);
            toast.error(error.response?.data?.message || 'Cập nhật thất bại.');
        }
    };

    const getStatusClass = (status) => {
        return ORDER_STATUSES.find(s => s.value === status)?.color || 'text-gray-600 bg-gray-100';
    };

    if (loading) {
        return <div className="flex justify-center items-center p-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <Package2 className="w-6 h-6 text-blue-600" /> Quản lý Đơn hàng
            </h2>

            <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
                <div className="flex items-center gap-4 border-b pb-4">
                    <ListFilter className="w-5 h-5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Lọc theo trạng thái:</span>
                    <Select value={selectedStatus} onValueChange={(val) => { setSelectedStatus(val); setCurrentPage(1); }}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Tất cả trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            {ORDER_STATUSES.map(s => (
                                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {orders.length === 0 ? (
                    <p className="text-center text-gray-500 p-12">Không tìm thấy đơn hàng nào.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Mã ĐH</TableHead>
                                    <TableHead>Khách hàng</TableHead>
                                    <TableHead>Tổng tiền</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead>P.Thức TT</TableHead>
                                    <TableHead>Ngày tạo</TableHead>
                                    <TableHead className="text-right">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.map((order) => (
                                    <TableRow key={order._id}>
                                        <TableCell>{order._id.slice(0, 8)}...</TableCell>
                                        <TableCell className="font-medium">{order.customerInfo?.name || order.user?.name || 'Khách'}</TableCell>
                                        <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                                        <TableCell>
                                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusClass(order.status)}`}>
                                                {ORDER_STATUSES.find(s => s.value === order.status)?.label || order.status}
                                            </span>
                                        </TableCell>
                                        <TableCell>{order.paymentMethod}</TableCell>
                                        <TableCell>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                                        <TableCell className="text-right">
                                            <Select onValueChange={(val) => handleUpdateStatus(order._id, val)} defaultValue={order.status}>
                                                <SelectTrigger className="w-[150px] ml-auto">
                                                    <SelectValue placeholder="Cập nhật" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {ORDER_STATUSES.filter(s => s.value !== 'all' && s.value !== 'cancelled').map(s => (
                                                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                                    ))}
                                                    <SelectItem value="cancelled" className="text-red-500">Hủy đơn hàng</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-end space-x-4">
                    <Button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                        Trước
                    </Button>
                    <span className="text-sm flex items-center">Trang {currentPage} / {totalPages}</span>
                    <Button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                        Sau
                    </Button>
                </div>
            )}
        </div>
    );
};

export default OrderManagement;