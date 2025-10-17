// File: src/pages/Admin/components/ProductTable.jsx
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Edit, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator'; // Import Separator để chia tách giá

const DB_STATUSES = [
  { value: 'còn hàng', label: 'Còn hàng' },
  { value: 'hết hàng', label: 'Hết hàng' },
  { value: 'đặt trước', label: 'Sắp về' }
];

const formatCurrency = (num) => {
  // Đảm bảo giá trị là số hợp lệ
  const validNum = typeof num === 'number' && isFinite(num) ? num : 0;
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(validNum || 0);
};
const getStatusLabel = (value) => {
  return DB_STATUSES.find(s => s.value === value)?.label || value;
}

const ProductTable = ({
  products, loading, totalPages, currentPage, totalProductsCount, itemsPerPage,
  setCurrentPage, openModal, handleDeleteClick, getCategoryName
}) => {

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalProductsCount);


  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (products.length === 0 && totalProductsCount > 0) {
    return <p className="text-center text-gray-500 p-12">Không tìm thấy sản phẩm nào khớp với bộ lọc.</p>;
  }

  if (products.length === 0) {
    return <p className="text-center text-gray-500 p-12">Chưa có sản phẩm nào trong database.</p>;
  }


  return (
    <div className="bg-white rounded-lg shadow-xl border overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="min-w-full divide-y divide-gray-200">
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead className="w-[200px]">Tên sản phẩm</TableHead>
              <TableHead className="w-[150px]">Mô tả</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead>Thương hiệu</TableHead>

              {/* ✅ THÊM CỘT GIẢM GIÁ */}
              <TableHead className="w-[80px] text-center">Giảm giá</TableHead>

              {/* ✅ CỘT GIÁ (Tăng độ rộng để chứa 2 dòng giá) */}
              <TableHead className="w-[160px]">Giá bán</TableHead>

              <TableHead className="w-[70px]">Tồn kho</TableHead>
              <TableHead className="w-[100px]">Trạng thái</TableHead>
              <TableHead className="w-[70px]">Đã bán</TableHead>
              <TableHead className="text-center w-[60px]">Ảnh</TableHead>
              <TableHead className="text-right w-[100px]">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100">
            {products.map((product) => (
              <TableRow key={product._id} className="hover:bg-gray-50 transition-colors">
                {/* ID */}
                <TableCell title={product._id} className="text-xs text-gray-500">{product._id?.slice(0, 6)}...</TableCell>
                {/* Tên */}
                <TableCell className="font-semibold text-gray-900">{product.name}</TableCell>
                {/* MÔ TẢ */}
                <TableCell className="text-xs text-gray-600">
                  <p className="line-clamp-2 max-w-[150px]">{product.description}</p>
                </TableCell>
                {/* Danh mục */}
                <TableCell className="text-sm">
                  {typeof product.category === 'object' && product.category?.slug
                    ? getCategoryName(product.category.slug)
                    : getCategoryName(product.category)
                  }
                </TableCell>
                {/* Thương hiệu */}
                <TableCell className="text-sm">{product.brand}</TableCell>

                {/* ✅ CỘT GIẢM GIÁ */}
                <TableCell className="text-center font-bold text-sm">
                  {product.discount > 0 ? (
                    <span className="text-red-600">{product.discount}%</span>
                  ) : (
                    <span className="text-gray-400">0%</span>
                  )}
                </TableCell>

                {/* ✅ CỘT GIÁ (HIỂN THỊ CẢ GIÁ GỐC VÀ GIÁ GIẢM) */}
                <TableCell className="flex flex-col space-y-0.5 justify-center">
                  {product.discount > 0 && (
                    <span className="text-xs text-gray-400 line-through">
                      {formatCurrency(product.price)}
                    </span>
                  )}
                  <span className={`font-bold ${product.discount > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                    {formatCurrency(product.finalPrice || product.price)}
                  </span>
                </TableCell>

                {/* Tồn kho */}
                <TableCell className="font-medium">{product.stock}</TableCell>
                {/* Trạng thái */}
                <TableCell>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${product.status === 'còn hàng' ? 'bg-green-100 text-green-800' :
                    product.status === 'hết hàng' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                    {getStatusLabel(product.status)}
                  </span>
                </TableCell>
                {/* Đã bán */}
                <TableCell>{product.sold || 0}</TableCell>
                {/* Hình ảnh */}
                <TableCell className="text-center">
                  {(product.images || []).length > 0 ? (
                    <span className="text-green-600 font-medium">{(product.images || []).length}</span>
                  ) : (
                    <ImageIcon className="w-4 h-4 text-gray-400 mx-auto" />
                  )}
                </TableCell>

                {/* Thao tác */}
                <TableCell className="text-right whitespace-nowrap">
                  <Button variant="ghost" size="icon" onClick={() => openModal('edit', product)} title="Chỉnh sửa">
                    <Edit className="w-4 h-4 text-blue-500" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(product._id, product.name)} title="Xóa">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Hiển thị {startItem} - {endItem} trên {totalProductsCount} sản phẩm
          </span>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-600">
              Trang {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductTable;