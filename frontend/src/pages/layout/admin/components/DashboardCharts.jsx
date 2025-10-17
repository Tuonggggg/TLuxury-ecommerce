// File: src/pages/Admin/components/DashboardCharts.jsx
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

const DashboardCharts = ({ products, getCategoryName }) => {

  // 🚨 TÍNH TOÁN DATA CHO BIỂU ĐỒ
  const categorySalesData = useMemo(() => {
    const salesMap = {};

    products.forEach(p => {
      // Lấy tên danh mục từ slug (hoặc tên category nếu populated)
      const categoryIdentifier = p.category?.slug || (typeof p.category === 'string' ? p.category : 'Chưa phân loại');
      const categoryName = getCategoryName(categoryIdentifier);

      // Giả định sold là doanh số
      const sales = p.sold || 0;

      salesMap[categoryName] = (salesMap[categoryName] || 0) + sales;
    });

    // Chuyển Map sang mảng định dạng Recharts
    return Object.entries(salesMap).map(([name, sales]) => ({ name, sales })).filter(item => item.sales > 0);
  }, [products, getCategoryName]);

  // Data cho Pie Chart (Phân bổ số lượng sản phẩm)
  const productCountData = useMemo(() => {
    const countMap = {};

    products.forEach(p => {
      const categoryIdentifier = p.category?.slug || (typeof p.category === 'string' ? p.category : 'Chưa phân loại');
      const categoryName = getCategoryName(categoryIdentifier);

      countMap[categoryName] = (countMap[categoryName] || 0) + 1;
    });

    return Object.entries(countMap).map(([name, count]) => ({ name, value: count }));
  }, [products, getCategoryName]);


  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Doanh số theo Danh mục</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={categorySalesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => value.toLocaleString()} />
            <Legend />
            <Bar dataKey="sales" name="Số lượng bán" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Phân bổ Số lượng sản phẩm</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={productCountData}
              cx="50%"
              cy="50%"
              labelLine={false}
              // Hiển thị phần trăm và tên
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
              outerRadius={100}
              dataKey="value"
            >
              {productCountData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DashboardCharts;