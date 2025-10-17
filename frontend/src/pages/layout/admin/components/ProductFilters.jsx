// File: src/pages/Admin/components/ProductFilters.jsx
import React from 'react';
import { Search, Plus, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const DB_STATUSES = [
  { value: 'còn hàng', label: 'Còn hàng' },
  { value: 'hết hàng', label: 'Hết hàng' },
  { value: 'đặt trước', label: 'Sắp về' }
];
const SORT_OPTIONS = [
  { value: '_id', label: 'ID' },
  { value: 'name', label: 'Tên' },
  { value: 'price', label: 'Giá' },
  { value: 'stock', label: 'Tồn kho' },
  { value: 'sold', label: 'Đã bán' },
  { value: 'createdAt', label: 'Ngày tạo' },
];

const ProductFilters = ({
  searchTerm, setSearchTerm, categories, selectedCategory, setSelectedCategory,
  selectedStatus, setSelectedStatus, sortBy, setSortBy, sortOrder, setSortOrder,
  openModal,
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Tìm kiếm sản phẩm..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
            }}
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Tất cả danh mục" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả danh mục</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.slug} value={cat.slug}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Tất cả trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            {DB_STATUSES.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => openModal('create')} disabled={categories.length === 0}>
          <Plus className="w-5 h-5 mr-2" />
          Thêm sản phẩm
        </Button>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center space-x-4 pt-4 border-t">
        <span className="text-sm text-gray-600">Sắp xếp theo:</span>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
        >
          {sortOrder === 'asc' ? '↑ Tăng dần' : '↓ Giảm dần'}
        </Button>
      </div>
    </div>
  );
};

export default ProductFilters;