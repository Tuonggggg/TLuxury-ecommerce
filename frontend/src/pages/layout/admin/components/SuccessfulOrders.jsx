import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import { toast } from "sonner";
import { Loader2, Printer, FileDown, ArrowLeft } from "lucide-react";
import * as XLSX from "xlsx";

const SuccessfulOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get("/stats/orders/success");
        setOrders(res.data);
      } catch (error) {
        console.error("Lỗi tải đơn hàng:", error);
        toast.error("Không thể tải danh sách đơn hàng thành công!");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // ✅ Hàm quay lại trang trước
  const handleBack = () => {
    navigate(-1); // quay lại trang trước
  };

  // ✅ Hàm in báo cáo
  const handlePrint = () => {
    const printContent = document.getElementById("print-section").innerHTML;
    const printWindow = window.open("", "", "width=1000,height=700");
    printWindow.document.write(`
      <html>
        <head>
          <title>Báo cáo đơn hàng thành công</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f3f4f6; }
            h2 { text-align: center; }
          </style>
        </head>
        <body>
          <h2>Báo cáo đơn hàng thành công</h2>
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // ✅ Hàm tải xuống file Excel
  const handleDownload = () => {
    if (orders.length === 0) {
      toast.warning("Không có dữ liệu để tải xuống!");
      return;
    }

    const excelData = orders.map((o) => ({
      "Mã đơn": o.orderId,
      "Khách hàng": o.customer,
      "Email": o.email,
      "Tổng tiền (₫)": o.totalPrice,
      "Trạng thái": o.status,
      "Ngày tạo": new Date(o.createdAt).toLocaleString("vi-VN"),
      "Sản phẩm": o.products
        .map((p) => `${p.productName} (x${p.quantity})`)
        .join(", "),
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Đơn hàng thành công");

    XLSX.writeFile(workbook, "BaoCao_DonHangThanhCong.xlsx");
    toast.success("Tải xuống thành công!");
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin w-6 h-6 text-blue-600" />
      </div>
    );

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex justify-between items-center mb-4">
        {/* 🔙 Nút Quay lại */}
          <button
            onClick={handleBack}
            className="flex items-center gap-1 bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-md text-sm"
          >
            <ArrowLeft size={16} /> Quay lại
          </button>
        <h2 className="text-xl font-semibold">ĐƠN HÀNG THÀNH CÔNG</h2>
        <div className="flex gap-2">
          
          {/* 🖨️ Nút In */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm"
          >
            <Printer size={16} /> In báo cáo
          </button>

          {/* 💾 Nút Tải xuống */}
          <button
            onClick={handleDownload}
            className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm"
          >
            <FileDown size={16} /> Tải xuống
          </button>
        </div>
      </div>

      {orders.length === 0 ? (
        <p className="text-gray-500">Không có đơn hàng thành công nào.</p>
      ) : (
        <div id="print-section" className="overflow-x-auto">
          <table className="w-full border border-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left border-b">Mã đơn</th>
                <th className="p-3 text-left border-b">Khách hàng</th>
                <th className="p-3 text-left border-b">Email</th>
                <th className="p-3 text-left border-b">Sản phẩm</th>
                <th className="p-3 text-left border-b">Tổng tiền</th>
                <th className="p-3 text-left border-b">Trạng thái</th>
                <th className="p-3 text-left border-b">Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.orderId} className="hover:bg-gray-50">
                  <td className="p-3 border-b font-mono">{o.orderId}</td>
                  <td className="p-3 border-b">{o.customer}</td>
                  <td className="p-3 border-b">{o.email}</td>
                  <td className="p-3 border-b">
                    {o.products?.length > 0 ? (
                      <ul className="list-disc ml-4">
                        {o.products.map((p) => (
                          <p key={p.productId}>
                            <span className="font-medium">{p.productName}</span>{" "}
                            x {p.quantity}
                          </p>
                        ))}
                      </ul>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-3 border-b text-blue-600 font-semibold">
                    {o.totalPrice?.toLocaleString("vi-VN")}₫
                  </td>
                  <td className="p-3 border-b text-green-600 font-medium">
                    {o.status}
                  </td>
                  <td className="p-3 border-b">
                    {new Date(o.createdAt).toLocaleString("vi-VN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SuccessfulOrders;
