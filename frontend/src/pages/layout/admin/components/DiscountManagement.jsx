/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash2, Loader2, DollarSign, Percent } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import DiscountModal from "./DiscountModal"; // ✅ Import modal

// --- HÀM TIỆN ÍCH ---
const formatCurrency = (num) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num || 0);
const formatDate = (dateString) => new Date(dateString).toLocaleDateString("vi-VN");

// --- COMPONENT CHÍNH ---
const DiscountManagement = () => {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- State cho Modal ---
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" | "edit"
  const [currentDiscount, setCurrentDiscount] = useState(null);

  // --- Lấy danh sách ---
  const fetchDiscounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/discounts");
      setDiscounts(res.data);
    } catch (error) {
      toast.error("Không thể tải danh sách mã giảm giá.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDiscounts();
  }, [fetchDiscounts]);

  // --- Mở modal ---
  const openCreateModal = () => {
    setModalMode("create");
    setCurrentDiscount(null);
    setShowModal(true);
  };

  const openEditModal = (discount) => {
    setModalMode("edit");
    setCurrentDiscount(discount);
    setShowModal(true);
  };

  // --- Xóa mã ---
  const handleDelete = async (id) => {
    if (!window.confirm("Xác nhận xóa mã giảm giá này?")) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/discounts/${id}`);
      toast.success("Mã đã được xóa.");
      fetchDiscounts();
    } catch (error) {
      toast.error("Xóa thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* --- HEADER --- */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          Quản lý Mã giảm giá ({discounts.length})
        </h2>
        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" /> Tạo mã mới
        </Button>
      </div>

      {/* --- TABLE --- */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Giá trị</TableHead>
              <TableHead>Đơn hàng tối thiểu</TableHead>
              <TableHead>Tình trạng</TableHead>
              <TableHead>Hạn sử dụng</TableHead>
              <TableHead>Đã dùng</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {discounts.map((d) => {
              const isExpired = new Date(d.expiryDate) < new Date();
              const isActive = d.isActive && !isExpired;
              return (
                <TableRow key={d._id}>
                  <TableCell className="font-bold">{d.code}</TableCell>
                  <TableCell>
                    {d.type === "percent" ? (
                      <Percent className="w-4 h-4 text-purple-600" />
                    ) : (
                      <DollarSign className="w-4 h-4 text-green-600" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {d.type === "percent"
                      ? `${d.value}%`
                      : formatCurrency(d.value)}
                  </TableCell>
                  <TableCell>{formatCurrency(d.minOrder)}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                        }`}
                    >
                      {isActive ? "Hoạt động" : "Hết hạn/Tắt"}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(d.expiryDate)}</TableCell>
                  <TableCell>
                    {d.usedCount || 0} / {d.usageLimit}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditModal(d)}
                      disabled={isSubmitting}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(d._id)}
                      disabled={isSubmitting}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* --- MODAL (TẠO / SỬA) --- */}
      <DiscountModal
        showModal={showModal}
        setShowModal={setShowModal}
        modalMode={modalMode}
        currentDiscount={currentDiscount}
        isSubmitting={isSubmitting}
        fetchDiscounts={fetchDiscounts}
      />
    </div>
  );
};

export default DiscountManagement;
