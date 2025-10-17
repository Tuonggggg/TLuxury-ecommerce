// File: src/pages/Admin/components/ProductModal.jsx
import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { X, Loader2 } from 'lucide-react';
import { productSchema } from '../schema/productSchema';
import { toast } from 'sonner';

const DB_STATUSES = [
  { value: 'còn hàng', label: 'Còn hàng' },
  { value: 'hết hàng', label: 'Hết hàng' },
  { value: 'đặt trước', label: 'Sắp về' }
];

// Helper để định dạng tiền tệ
const formatCurrency = (num) => {
  const validNum = typeof num === 'number' && isFinite(num) ? num : 0;
  return new Intl.NumberFormat('vi-VN').format(validNum) + 'đ';
};

const ProductModal = ({
  showModal, setShowModal, modalMode, currentProduct = {}, categories = [],
  isSubmitting, createProduct, updateProduct,
  setPreviewImages, previewImages,
}) => {

  // ÁNH XẠ GIÁ TRỊ MẶC ĐỊNH SANG DẠNG STRING AN TOÀN
  const defaultValues = useMemo(() => {
    const product = currentProduct;
    const defaultCategory = categories[0]?.slug || '';

    return {
      name: product?.name || '',
      description: product?.description || '',
      category: product?.category?.slug || product?.category || defaultCategory,
      brand: product?.brand || '',
      price: String(product?.price || 0),
      stock: String(product?.stock || 0),
      // ✅ THÊM DISCOUNT VÀ CHUYỂN THÀNH STRING
      discount: String(product?.discount || 0),
      status: product?.status || 'còn hàng',
      images: product?.images || [],
    };
  }, [currentProduct, categories]);


  const { register, handleSubmit, formState: { errors }, setValue, reset, watch } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: defaultValues,
  });

  // Theo dõi giá gốc và giảm giá để hiển thị Preview
  const watchedPrice = Number(watch('price')) || 0;
  const watchedDiscount = Number(watch('discount')) || 0;
  const watchedImages = watch('images');

  // LOGIC TÍNH GIÁ SAU GIẢM (PREVIEW)
  const finalPrice = useMemo(() => {
    if (watchedDiscount > 0 && watchedDiscount <= 100) {
      return Math.round(watchedPrice * (1 - watchedDiscount / 100));
    }
    return watchedPrice;
  }, [watchedPrice, watchedDiscount]);


  // ✅ CẬP NHẬT FORM KHI MODAL MỞ
  useEffect(() => {
    if (showModal) {
      const imageUrls = (currentProduct?.images || []).map(img => typeof img === 'string' ? img : img.path || '');
      setPreviewImages(imageUrls);
      reset(defaultValues); // Reset form với defaultValues mới nhất
    }
  }, [showModal, currentProduct, defaultValues, reset, setPreviewImages]);


  const resetForm = () => {
    reset();
    setPreviewImages([]);
    setShowModal(false);
  };

  const onSubmit = async (data) => {
    // Tách file mới và URL cũ
    const imageFiles = Array.from(data.images).filter(item => item instanceof File);
    const existingUrls = (Array.isArray(watchedImages) ? watchedImages : []).filter(item => typeof item === 'string');

    let success = false;
    if (modalMode === 'create') {
      success = await createProduct(data, imageFiles);
    } else {
      success = await updateProduct(currentProduct._id, data, imageFiles, existingUrls);
    }
    if (success) resetForm();
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    const existing = Array.isArray(watchedImages) ? watchedImages.filter(i => typeof i === 'string') : [];
    const newItems = [...existing, ...files].slice(0, 5);
    setValue('images', newItems);
    setPreviewImages(newItems.map(i => (i instanceof File ? URL.createObjectURL(i) : i)));
  };

  const removeImage = (index) => {
    const newArr = (Array.isArray(watchedImages) ? watchedImages : []).filter((_, i) => i !== index);
    setValue('images', newArr);
    setPreviewImages(newArr.map(i => (i instanceof File ? URL.createObjectURL(i) : i)));
  };

  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{modalMode === 'create' ? 'Thêm sản phẩm mới' : `Chỉnh sửa: ${currentProduct?.name}`}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Tên sản phẩm</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
          </div>

          <div>
            <Label htmlFor="category">Danh mục</Label>
            <Select onValueChange={v => setValue('category', v)} value={watch('category')}>
              <SelectTrigger><SelectValue placeholder="Chọn danh mục" /></SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-red-500 text-sm">{errors.category.message}</p>}
          </div>

          {/* TRƯỜNG DESCRIPTION (TEXTAREA) */}
          <div>
            <Label htmlFor="description">Mô tả sản phẩm</Label>
            <textarea
              id="description"
              {...register('description')}
              rows={4}
              placeholder="Nhập mô tả sản phẩm..."
              className="w-full border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div><Label htmlFor="brand">Thương hiệu</Label><Input id="brand" {...register('brand')} />{errors.brand && <p className="text-red-500 text-sm">{errors.brand.message}</p>}</div>

          {/* HÀNG INPUT GIÁ GỐC VÀ TỒN KHO */}
          <div className="grid grid-cols-2 gap-4">
            <div><Label htmlFor="price">Giá (VNĐ)</Label><Input id="price" type="number" {...register('price')} />{errors.price && <p className="text-red-500 text-sm">{errors.price.message}</p>}</div>
            <div><Label htmlFor="stock">Tồn kho</Label><Input id="stock" type="number" {...register('stock')} />{errors.stock && <p className="text-red-500 text-sm">{errors.stock.message}</p>}</div>
          </div>


          {/* ✅ TRƯỜNG DISCOUNT MỚI VÀ PREVIEW GIÁ */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="discount">Giảm giá (%)</Label>
              <Input id="discount" type="number" min="0" max="100" {...register('discount')} />
              {errors.discount && <p className="text-red-500 text-sm">{errors.discount.message}</p>}
            </div>
            <div className="pt-2">
              <Label className="block mb-1">Giá sau giảm (Preview)</Label>
              <div className="flex flex-col">
                {watchedDiscount > 0 && watchedDiscount <= 100 && (
                  <span className="text-sm text-gray-500 line-through">
                    {formatCurrency(watchedPrice)}
                  </span>
                )}
                <span className="text-xl font-bold text-red-600">
                  {formatCurrency(finalPrice)}
                </span>
              </div>
            </div>
          </div>


          <div>
            <Label htmlFor="status">Trạng thái</Label>
            <Select onValueChange={v => setValue('status', v)} value={watch('status')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DB_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
            {errors.status && <p className="text-red-500 text-sm">{errors.status.message}</p>}
          </div>

          {/* ... (Phần Hình ảnh giữ nguyên) ... */}
          <div>
            <Label htmlFor="images">Hình ảnh (tối đa 5)</Label>
            <Input id="images" type="file" multiple accept="image/*" onChange={handleImageChange} className="mt-1" />
            {errors.images && <p className="text-red-500 text-sm">{errors.images.message}</p>}
            <div className="grid grid-cols-5 gap-2 mt-2">
              {previewImages.map((src, i) => (
                <div key={i} className="relative">
                  <img src={src} alt={`preview ${i}`} className="w-full h-24 object-cover rounded" />
                  <Button type="button" size="icon" variant="destructive" className="absolute top-0 right-0 h-5 w-5 p-0 bg-red-600 hover:bg-red-700" onClick={() => removeImage(i)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={resetForm} disabled={isSubmitting}>Hủy</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {modalMode === 'create' ? 'Thêm mới' : 'Cập nhật'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductModal;