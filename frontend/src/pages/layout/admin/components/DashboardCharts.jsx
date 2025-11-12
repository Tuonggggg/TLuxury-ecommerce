/* eslint-disable no-unused-vars */
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
  ComposedChart
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Printer, Loader2, Eye, TrendingUp, DollarSign, ShoppingCart } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- Hằng số và Hàm tiện ích ---
const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];
const RADIAN = Math.PI / 180;

// Hàm tiện ích cho nhãn biểu đồ tròn
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// Hàm định dạng tiền tệ
const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

// --- Component DashboardCharts ---
const DashboardCharts = ({ products }) => {
  const [salesStats, setSalesStats] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsRange, setStatsRange] = useState('month');
  const navigate = useNavigate();

  // Refs cho các biểu đồ để chụp ảnh
  const revenueChartRef = useRef(null);
  const salesChartRef = useRef(null);
  const productChartRef = useRef(null);

  // Lấy dữ liệu thống kê
  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const res = await api.get(`/stats/chart?range=${statsRange}`);
        const rawData = Array.isArray(res.data) ? res.data : [];
        const formattedStats = rawData.map(item => ({
          name: item._id,
          "Doanh thu": item.totalSales,
          "Đơn hàng thành công": item.orderCount
        }));
        setSalesStats(formattedStats);
      } catch (error) {
        console.error("Lỗi tải thống kê:", error);
        setSalesStats([]);
        toast.error("Không thể tải dữ liệu thống kê doanh thu.");
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, [statsRange]);

  // Nhóm theo danh mục cha
  const categorySalesData = useMemo(() => {
    const salesMap = {};
    products.forEach(p => {
      const categoryName = p.category?.parent?.name || p.category?.name || 'Chưa phân loại';
      const sales = p.sold || 0;
      salesMap[categoryName] = (salesMap[categoryName] || 0) + sales;
    });
    return Object.entries(salesMap).map(([name, sales]) => ({ name, sales })).filter(item => item.sales > 0);
  }, [products]);

  // Nhóm theo danh mục cho PieChart
  const productCountData = useMemo(() => {
    const countMap = {};
    products.forEach(p => {
      const categoryName = p.category?.parent?.name || p.category?.name || 'Chưa phân loại';
      countMap[categoryName] = (countMap[categoryName] || 0) + 1;
    });
    return Object.entries(countMap).map(([name, count]) => ({ name, value: count }));
  }, [products]);

  // Xuất Excel
  const handleExport = () => {
    try {
      const wb = XLSX.utils.book_new();
      const salesWsData = [
        ['Tên', 'Doanh thu', 'Đơn hàng thành công'],
        ...salesStats.map(item => [item.name, item['Doanh thu'], item['Đơn hàng thành công']])
      ];
      const salesWs = XLSX.utils.aoa_to_sheet(salesWsData);
      XLSX.utils.book_append_sheet(wb, salesWs, 'Doanh thu');

      const categoryWsData = [
        ['Danh mục', 'Số lượng bán'],
        ...categorySalesData.map(item => [item.name, item.sales])
      ];
      const categoryWs = XLSX.utils.aoa_to_sheet(categoryWsData);
      XLSX.utils.book_append_sheet(wb, categoryWs, 'Số lượng bán');

      const productWsData = [
        ['Danh mục', 'Số lượng sản phẩm'],
        ...productCountData.map(item => [item.name, item.value])
      ];
      const productWs = XLSX.utils.aoa_to_sheet(productWsData);
      XLSX.utils.book_append_sheet(wb, productWs, 'Phân bổ sản phẩm');

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
      const s2ab = (s) => {
        const buf = new ArrayBuffer(s.length);
        const view = new Uint8Array(buf);
        for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
        return buf;
      };
      saveAs(new Blob([s2ab(wbout)]), `Thong_ke_${statsRange}.xlsx`);
      toast.success('Xuất Excel thành công!');
    } catch (error) {
      console.error('Lỗi xuất Excel:', error);
      toast.error('Lỗi xuất Excel.');
    }
  };

  // In PDF
  const handlePrint = async () => {
    try {
      const doc = new jsPDF('landscape');
      let yPos = 10;
      if (revenueChartRef.current) {
        const revenueCanvas = await html2canvas(revenueChartRef.current, { scale: 2 });
        doc.addImage(revenueCanvas.toDataURL('image/png'), 'PNG', 10, yPos, 260, 100);
        yPos += 110;
      }
      doc.addPage();
      yPos = 10;
      if (salesChartRef.current) {
        const salesCanvas = await html2canvas(salesChartRef.current, { scale: 2 });
        doc.addImage(salesCanvas.toDataURL('image/png'), 'PNG', 10, yPos, 130, 100);
      }
      if (productChartRef.current) {
        const productCanvas = await html2canvas(productChartRef.current, { scale: 2 });
        doc.addImage(productCanvas.toDataURL('image/png'), 'PNG', 150, yPos, 130, 100);
      }
      doc.save(`Thong_ke_${statsRange}.pdf`);
      toast.success('Tạo PDF thành công!');
    } catch (error) {
      console.error('Lỗi tạo PDF:', error);
      toast.error('Lỗi tạo PDF.');
    }
  };

  return (
    <div className="space-y-6">

      {/* BIỂU ĐỒ KHÁC */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border" ref={salesChartRef}>
          <h3 className="text-lg font-semibold mb-4">Số lượng đã bán (Theo danh mục cha)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categorySalesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `${value.toLocaleString()} sp`} />
              <Legend />
              <Bar dataKey="sales" name="Số lượng bán" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border" ref={productChartRef}>
          <h3 className="text-lg font-semibold mb-4">Phân bổ Sản phẩm (Theo danh mục cha)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={productCountData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={100}
                dataKey="value"
              >
                {productCountData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} sản phẩm`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* BIỂU ĐỒ THỐNG KÊ DOANH THU - CẢI TIẾN */}
      <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl shadow-lg border border-gray-200" ref={revenueChartRef}>
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Thống kê Doanh thu
            </h3>
            <p className="text-xs text-gray-500 mt-1">Đơn hàng đã thanh toán/COD</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-3 sm:mt-0">
            <Select value={statsRange} onValueChange={setStatsRange}>
              <SelectTrigger className="w-[140px] border-gray-300 focus:ring-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Tuần qua</SelectItem>
                <SelectItem value="month">Tháng qua</SelectItem>
                <SelectItem value="year">Năm qua</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={handleExport} className="text-gray-600 hover:text-blue-600 border-gray-300">
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handlePrint} className="text-gray-600 hover:text-blue-600 border-gray-300">
              <Printer className="w-4 h-4" />
            </Button>
            <Button
              variant="default"
              className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 px-4 py-2 rounded-md shadow-md"
              onClick={() => navigate("/admin/successful-orders")}
            >
              <Eye className="w-4 h-4" />
              Xem đơn hàng hoàn thành
            </Button>
          </div>
        </div>

        {statsLoading ? (
          <div className="flex justify-center items-center h-[300px]">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            {/* Thống kê Tổng quan - Đưa lên trước biểu đồ */}
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Tổng doanh thu */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Tổng doanh thu</p>
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-white" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-blue-700">
                  {formatCurrency(salesStats.reduce((acc, item) => acc + item["Doanh thu"], 0))}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(salesStats.reduce((acc, item) => acc + item["Doanh thu"], 0))}
                </p>
              </div>

              {/* Tổng đơn hàng */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Đơn hàng thành công</p>
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 text-white" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-green-700">
                  {salesStats.reduce((acc, item) => acc + item["Đơn hàng thành công"], 0).toLocaleString('vi-VN')}
                </p>
                <p className="text-xs text-green-600 mt-1">đơn hàng</p>
              </div>

              {/* Giá trị trung bình */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Giá trị TB/đơn</p>
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-purple-700">
                  {formatCurrency(
                    salesStats.reduce((acc, item) => acc + item["Doanh thu"], 0) /
                    salesStats.reduce((acc, item) => acc + item["Đơn hàng thành công"], 0)
                  )}
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  {new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(
                    salesStats.reduce((acc, item) => acc + item["Doanh thu"], 0) /
                    salesStats.reduce((acc, item) => acc + item["Đơn hàng thành công"], 0)
                  )}
                </p>
              </div>
            </div>

            {/* Biểu đồ - Cải thiện */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              {/* Chú thích tùy chỉnh */}
              <div className="flex items-center justify-center gap-6 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-blue-500"></div>
                  <span className="text-sm font-medium text-gray-700">Doanh thu (VNĐ)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium text-gray-700">Số đơn hàng</span>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart
                  data={salesStats}
                  margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    stroke="#6b7280"
                    fontSize={13}
                    fontWeight={500}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    tickFormatter={(value) => new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(value)}
                    stroke="#3b82f6"
                    fontSize={12}
                    tickLine={false}
                    width={60}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={(value) => new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(value)}
                    stroke="#10b981"
                    fontSize={12}
                    tickLine={false}
                    width={50}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === "Doanh thu") {
                        return [formatCurrency(value), name];
                      }
                      return [value.toLocaleString('vi-VN') + ' đơn', name];
                    }}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #d1d5db',
                      borderRadius: '12px',
                      padding: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    labelStyle={{ fontWeight: 'bold', marginBottom: '8px' }}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="Doanh thu"
                    fill="#3b82f6"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={50}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="Đơn hàng thành công"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: '#10b981', r: 5, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>

              {/* Ghi chú */}
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  💡 Di chuột vào biểu đồ để xem chi tiết
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardCharts;
