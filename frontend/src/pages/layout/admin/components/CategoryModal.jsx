import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, X, Upload } from 'lucide-react';

const CategoryModal = ({ showModal, setShowModal, modalMode, currentCategory, parentCategories, isSubmitting, onFormSubmit }) => {
    const [previewImage, setPreviewImage] = useState(null);
    
    const { register, handleSubmit, reset, setValue, watch } = useForm();

    // Reset form khi mở modal
    useEffect(() => {
        if (showModal) {
            if (modalMode === 'edit' && currentCategory) {
                reset({
                    name: currentCategory.name,
                    slug: currentCategory.slug,
                    description: currentCategory.description,
                    parent: currentCategory.parent || "root",
                    customPath: currentCategory.customPath || "",
                });
                // Hiển thị ảnh cũ
                const img = currentCategory.image;
                setPreviewImage(img ? (img.startsWith('http') ? img : `/${img}`) : null);
            } else if (modalMode === 'create') {
                reset({ name: "", slug: "", description: "", parent: "root", customPath: "" });
                setPreviewImage(null);
            } else if (modalMode === 'child' && currentCategory) {
                 // Tạo con cho category hiện tại
                 reset({ name: "", slug: "", description: "", parent: currentCategory._id, customPath: "" });
                 setPreviewImage(null);
            }
        }
    }, [showModal, modalMode, currentCategory, reset]);

    // Xử lý khi chọn file
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    // Xử lý Submit
    const onSubmit = (data) => {
        const formData = new FormData();
        formData.append('name', data.name);
        if (data.slug) formData.append('slug', data.slug);
        if (data.description) formData.append('description', data.description);
        if (data.customPath) formData.append('customPath', data.customPath);
        
        // Xử lý Parent
        if (modalMode === 'child') {
             formData.append('parent', currentCategory._id); // Parent cố định
        } else if (data.parent && data.parent !== 'root') {
            formData.append('parent', data.parent);
        }

        // Lấy file từ input
        const fileInput = document.getElementById('category-image');
        if (fileInput && fileInput.files[0]) {
            formData.append('image', fileInput.files[0]);
        }

        onFormSubmit(formData); 
    };

    return (
        <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {modalMode === 'create' ? 'Thêm Danh Mục Gốc' : 
                         modalMode === 'edit' ? `Sửa: ${currentCategory?.name}` : 
                         `Thêm con cho: ${currentCategory?.name}`}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Tên danh mục</Label>
                            <Input {...register("name", { required: true })} placeholder="VD: Sofa Da" />
                        </div>
                        <div>
                            <Label>Slug (Tùy chọn)</Label>
                            <Input {...register("slug")} placeholder="sofa-da" />
                        </div>
                    </div>
                    
                    {/* Chỉ hiện chọn cha nếu không phải đang tạo con trực tiếp */}
                    {modalMode !== 'child' && (
                        <div>
                            <Label>Danh mục cha</Label>
                            <Select onValueChange={(val) => setValue("parent", val)} defaultValue={watch("parent") || "root"}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="root">-- Danh mục gốc (Root) --</SelectItem>
                                    {parentCategories.map(cat => (
                                        // Tránh chọn chính nó làm cha
                                        (modalMode !== 'edit' || cat._id !== currentCategory?._id) && (
                                            <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>
                                        )
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    
                    <div>
                         <Label>Mô tả</Label>
                         <Input {...register("description")} />
                    </div>

                    <div>
                        <Label>Đường dẫn tùy chỉnh (Custom Path)</Label>
                        <Input {...register("customPath")} placeholder="VD: /flash-sale (Để trống nếu mặc định)" />
                        <p className="text-xs text-gray-500 mt-1">Dùng cho mục menu đặc biệt (Flash Sale, Hàng Mới...).</p>
                    </div>

                    {/* ✅ INPUT ẢNH VÀ PREVIEW */}
                    <div>
                        <Label>Ảnh Banner</Label>
                        <div className="mt-2 flex items-center gap-4">
                            <div className="relative w-32 h-32 border rounded flex items-center justify-center bg-gray-50 overflow-hidden">
                                {previewImage ? (
                                    <>
                                        <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                                        <Button 
                                            type="button" size="icon" variant="destructive" 
                                            className="absolute top-1 right-1 h-6 w-6" 
                                            onClick={() => { 
                                                setPreviewImage(null); 
                                                document.getElementById('category-image').value = ""; 
                                            }}
                                        >
                                            <X className="w-3 h-3" />
                                        </Button>
                                    </>
                                ) : (
                                    <Upload className="w-8 h-8 text-gray-300" />
                                )}
                            </div>
                            <Input id="category-image" type="file" accept="image/*" onChange={handleImageChange} className="max-w-[250px]" />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setShowModal(false)} disabled={isSubmitting}>Hủy</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="animate-spin mr-2 h-4 w-4" />} Lưu
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CategoryModal;