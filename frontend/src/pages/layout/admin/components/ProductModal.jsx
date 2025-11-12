// File: src/pages/Admin/components/ProductModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
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
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { productSchema } from "../schema/productSchema";

const DB_STATUSES = [
  { value: "còn hàng", label: "Còn hàng" },
  { value: "hết hàng", label: "Hết hàng" },
  { value: "đặt trước", label: "Sắp về" },
];

const formatCurrency = (num) =>
  new Intl.NumberFormat("vi-VN").format(Number(num) || 0) + "đ";

const ProductModal = ({
  showModal,
  setShowModal,
  modalMode,
  currentProduct = {},
  categories = [],
  isSubmitting,
  createProduct,
  updateProduct,
}) => {
  const [brands, setBrands] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);

  // ✅ Lấy danh sách brand
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/products/brands");
        const data = await res.json();
        const formatted =
          Array.isArray(data) && typeof data[0] === "string"
            ? data.map((b) => ({ value: b, label: b }))
            : data;
        setBrands(formatted);
      } catch {
        setBrands([
          { value: "Việt Nam", label: "Việt Nam" },
          { value: "Mỹ", label: "Mỹ" },
          { value: "Nhật Bản", label: "Nhật Bản" },
        ]);
      }
    };
    fetchBrands();
  }, []);

  // ✅ Setup form
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(productSchema),
  });

  const watchedPrice = Number(watch("price")) || 0;
  const watchedDiscount = Number(watch("discount")) || 0;

  const finalPrice = useMemo(() => {
    if (watchedDiscount > 0 && watchedDiscount <= 100) {
      return Math.round(watchedPrice * (1 - watchedDiscount / 100));
    }
    return watchedPrice;
  }, [watchedPrice, watchedDiscount]);

  // ✅ Khi mở modal => chỉ reset 1 lần
  useEffect(() => {
    if (showModal) {
      if (modalMode === "edit" && currentProduct) {
        const imageUrls = (currentProduct.images || []).map((img) =>
          typeof img === "string" ? img : img.path || ""
        );
        setPreviewImages(imageUrls);
        reset({
          name: currentProduct.name || "",
          description: currentProduct.description || "",
          category:
            currentProduct.category?._id ||
            currentProduct.category ||
            categories[0]?._id ||
            "",
          brand: currentProduct.brand || "",
          price: String(currentProduct.price || 0),
          stock: String(currentProduct.stock || 0),
          discount: String(currentProduct.discount || 0),
          status: currentProduct.status || "còn hàng",
        });
      } else {
        reset({
          name: "",
          description: "",
          category: categories[0]?._id || "",
          brand: "",
          price: "0",
          stock: "0",
          discount: "0",
          status: "còn hàng",
        });
        setPreviewImages([]);
        setSelectedFiles([]);
      }
    }
  }, [showModal]);

  // ✅ Khi chọn ảnh mới
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    const newFiles = [...selectedFiles, ...files].slice(0, 5);
    setSelectedFiles(newFiles);

    const newPreviews = [
      ...previewImages,
      ...files.map((f) => URL.createObjectURL(f)),
    ].slice(0, 5);
    setPreviewImages(newPreviews);
  };

  // ✅ Xóa ảnh
  const removeImage = (index) => {
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // ✅ Đóng modal
  const closeModal = () => {
    reset();
    setPreviewImages([]);
    setSelectedFiles([]);
    setShowModal(false);
  };

  // ✅ Submit
  const onSubmit = async (data) => {
    const imageFiles = selectedFiles;
    const existingImages = previewImages.filter(
      (img) => typeof img === "string"
    );

    try {
      let success = false;
      if (modalMode === "create") {
        success = await createProduct(data, imageFiles);
      } else {
        success = await updateProduct(
          currentProduct._id,
          data,
          imageFiles,
          existingImages
        );
      }

      if (success) {
        toast.success(
          modalMode === "create"
            ? "🎉 Thêm sản phẩm thành công!"
            : "✅ Cập nhật sản phẩm thành công!"
        );
        closeModal();
      } else {
        toast.error("❌ Có lỗi xảy ra khi lưu sản phẩm!");
      }
    } catch (err) {
      console.error(err);
      toast.error("❌ Lỗi kết nối máy chủ!");
    }
  };

  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {modalMode === "create"
              ? "Thêm sản phẩm mới"
              : `Chỉnh sửa: ${currentProduct?.name || ""}`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* --- Tên sản phẩm --- */}
          <div>
            <Label htmlFor="name">Tên sản phẩm</Label>
            <Input id="name" {...register("name")} />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name.message}</p>
            )}
          </div>

          {/* --- Danh mục --- */}
          <div>
            <Label htmlFor="category">Danh mục</Label>
            <Select
              onValueChange={(v) => setValue("category", v)}
              value={watch("category")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn danh mục" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* --- Thương hiệu --- */}
          <div>
            <Label htmlFor="brand">Thương hiệu</Label>
            <Select
              onValueChange={(v) => setValue("brand", v)}
              value={watch("brand")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn thương hiệu" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((b) => (
                  <SelectItem key={b.value} value={b.value}>
                    {b.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.brand && (
              <p className="text-red-500 text-sm">{errors.brand.message}</p>
            )}
          </div>

          {/* --- Mô tả --- */}
          <div>
            <Label htmlFor="description">Mô tả</Label>
            <textarea
              id="description"
              {...register("description")}
              rows={3}
              className="w-full border rounded-md p-2"
            />
          </div>

          {/* --- Giá, tồn kho, giảm giá --- */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Giá (VNĐ)</Label>
              <Input id="price" type="number" {...register("price")} />
            </div>
            <div>
              <Label htmlFor="stock">Tồn kho</Label>
              <Input id="stock" type="number" {...register("stock")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="discount">Giảm giá (%)</Label>
              <Input id="discount" type="number" {...register("discount")} />
            </div>
            <div>
              <Label>Giá sau giảm</Label>
              <p className="font-bold text-red-600">
                {formatCurrency(finalPrice)}
              </p>
            </div>
          </div>

          {/* --- Trạng thái --- */}
          <div>
            <Label htmlFor="status">Trạng thái</Label>
            <Select
              onValueChange={(v) => setValue("status", v)}
              value={watch("status")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {DB_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* --- Ảnh --- */}
          <div>
            <Label>Hình ảnh (tối đa 5)</Label>
            <Input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
            />
            <div className="grid grid-cols-5 gap-2 mt-2">
              {previewImages.map((src, i) => (
                <div key={i} className="relative">
                  <img
                    src={src}
                    alt={`preview ${i}`}
                    className="w-full h-24 object-cover rounded"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute top-0 right-0 h-5 w-5 p-0 bg-red-600 hover:bg-red-700"
                    onClick={() => removeImage(i)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* --- Nút --- */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeModal}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {modalMode === "create" ? "Thêm mới" : "Cập nhật"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductModal;
