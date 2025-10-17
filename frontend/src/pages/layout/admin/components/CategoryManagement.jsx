import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ListTree, Plus, Edit, Trash2, Loader2, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
// 🚨 THÊM IMPORTS THIẾU CỦA TABLE (Khắc phục ReferenceError: Table is not defined)
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Schema cho Category
const categorySchema = z.object({
  name: z.string().min(3, 'Tên danh mục ít nhất 3 ký tự'),
  slug: z.string().min(3, 'Slug ít nhất 3 ký tự'),
  description: z.string().optional(),
  parent: z.string().nullable().optional(), // ID của danh mục cha
});

// Component đệ quy hiển thị cây danh mục
const CategoryTreeItem = ({ category, openModal, handleDelete, level = 0, categories }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const getParentName = (parentId) => {
    // Tìm tên cha trong danh sách phẳng
    const parent = categories.find(c => c._id === parentId);
    return parent ? parent.name : 'ROOT';
  };

  // Tên cha của các category gốc là null, ta không hiển thị nút mở rộng/đóng
  const hasChildren = category.children?.length > 0;

  // Sử dụng màu nền khác nhau cho các cấp (level)
  const rowClass = level > 0 ? `bg-gray-${level * 50} hover:bg-gray-${level * 50 + 50}` : 'hover:bg-gray-50';

  return (
    <>
      <TableRow className={rowClass}>
        <TableCell style={{ paddingLeft: `${level * 1.5 + 1}rem` }} className="font-medium flex items-center">
          <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)} className="mr-2 h-7 w-7" disabled={!hasChildren}>
            {hasChildren ? (isExpanded ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />) : null}
          </Button>
          {category.name}
        </TableCell>
        <TableCell>{category.slug}</TableCell>
        <TableCell>{category.parent ? getParentName(category.parent) : 'ROOT'}</TableCell>
        <TableCell className="text-right whitespace-nowrap">
          {/* Nút thêm con */}
          <Button variant="ghost" size="icon" onClick={() => openModal('child', category)} title="Thêm danh mục con">
            <Plus className="w-4 h-4 text-green-600" />
          </Button>
          {/* Nút sửa */}
          <Button variant="ghost" size="icon" onClick={() => openModal('edit', category)} title="Chỉnh sửa">
            <Edit className="w-4 h-4" />
          </Button>
          {/* Nút xóa */}
          <Button variant="ghost" size="icon" onClick={() => handleDelete(category._id, category.name)} title="Xóa">
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </TableCell>
      </TableRow>
      {/* Đệ quy hiển thị con */}
      {isExpanded && category.children?.map(child => (
        <CategoryTreeItem
          key={child._id}
          category={child}
          openModal={openModal}
          handleDelete={handleDelete}
          level={level + 1}
          categories={categories}
        />
      ))}
    </>
  );
};


const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'child'
  const [currentCategory, setCurrentCategory] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);


  // Lấy danh sách Categories (đa cấp)
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      // Lấy tất cả category gốc và populate children
      const res = await api.get('/categories');
      setCategories(res.data || []);
    } catch (error) {
      console.error('Lỗi tải danh mục:', error);
      toast.error('Không thể tải dữ liệu danh mục.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const { register, handleSubmit, formState: { errors }, setValue, reset } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', slug: '', description: '', parent: null },
  });


  // ------------------------- UI & DATA HANDLERS -------------------------

  const openModal = (mode, category = null) => {
    setModalMode(mode);
    setCurrentCategory(category);
    reset();

    if (mode === 'edit' && category) {
      setValue('name', category.name);
      setValue('slug', category.slug);
      setValue('description', category.description);
      // Parent ID được giữ lại trong currentCategory để không cần set form
      // Nếu muốn cho phép chuyển cha, cần thêm Select cho parentId
    } else if (mode === 'child' && category) {
      // Tạo category con, cần lưu parentId cho form submit
      setValue('parent', category._id);
    }
    setShowModal(true);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa danh mục "${name}" và tất cả danh mục con, sản phẩm liên quan?`)) {
      try {
        await api.delete(`/categories/${id}`); // Gọi route DELETE /api/categories/:id
        toast.success(`Đã xóa danh mục ${name} thành công.`);
        fetchCategories();
      } catch (error) {
        console.error('Lỗi xóa danh mục:', error);
        toast.error(error.response?.data?.message || 'Xóa danh mục thất bại.');
      }
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (modalMode === 'create') {
        // POST /api/categories (parent = null)
        await api.post('/categories', data);
        toast.success('Thêm danh mục gốc thành công!');

      } else if (modalMode === 'child') {
        // POST /api/categories/:parentId/child
        const parentId = currentCategory._id; // Lấy ID cha từ state
        await api.post(`/categories/${parentId}/child`, data);
        toast.success(`Thêm danh mục con vào ${currentCategory.name} thành công!`);

      } else if (modalMode === 'edit') {
        // PUT /api/categories/:id
        await api.put(`/categories/${currentCategory._id}`, { ...data, parent: currentCategory.parent });
        toast.success('Cập nhật danh mục thành công!');
      }

      fetchCategories();
      setShowModal(false);
      reset();

    } catch (error) {
      console.error('Lỗi xử lý danh mục:', error);
      toast.error(error.response?.data?.message || 'Thao tác thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };


  // Hàm phẳng danh sách categories (dùng để tra cứu tên cha trong CategoryTreeItem)
  const flattenedCategories = useMemo(() => {
    // Lấy tất cả category (cha, con, cháu) vào một mảng phẳng
    const flatten = (cats) => {
      let result = [];
      (cats || []).forEach(cat => {
        result.push(cat);
        if (cat.children) {
          result = result.concat(flatten(cat.children));
        }
      });
      return result;
    };
    return flatten(categories);
  }, [categories]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <ListTree className="w-6 h-6 text-blue-600" /> Quản lý Danh mục
      </h2>

      <div className="flex justify-end">
        <Button onClick={() => openModal('create')} className="bg-green-600 hover:bg-green-700">
          <Plus className="w-5 h-5 mr-2" /> Thêm danh mục gốc
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-1/2">Tên Danh mục</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Danh mục Cha</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" /></TableCell></TableRow>
            ) : categories.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-gray-500">Chưa có danh mục gốc nào.</TableCell></TableRow>
            ) : (
              // Render các category gốc (parent: null)
              categories.map(cat => (
                <CategoryTreeItem
                  key={cat._id}
                  category={cat}
                  openModal={openModal}
                  handleDelete={handleDelete}
                  categories={flattenedCategories} // Danh sách phẳng để tra cứu tên cha
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>


      {/* Modal Form */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {modalMode === 'create' ? 'Thêm Danh mục gốc' : modalMode === 'edit' ? `Sửa: ${currentCategory?.name}` : `Thêm danh mục con cho ${currentCategory?.name}`}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Tên Danh mục</Label>
              <Input id="name" {...register('name')} placeholder="Ví dụ: SOFA DA" />
              {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input id="slug" {...register('slug')} placeholder="Ví dụ: sofa-da" />
              {errors.slug && <p className="text-red-500 text-sm">{errors.slug.message}</p>}
            </div>
            <div>
              <Label htmlFor="description">Mô tả</Label>
              <Input id="description" {...register('description')} placeholder="Mô tả ngắn gọn..." />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)} disabled={isSubmitting}>Hủy</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {modalMode === 'edit' ? 'Cập nhật' : 'Thêm'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoryManagement;