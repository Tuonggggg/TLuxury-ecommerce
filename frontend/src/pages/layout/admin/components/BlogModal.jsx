import React, { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import TiptapEditor from '@/components/TiptapEditor';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, X } from 'lucide-react';

// Schema validation (Giữ nguyên)
const blogSchema = (isEditMode = false) => z.object({
  title: z.string().min(10, "Tiêu đề phải có ít nhất 10 ký tự"),
  excerpt: z.string().min(20, "Tóm tắt phải có ít nhất 20 ký tự").max(300, "Tóm tắt không quá 300 ký tự"),
  content: z.string().min(50, "Nội dung phải có ít nhất 50 ký tự (khoảng 10 từ)"),
  status: z.enum(['draft', 'published']),
  featuredImage: z.any().refine((files) => {
    if (isEditMode) return true;
    return files && files.length > 0;
  }, "Vui lòng chọn ảnh đại diện."),
});

const BlogModal = ({ showModal, setShowModal, modalMode, currentPost, isSubmitting, onFormSubmit }) => {
  const [previewImage, setPreviewImage] = useState(null);
  const isEditMode = modalMode === 'edit';

  const defaultValues = useMemo(() => ({
    title: currentPost?.title || "",
    excerpt: currentPost?.excerpt || "",
    content: currentPost?.content || "<p>Bắt đầu nhập nội dung...</p>",
    status: currentPost?.status || "draft",
    featuredImage: null, // Đặt là null (vì Controller xử lý FileList)
  }), [currentPost]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    control,
    reset,
    watch
  } = useForm({
    resolver: zodResolver(blogSchema(isEditMode)),
    defaultValues,
  });

  // useEffect (Load dữ liệu) (Giữ nguyên)
  useEffect(() => {
    if (showModal) {
      if (isEditMode && currentPost) {
        reset({
          title: currentPost.title,
          excerpt: currentPost.excerpt,
          content: currentPost.content,
          status: currentPost.status,
          featuredImage: null, // Đặt là null
        });
        setPreviewImage(currentPost.featuredImage?.url || null);
      } else {
        reset(defaultValues);
        setPreviewImage(null);
      }
    }
  }, [showModal, isEditMode, currentPost, defaultValues, reset]);

  const resetForm = () => {
    reset(defaultValues);
    setPreviewImage(null);
    setShowModal(false);
  };

  // ✅ Xử lý submit (ĐÃ SỬA LỖI LOGIC FILE)
  const onSubmit = async (data) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('excerpt', data.excerpt);
    formData.append('content', data.content);
    formData.append('status', data.status);

    // ✅ FIX: Kiểm tra FileList (data.featuredImage)
    // Nó là một đối tượng, không phải mảng, nhưng có thuộc tính 'length'
    const fileList = data.featuredImage;
    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      formData.append('featuredImage', file);
    }

    // Nếu là Edit mode mà không chọn ảnh mới, gửi lại ảnh cũ
    // (Logic này rất quan trọng để không làm mất ảnh khi Edit)
    if (isEditMode && (!fileList || fileList.length === 0) && currentPost.featuredImage?.url) {
      formData.append('existingImageUrl', currentPost.featuredImage.url);
      formData.append('existingImagePublicId', currentPost.featuredImage.public_id);
    }

    const success = await onFormSubmit(formData, currentPost?._id);
    if (success) resetForm();
  };

  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {modalMode === 'create' ? 'Tạo bài viết mới' : `Chỉnh sửa: ${currentPost?.title}`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">Tiêu đề</Label>
            <Input id="title" {...register("title")} />
            {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
          </div>

          <div>
            <Label htmlFor="excerpt">Tóm tắt (Mô tả ngắn)</Label>
            <Textarea id="excerpt" {...register("excerpt")} rows={3} />
            {errors.excerpt && <p className="text-red-500 text-sm">{errors.excerpt.message}</p>}
          </div>

          <div>
            <Label>Nội dung bài viết</Label>
            <Controller
              name="content"
              control={control}
              render={({ field }) => (
                <TiptapEditor
                  content={field.value}
                  onChange={field.onChange}
                  error={!!errors.content}
                />
              )}
            />
            {errors.content && <p className="text-red-500 text-sm">{errors.content.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Trạng thái</Label>
              <Select onValueChange={(v) => setValue("status", v)} value={watch("status")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Bản nháp (Draft)</SelectItem>
                  <SelectItem value="published">Công khai (Published)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="featuredImage">Ảnh đại diện</Label>
              <Controller
                name="featuredImage"
                control={control}
                render={({ field: { onChange, onBlur, name, ref } }) => (
                  <Input
                    id="featuredImage"
                    type="file"
                    accept="image/*"
                    onBlur={onBlur}
                    name={name}
                    ref={ref}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        onChange(e.target.files); // Cập nhật RHF bằng FileList
                        setPreviewImage(URL.createObjectURL(file));
                      }
                    }}
                  />
                )}
              />
              {errors.featuredImage && <p className="text-red-500 text-sm">{errors.featuredImage.message}</p>}
            </div>
          </div>

          {previewImage && (
            <div className="relative w-1/2">
              <img src={previewImage} alt="Preview" className="w-full h-32 object-cover rounded" />
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="absolute top-1 right-1 h-6 w-6"
                onClick={() => {
                  setPreviewImage(null);
                  setValue('featuredImage', [], { shouldValidate: true });
                }}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={resetForm}>Hủy</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {modalMode === "create" ? "Tạo bài viết" : "Cập nhật"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BlogModal;