import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ListTree, Plus, Edit, Trash2, Loader2, Folder, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// ✅ Import Modal Mới
import CategoryModal from './CategoryModal';

// Component đệ quy hiển thị cây danh mục (Giữ nguyên logic hiển thị)
const CategoryTreeItem = ({ category, openModal, handleDelete, level = 0, categories }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Hàm tìm tên cha
  const getParentName = (parentId) => {
    const parent = categories.find(c => c._id === parentId);
    return parent ? parent.name : 'ROOT';
  };

  const hasChildren = category.children?.length > 0;
  const rowClass = level > 0 ? `bg-gray-${level * 50} hover:bg-gray-${level * 50 + 50}` : 'hover:bg-gray-50';

  // Hiển thị ảnh nhỏ (thumbnail) trong bảng
  const imageSrc = category.image ? (category.image.startsWith('http') ? category.image : `/${category.image}`) : null;

  return (
    <>
      <TableRow className={rowClass}>
        <TableCell style={{ paddingLeft: `${level * 1.5 + 1}rem` }} className="font-medium flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)} className="h-6 w-6 p-0" disabled={!hasChildren}>
            {hasChildren ? (isExpanded ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />) : <span className="w-4" />}
          </Button>
          {/* Hiển thị ảnh thumbnail */}
          {imageSrc && <img src={imageSrc} alt="" className="w-8 h-8 rounded object-cover border" />}
          {category.name}
        </TableCell>
        <TableCell>{category.slug}</TableCell>
        <TableCell>{category.customPath || '-'}</TableCell> {/* Hiển thị customPath */}
        <TableCell>{category.parent ? getParentName(category.parent) : 'ROOT'}</TableCell>
        <TableCell className="text-right whitespace-nowrap">
          <Button variant="ghost" size="icon" onClick={() => openModal('child', category)} title="Thêm danh mục con">
            <Plus className="w-4 h-4 text-green-600" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => openModal('edit', category)} title="Chỉnh sửa">
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(category._id, category.name)} title="Xóa">
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </TableCell>
      </TableRow>
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
  const [modalMode, setModalMode] = useState('create');
  const [currentCategory, setCurrentCategory] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories');
      setCategories(res.data || []);
    } catch (error) {
      toast.error('Không thể tải dữ liệu danh mục.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Hàm phẳng danh sách categories (dùng để truyền vào Modal chọn cha)
  const flattenedCategories = useMemo(() => {
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


  // --- UI & DATA HANDLERS ---

  const openModal = (mode, category = null) => {
    setModalMode(mode);
    setCurrentCategory(category);
    setShowModal(true);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa danh mục "${name}"?`)) {
      try {
        await api.delete(`/categories/${id}`);
        toast.success(`Đã xóa danh mục ${name}.`);
        fetchCategories();
      } catch (error) {
        toast.error('Xóa danh mục thất bại.');
      }
    }
  };

  // ✅ HÀM SUBMIT MỚI (GỬI FORMDATA)
  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };

      if (modalMode === 'create') {
        await api.post('/categories', formData, config);
        toast.success('Tạo danh mục thành công!');

      } else if (modalMode === 'child') {
        // Logic tạo con (Backend đã hỗ trợ nhận parentId từ body, nên dùng chung logic create)
        // Hoặc dùng route riêng nếu bạn muốn
        // Ở đây formData đã có 'parent', nên gọi POST /categories là đủ
        await api.post(`/categories`, formData, config);
        toast.success(`Thêm danh mục con thành công!`);

      } else if (modalMode === 'edit') {
        await api.put(`/categories/${currentCategory._id}`, formData, config);
        toast.success('Cập nhật danh mục thành công!');
      }

      fetchCategories();
      setShowModal(false);

    } catch (error) {
      console.error('Lỗi xử lý danh mục:', error);
      toast.error(error.response?.data?.message || 'Thao tác thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <TableHead className="w-[40%]">Tên Danh mục</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Custom Path</TableHead>
              <TableHead>Danh mục Cha</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" /></TableCell></TableRow>
            ) : categories.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">Chưa có danh mục nào.</TableCell></TableRow>
            ) : (
              categories.map(cat => (
                <CategoryTreeItem
                  key={cat._id}
                  category={cat}
                  openModal={openModal}
                  handleDelete={handleDelete}
                  categories={flattenedCategories}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ✅ MODAL MỚI */}
      <CategoryModal
        showModal={showModal}
        setShowModal={setShowModal}
        modalMode={modalMode}
        currentCategory={currentCategory}
        parentCategories={flattenedCategories} // Truyền danh sách để chọn cha
        isSubmitting={isSubmitting}
        onFormSubmit={handleFormSubmit}
      />
    </div>
  );
};

export default CategoryManagement;