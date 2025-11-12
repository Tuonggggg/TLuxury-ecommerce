import React, { useState, useEffect, useCallback } from "react";
import {
    Package2,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Trash2,
    Eye,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import api from "@/lib/axios";
import { Link } from "react-router-dom";

const ORDER_STATUSES = [
    { value: "all", label: "Tất cả" },
    { value: "pending", label: "Chờ xác nhận", color: "text-yellow-700 bg-yellow-50" },
    { value: "processing", label: "Đang xử lý", color: "text-blue-700 bg-blue-50" },
    { value: "shipped", label: "Đang giao", color: "text-purple-700 bg-purple-50" },
    { value: "delivered", label: "Đã giao", color: "text-green-700 bg-green-50" },
    { value: "cancelled", label: "Đã hủy", color: "text-red-700 bg-red-50" },
];

const OrderManagement = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [expandedRow, setExpandedRow] = useState(null);
    const itemsPerPage = 10;

    const formatCurrency = (num) =>
        new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(num || 0);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                limit: itemsPerPage,
                status: selectedStatus !== "all" ? selectedStatus : undefined,
            };
            const res = await api.get("/orders", { params });
            setOrders(res.data.orders || []);
            setTotalPages(res.data.totalPages || 1);
        } catch (error) {
            console.log(error)
            toast.error("Không thể tải dữ liệu đơn hàng.");
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, [currentPage, selectedStatus]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            await api.put(`/orders/${orderId}/status`, { status: newStatus });
            toast.success(`Cập nhật đơn hàng ${orderId.slice(0, 8)} thành công!`);
            fetchOrders();
        } catch {
            toast.error("Cập nhật thất bại.");
        }
    };

    const handleDeleteOrder = async (orderId) => {
        if (!window.confirm("Xóa đơn hàng này?")) return;
        try {
            await api.delete(`/orders/${orderId}`);
            toast.success("Đã xóa đơn hàng.");
            if (expandedRow === orderId) setExpandedRow(null);
            fetchOrders();
        } catch {
            toast.error("Xóa đơn hàng thất bại.");
        }
    };

    const toggleRow = (id) => setExpandedRow(expandedRow === id ? null : id);

    if (loading)
        return (
            <div className="flex justify-center items-center p-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
        );

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Package2 className="w-6 h-6 text-blue-600" /> Quản lý Đơn hàng
            </h2>

            <div className="bg-white p-5 rounded-xl border shadow-sm space-y-4">
                {/* Filter (Giữ nguyên) */}
                <div className="flex items-center gap-3">
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Lọc theo trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            {ORDER_STATUSES.map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                    {s.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button variant="secondary" onClick={() => fetchOrders()}>
                        Làm mới
                    </Button>
                </div>

                {/* Table */}
                {orders.length === 0 ? (
                    <p className="text-center text-gray-500 p-12">Không có đơn hàng nào.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50">
                                    <TableHead></TableHead>
                                    <TableHead>Mã ĐH</TableHead>
                                    <TableHead>Khách hàng</TableHead>
                                    <TableHead>SĐT</TableHead>
                                    <TableHead>Tổng tiền</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead>Thanh toán</TableHead>
                                    <TableHead>Ngày tạo</TableHead>
                                    <TableHead className="text-right">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.map((order) => {
                                    // Lấy số điện thoại: ưu tiên user.phone, fallback shippingAddress.phone
                                    const phone = order.user?.phone || order.shippingAddress?.phone || "—";

                                    // ✅ FIX 1: LẤY TÊN KHÁCH HÀNG (Ưu tiên username, fallback shippingAddress.name)
                                    const customerName = order.user?.username || order.shippingAddress?.name || "Khách vãng lai";

                                    return (
                                        <React.Fragment key={order._id}>
                                            <TableRow className="hover:bg-gray-50 transition-all">
                                                <TableCell
                                                    className="cursor-pointer"
                                                    onClick={() => toggleRow(order._id)}
                                                >
                                                    {expandedRow === order._id ? (
                                                        <ChevronUp className="w-4 h-4" />
                                                    ) : (
                                                        <ChevronDown className="w-4 h-4" />
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Link
                                                        to={`/order/${order._id}`}
                                                        className="text-blue-600 hover:underline"
                                                    >
                                                        {order._id.slice(0, 8)}...
                                                    </Link>
                                                </TableCell>
                                                <TableCell>{customerName}</TableCell>

                                                {/* Hiển thị SĐT, là link tel: nếu có */}
                                                <TableCell>
                                                    {phone !== "—" ? (
                                                        <a href={`tel:${phone}`} className="text-sm text-blue-600 hover:underline">
                                                            {phone}
                                                        </a>
                                                    ) : (
                                                        <span className="text-gray-400">—</span>
                                                    )}
                                                </TableCell>

                                                {/* ✅ FIX 3: SỬ DỤNG 'finalTotal' */}
                                                <TableCell className="font-semibold text-red-600">{formatCurrency(order.finalTotal)}</TableCell>

                                                <TableCell>
                                                    <span
                                                        className={`px-3 py-1 text-xs font-medium rounded-full ${ORDER_STATUSES.find((s) => s.value === order.orderStatus)?.color || "bg-gray-100 text-gray-700"}`}
                                                    >
                                                        {ORDER_STATUSES.find((s) => s.value === order.orderStatus)?.label}
                                                    </span>
                                                </TableCell>
                                                <TableCell>{order.paymentMethod}</TableCell>
                                                <TableCell>
                                                    {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                                                </TableCell>
                                                <TableCell className="text-right flex items-center justify-end gap-2">
                                                    <Select
                                                        onValueChange={(v) => handleUpdateStatus(order._id, v)}
                                                        defaultValue={order.orderStatus}
                                                    >
                                                        <SelectTrigger className="w-[140px]">
                                                            <SelectValue placeholder="Cập nhật" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {ORDER_STATUSES.filter((s) => s.value !== "all").map(
                                                                (s) => (
                                                                    <SelectItem key={s.value} value={s.value}>
                                                                        {s.label}
                                                                    </SelectItem>
                                                                )
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                    <Button
                                                        onClick={() => handleDeleteOrder(order._id)}
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-red-500 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>

                                            {/* Expanded row: thêm SĐT trong phần chi tiết */}
                                            {expandedRow === order._id && (
                                                <TableRow>
                                                    <TableCell colSpan={9} className="bg-gray-50 p-4">
                                                        <div className="space-y-3">
                                                            {order.orderItems.map((item, i) => (
                                                                <div
                                                                    key={i}
                                                                    className="flex items-center justify-between border rounded-lg bg-white p-2 shadow-sm"
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <img
                                                                            src={item.images?.[0] || "/images/no-image.jpg"}
                                                                            alt={item.name}
                                                                            className="w-10 h-10 rounded object-cover"
                                                                        />
                                                                        <div>
                                                                            <p className="text-sm font-medium">{item.name}</p>
                                                                            <p className="text-xs text-gray-500">
                                                                                SL: {item.qty} x {formatCurrency(item.price)}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <span className="font-medium text-sm">
                                                                        {formatCurrency(item.price * item.qty)}
                                                                    </span>
                                                                </div>
                                                            ))}

                                                            {/* Bảng tổng hợp giá */}
                                                            <div className="ml-auto w-full md:w-1/2 mt-4 space-y-1 text-sm">
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">Tổng tiền hàng:</span>
                                                                    <span className="font-medium">{formatCurrency(order.itemsPrice)}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">VAT ({Math.round(order.taxPrice / order.itemsPrice * 100)}%):</span>
                                                                    <span className="font-medium">{formatCurrency(order.taxPrice)}</span>
                                                                </div>

                                                                {/* Dòng giảm giá */}
                                                                {order.discountAmount > 0 && (
                                                                    <div className="flex justify-between text-green-600 font-medium">
                                                                        <span>Giảm giá ({order.voucherCode}):</span>
                                                                        <span>— {formatCurrency(order.discountAmount)}</span>
                                                                    </div>
                                                                )}

                                                                <div className="flex justify-between border-t pt-2 text-base font-bold">
                                                                    <span>Thanh toán:</span>
                                                                    <span className="text-red-600">{formatCurrency(order.finalTotal)}</span>
                                                                </div>
                                                            </div>

                                                            <div className="text-xs text-gray-600 border-t pt-2 space-y-1">
                                                                <p>
                                                                    {/* ✅ FIX 5: Hiển thị tên khách (ưu tiên username, fallback shippingAddress.name) */}
                                                                    <strong>Tên khách: </strong>{order.user?.username || order.shippingAddress?.name || "Khách"}
                                                                </p>
                                                                <p>
                                                                    <strong>Địa chỉ:</strong>{" "}
                                                                    {order.shippingAddress?.address || "—"},{" "}
                                                                    {order.shippingAddress?.city || "—"}
                                                                </p>

                                                                {/* Hiển thị SĐT chi tiết */}
                                                                <p>
                                                                    <strong>SĐT khách:</strong>{" "}
                                                                    {phone !== "—" ? (
                                                                        <a href={`tel:${phone}`} className="text-blue-600 hover:underline">
                                                                            {phone}
                                                                        </a>
                                                                    ) : (
                                                                        <span className="text-gray-400">—</span>
                                                                    )}
                                                                </p>

                                                                {order.note && (
                                                                    <p className="italic text-orange-600">
                                                                        <strong>Ghi chú:</strong> {order.note}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            <Button
                                                                asChild
                                                                variant="link"
                                                                size="sm"
                                                                className="p-0 text-blue-600 hover:text-blue-700"
                                                            >
                                                                <Link to={`/order/${order._id}`}>
                                                                    Xem chi tiết <Eye className="w-4 h-4 ml-1" />
                                                                </Link>
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3">
                    <Button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        variant="outline"
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" /> Trước
                    </Button>
                    <span className="text-sm">
                        Trang {currentPage} / {totalPages}
                    </span>
                    <Button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        variant="outline"
                    >
                        Sau <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                </div>
            )}
        </div>
    );
};

export default OrderManagement;