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
import { Switch } from "@/components/ui/switch";
import { X, Loader2 } from "lucide-react";
import { productSchema } from "../schema/productSchema";
import { toast } from "sonner";

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
  setPreviewImages,
  previewImages,
}) => {
  const [brands, setBrands] = useState([]);

  // ✅ Fetch danh sách thương hiệu
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/products/brands");
        if (!res.ok) throw new Error("Không thể lấy danh sách brand");
        const data = await res.json();

        const formatted =
          Array.isArray(data) && typeof data[0] === "string"
            ? data.map((b) => ({ value: b, label: b }))
            : data;

        setBrands(formatted);
      } catch (err) {
        console.error("❌ Lỗi khi tải brands:", err);
        toast.error("Không thể tải danh sách thương hiệu");
        // fallback nếu API lỗi
        setBrands([
          { value: "Việt Nam", label: "Việt Nam" },
          { value: "Mỹ", label: "Mỹ" },
          { value: "Nhật Bản", label: "Nhật Bản" },
        ]);
      }
    };

    fetchBrands();
  }, []);

  // ✅ Default values
  const defaultValues = useMemo(() => {
    const product = currentProduct;
    const defaultCategory = categories[0]?.slug || "";
    return {
      name: product?.name || "",
      description: product?.description || "",
      category: product?.category?.slug || product?.category || defaultCategory,
      brand: product?.brand || "",
      price: String(product?.price || 0),
      stock: String(product?.stock || 0),
      discount: String(product?.discount || 0),
      status: product?.status || "còn hàng",
      images: product?.images || [],
      isFlashSale: product?.isFlashSale || false,
      flashSalePrice: String(product?.flashSalePrice || ""),
      flashSaleStart: product?.flashSaleStart
        ? new Date(product.flashSaleStart).toISOString().slice(0, 16)
        : "",
      flashSaleEnd: product?.flashSaleEnd
        ? new Date(product.flashSaleEnd).toISOString().slice(0, 16)
        : "",
    };
  }, [currentProduct, categories]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues,
  });

  const watchedPrice = Number(watch("price")) || 0;
  const watchedDiscount = Number(watch("discount")) || 0;
  const watchedImages = watch("images");
  const isFlashSale = watch("isFlashSale");

  const finalPrice = useMemo(() => {
    if (watchedDiscount > 0 && watchedDiscount <= 100) {
      return Math.round(watchedPrice * (1 - watchedDiscount / 100));
    }
    return watchedPrice;
  }, [watchedPrice, watchedDiscount]);

  useEffect(() => {
    if (showModal) {
      const imageUrls = (currentProduct?.images || []).map((img) =>
        typeof img === "string" ? img : img.path || ""
      );
      setPreviewImages(imageUrls);
      reset(defaultValues);
    }
  }, [showModal, currentProduct, defaultValues, reset, setPreviewImages]);

  const resetForm = () => {
    reset();
    setPreviewImages([]);
    setShowModal(false);
  };

  const onSubmit = async (data) => {
    data.price = Number(data.price);
    data.discount = Number(data.discount);
    data.stock = Number(data.stock);
    if (data.flashSalePrice) data.flashSalePrice = Number(data.flashSalePrice);

    const imageFiles = Array.from(data.images || []).filter(
      (item) => item instanceof File
    );

    const existingImages = (Array.isArray(watchedImages) ? watchedImages : []).filter(
      (item) => typeof item === "string"
    );

    let success = false;
    try {
      if (modalMode === "create") {
        success = await createProduct(data, imageFiles);
        if (success) toast.success("🎉 Thêm sản phẩm thành công!");
        else toast.error("❌ Thêm sản phẩm thất bại!");
      } else {
        success = await updateProduct(
          currentProduct._id,
          { ...data, existingImages },
          imageFiles
        );
        if (success) toast.success("✅ Cập nhật sản phẩm thành công!");
        else toast.error("❌ Cập nhật thất bại!");
      }

      if (success) resetForm();
    } catch (err) {
      console.error(err);
      toast.error("❌ Có lỗi xảy ra!");
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    const existing =
      Array.isArray(watchedImages) && watchedImages
        ? watchedImages.filter((i) => typeof i === "string")
        : [];
    const newItems = [...existing, ...files].slice(0, 5);
    setValue("images", newItems);
    setPreviewImages(
      newItems.map((i) => (i instanceof File ? URL.createObjectURL(i) : i))
    );
  };

  const removeImage = (index) => {
    const newArr = (Array.isArray(watchedImages) ? watchedImages : []).filter(
      (_, i) => i !== index
    );
    setValue("images", newArr);
    setPreviewImages(
      newArr.map((i) => (i instanceof File ? URL.createObjectURL(i) : i))
    );
  };

  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {modalMode === "create"
              ? "Thêm sản phẩm mới"
              : `Chỉnh sửa: ${currentProduct?.name}`}
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
                  <SelectItem key={c.slug} value={c.slug}>
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
              <p className="font-bold text-red-600">{formatCurrency(finalPrice)}</p>
            </div>
          </div>

          {/* --- Flash Sale --- */}
          <div className="border-t pt-3">
            <div className="flex items-center justify-between">
              <Label>Bật Flash Sale</Label>
              <Switch
                checked={isFlashSale}
                onCheckedChange={(checked) => setValue("isFlashSale", checked)}
              />
            </div>

            {isFlashSale && (
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <Label>Giá Flash Sale (VNĐ)</Label>
                  <Input type="number" {...register("flashSalePrice")} />
                </div>
                <div>
                  <Label>Thời gian bắt đầu</Label>
                  <Input type="datetime-local" {...register("flashSaleStart")} />
                </div>
                <div>
                  <Label>Thời gian kết thúc</Label>
                  <Input type="datetime-local" {...register("flashSaleEnd")} />
                </div>
              </div>
            )}
          </div>

          {/* --- Trạng thái --- */}
          <div>
            <Label htmlFor="status">Trạng thái</Label>
            <Select
              onValueChange={(v) => setValue("status", v)}
              value={watch("status")}
            >
              <SelectTrigger>
                <SelectValue />
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
            <Button type="button" variant="outline" onClick={resetForm}>
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
