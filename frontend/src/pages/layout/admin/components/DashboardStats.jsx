/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { DollarSign, Package, ShoppingCart, X, Users, Loader2, ArrowUp, ArrowDown } from 'lucide-react';
import api from '@/lib/axios'; // Import axios instance của bạn
import { toast } from 'sonner';

// Hàm tiện ích: Định dạng tiền tệ
const formatCurrency = (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);

// Component Card (Tách riêng để dễ quản lý)
const StatCard = ({ title, value, change, icon: Icon, colorClass }) => {
    const isPositive = change !== null && change >= 0;
    const changeColor = isPositive ? 'text-green-600' : 'text-red-600';
    const ChangeIcon = isPositive ? ArrowUp : ArrowDown;

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-600">{title}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                </div>
                <div className={`p-3 rounded-lg ${colorClass.bg}`}>
                    <Icon className={`w-6 h-6 ${colorClass.text}`} />
                </div>
            </div>
            {change !== null && change !== undefined && (
                <div className={`flex items-center text-xs mt-2 ${changeColor}`}>
                    <ChangeIcon className="w-3 h-3 mr-1" />
                    <span>{Math.abs(change)}% so với tháng trước</span>
                </div>
            )}
        </div>
    );
};

const DashboardStats = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // ✅ BƯỚC 1: Gọi API thống kê tổng hợp (Bạn cần tạo API này ở Backend)
                const res = await api.get('/stats/summary');
                setStats(res.data);
            } catch (error) {
                console.error("Lỗi tải thống kê:", error);
                toast.error("Không thể tải dữ liệu thống kê tổng quan.");
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []); // Chỉ chạy 1 lần khi component mount

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white p-6 rounded-lg shadow-sm border animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                        <div className="h-8 bg-gray-300 rounded w-1/2 mb-3"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (!stats) {
        return <p className="text-red-500">Không thể tải dữ liệu thống kê.</p>
    }

    // ✅ FIX 3: Sửa lỗi Tailwind CSS. Định nghĩa class đầy đủ.
    const statsData = [
        { title: "Tổng Doanh Thu", value: formatCurrency(stats.totalRevenue.value), change: stats.totalRevenue.change, icon: DollarSign, colorClass: { bg: "bg-green-100", text: "text-green-600" } },
        { title: "Tổng Đơn Hàng (Đã giao)", value: stats.totalOrders.value.toLocaleString(), change: stats.totalOrders.change, icon: ShoppingCart, colorClass: { bg: "bg-blue-100", text: "text-blue-600" } },
        { title: "Tổng Khách Hàng", value: stats.totalCustomers.value.toLocaleString(), change: stats.totalCustomers.change, icon: Users, colorClass: { bg: "bg-purple-100", text: "text-purple-600" } },
        { title: "Sản phẩm Hết hàng", value: stats.outOfStockProducts.value.toLocaleString(), change: null, icon: X, colorClass: { bg: "bg-red-100", text: "text-red-600" } },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsData.map((stat, index) => (
                <StatCard
                    key={index}
                    title={stat.title}
                    value={stat.value}
                    change={stat.change}
                    icon={stat.icon}
                    colorClass={stat.colorClass}
                />
            ))}
        </div>
    );
};

export default DashboardStats;