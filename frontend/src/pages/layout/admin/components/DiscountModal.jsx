import React, { useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Loader2, DollarSign, Percent } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

// =========================================================
// ✅ ZOD SCHEMA VALIDATION
// =========================================================
const discountSchema = z
  .object({
    code: z
      .string()
      .min(3, "Mã phải có ít nhất 3 ký tự")
      .max(20, "Mã không quá 20 ký tự")
      .transform((v) => v.toUpperCase()),
    type: z.enum(["fixed", "percent"], { message: "Vui lòng chọn loại giảm giá." }),
    value: z.string().refine((val) => Number(val) > 0, { message: "Giá trị phải lớn hơn 0." }),
    minOrder: z.string().optional().transform((val) => Number(val) || 0),
    expiryDate: z.string().min(1, "Vui lòng chọn ngày hết hạn."),
    usageLimit: z.string().optional().transform((val) => Number(val) || 1000),
    isActive: z.boolean().optional(),
    maxDiscount: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "percent" && data.maxDiscount) {
      if (Number(data.maxDiscount) <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Giảm tối đa phải lớn hơn 0 nếu áp dụng.",
          path: ["maxDiscount"],
        });
      }
    }
  });

// =========================================================
// ✅ COMPONENT
// =========================================================
const DiscountModal = ({
  showModal,
  setShowModal,
  modalMode,
  currentDiscount,
  isSubmitting,
  fetchDiscounts,
}) => {
  const defaultValues = useMemo(() => {
    const d = currentDiscount || {};
    return {
      code: d.code || "",
      type: d.type || "fixed",
      value: String(d.value || 0),
      minOrder: String(d.minOrder || 0),
      maxDiscount: String(d.maxDiscount || 0),
      expiryDate: d.expiryDate ? new Date(d.expiryDate).toISOString().substring(0, 10) : "",
      usageLimit: String(d.usageLimit || 1000),
      isActive: d.isActive !== undefined ? d.isActive : true,
    };
  }, [currentDiscount]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(discountSchema),
    defaultValues,
  });

  const watchedType = watch("type");

  useEffect(() => {
    reset(defaultValues);
  }, [showModal, modalMode, currentDiscount, reset, defaultValues]);

  const resetForm = () => {
    reset(defaultValues);
    setShowModal(false);
  };

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      value: Number(data.value),
      maxDiscount: data.type === "percent" ? Number(data.maxDiscount) : 0,
      minOrder: Number(data.minOrder),
      usageLimit: Number(data.usageLimit),
    };

    try {
      if (modalMode === "create") {
        await api.post("/discounts", payload);
        toast.success("🎉 Tạo mã giảm giá thành công!");
      } else {
        await api.put(`/discounts/${currentDiscount._id}`, payload);
        toast.success("✅ Cập nhật mã giảm giá thành công!");
      }
      fetchDiscounts();
      resetForm();
    } catch (error) {
      toast.error("Thất bại!", {
        description: error.response?.data?.message || error.message,
      });
    }
  };

  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {modalMode === "create"
              ? "Tạo Mã Giảm Giá Mới"
              : `Sửa Mã: ${currentDiscount?.code}`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* --- Mã & Loại --- */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="code">Mã (CODE)</Label>
              <Input id="code" {...register("code")} disabled={modalMode === "edit"} />
              {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code.message}</p>}
            </div>
            <div>
              <Label>Loại giảm giá</Label>
              <Select
                value={watchedType}
                onValueChange={(v) => setValue("type", v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} /> Số tiền cố định (₫)
                    </div>
                  </SelectItem>
                  <SelectItem value="percent">
                    <div className="flex items-center gap-2">
                      <Percent size={16} /> Phần trăm (%)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* --- Giá trị & Giảm tối đa --- */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="value">
                Giá trị ({watchedType === "percent" ? "%" : "₫"})
              </Label>
              <Input id="value" type="number" {...register("value")} />
              {errors.value && <p className="text-red-500 text-sm mt-1">{errors.value.message}</p>}
            </div>
            {watchedType === "percent" && (
              <div>
                <Label htmlFor="maxDiscount">Giảm tối đa (₫)</Label>
                <Input id="maxDiscount" type="number" {...register("maxDiscount")} />
                {errors.maxDiscount && (
                  <p className="text-red-500 text-sm mt-1">{errors.maxDiscount.message}</p>
                )}
              </div>
            )}
          </div>

          {/* --- Giới hạn & Ngày --- */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minOrder">Đơn hàng tối thiểu (₫)</Label>
              <Input id="minOrder" type="number" {...register("minOrder")} />
            </div>
            <div>
              <Label htmlFor="usageLimit">Giới hạn số lần dùng</Label>
              <Input id="usageLimit" type="number" {...register("usageLimit")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expiryDate">Ngày hết hạn</Label>
              <Input
                id="expiryDate"
                type="date"
                {...register("expiryDate")}
                min={new Date().toISOString().split("T")[0]}
              />
              {errors.expiryDate && (
                <p className="text-red-500 text-sm mt-1">{errors.expiryDate.message}</p>
              )}
            </div>
            <div className="flex items-center pt-6">
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center space-x-2">
                    <Switch id="isActive" checked={field.value} onCheckedChange={field.onChange} />
                    <Label htmlFor="isActive">Hoạt động</Label>
                  </div>
                )}
              />
            </div>
          </div>

          <DialogFooter className="pt-6">
            <Button type="button" variant="outline" onClick={resetForm}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : modalMode === "create" ? (
                "Tạo mã"
              ) : (
                "Lưu thay đổi"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DiscountModal;
