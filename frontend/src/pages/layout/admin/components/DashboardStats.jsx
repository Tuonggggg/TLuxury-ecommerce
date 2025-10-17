import React, { useMemo } from 'react';
import { DollarSign, Package, ShoppingCart, X } from 'lucide-react';

const DashboardStats = ({ products }) => {
    // Hàm tiện ích: Định dạng tiền tệ
    const formatCurrency = (num) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);
    };

    // Tính toán thống kê nhanh từ dữ liệu sản phẩm hiện có
    const statistics = useMemo(() => {
        const totalProducts = products.length;
        // Giả định mỗi sản phẩm có trường 'sold' (số lượng đã bán)
        const totalSold = products.reduce((sum, p) => sum + (p.sold || 0), 0);
        // Giả định tính tổng doanh thu thô (Giá * Đã bán)
        const totalRevenue = products.reduce((sum, p) => sum + (p.price * (p.sold || 0)), 0); 
        const outOfStock = products.filter(p => p.stock === 0).length;

        return { totalProducts, totalRevenue, totalSold, outOfStock };
    }, [products]);

    // Mảng dữ liệu cho các Card Stats
    const statsData = [
        { title: "Tổng Sản phẩm", value: statistics.totalProducts.toLocaleString(), icon: Package, color: "blue" },
        { title: "Doanh thu thô", value: formatCurrency(statistics.totalRevenue), icon: DollarSign, color: "green" },
        { title: "Tổng đã bán", value: statistics.totalSold.toLocaleString(), icon: ShoppingCart, color: "purple" },
        { title: "Hết hàng", value: statistics.outOfStock.toLocaleString(), icon: X, color: "red" },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsData.map((stat, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">{stat.title}</p>
                            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        </div>
                        <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                            <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default DashboardStats;