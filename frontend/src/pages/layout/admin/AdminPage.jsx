/* eslint-disable no-unused-vars */
import React, { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight, BarChart3, DollarSign, Package, ShoppingCart, Upload, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';

// Schema validation for product form
const productSchema = z.object({
  name: z.string().min(1, 'Tên sản phẩm là bắt buộc'),
  category: z.string().min(1, 'Danh mục là bắt buộc'),
  brand: z.string().min(1, 'Thương hiệu là bắt buộc'),
  price: z.number().min(0, 'Giá phải lớn hơn hoặc bằng 0'),
  stock: z.number().min(0, 'Tồn kho phải lớn hơn hoặc bằng 0'),
  status: z.enum(['Còn hàng', 'Hết hàng', 'Sắp về']),
  images: z.array(z.instanceof(File)).max(5, 'Tối đa 5 hình ảnh'),
});

// Mock data - sẽ thay bằng API sau này
const generateMockProducts = () => {
  const categories = ['Điện thoại', 'Laptop', 'Tablet', 'Phụ kiện', 'Đồng hồ'];
  const statuses = ['Còn hàng', 'Hết hàng', 'Sắp về'];
  const brands = ['Apple', 'Samsung', 'Xiaomi', 'Oppo', 'Vivo'];

  return Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    name: `Sản phẩm ${i + 1}`,
    category: categories[Math.floor(Math.random() * categories.length)],
    brand: brands[Math.floor(Math.random() * brands.length)],
    price: Math.floor(Math.random() * 50000000) + 1000000,
    stock: Math.floor(Math.random() * 200),
    status: statuses[Math.floor(Math.random() * statuses.length)],
    sold: Math.floor(Math.random() * 500),
    createdAt: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
    images: [],
  }));
};

const AdminDashboard = () => {
  const [products, setProducts] = useState(generateMockProducts());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [currentProduct, setCurrentProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('products');
  const [previewImages, setPreviewImages] = useState([]);

  const { register, handleSubmit, formState: { errors }, setValue, reset, watch } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      category: 'Điện thoại',
      brand: '',
      price: 0,
      stock: 0,
      status: 'Còn hàng',
      images: [],
    },
  });

  // Statistics calculation
  const statistics = useMemo(() => {
    const totalProducts = products.length;
    const totalRevenue = products.reduce((sum, p) => sum + (p.price * p.sold), 0);
    const totalSold = products.reduce((sum, p) => sum + p.sold, 0);
    const outOfStock = products.filter(p => p.status === 'Hết hàng').length;

    return { totalProducts, totalRevenue, totalSold, outOfStock };
  }, [products]);

  // Chart data
  const categoryData = useMemo(() => {
    const categories = {};
    products.forEach(p => {
      categories[p.category] = (categories[p.category] || 0) + 1;
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [products]);

  const monthlyData = useMemo(() => {
    const months = {};
    products.forEach(p => {
      const month = new Date(p.createdAt).toLocaleDateString('vi-VN', { month: 'short' });
      months[month] = (months[month] || 0) + p.sold;
    });
    return Object.entries(months).map(([month, sales]) => ({ month, sales }));
  }, [products]);

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  // Filter and search
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || product.status === selectedStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchTerm, selectedCategory, selectedStatus]);

  // Sort
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      if (sortBy === 'price' || sortBy === 'stock' || sortBy === 'sold') {
        aVal = Number(aVal);
        bVal = Number(bVal);
      }
      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });
  }, [filteredProducts, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedProducts.slice(start, start + itemsPerPage);
  }, [sortedProducts, currentPage, itemsPerPage]);

  // CRUD functions
  const handleCreate = async (data) => {
    // Chuẩn bị form data cho API
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('category', data.category);
    formData.append('brand', data.brand);
    formData.append('price', data.price);
    formData.append('stock', data.stock);
    formData.append('status', data.status);
    data.images.forEach((image, index) => {
      formData.append('images', image);
    });

    try {
      // Sau này: Gọi API
      // const response = await axios.post('/api/products', formData, {
      //   headers: { 'Content-Type': 'multipart/form-data' }
      // });
      const newProduct = {
        id: products.length + 1,
        ...data,
        sold: 0,
        createdAt: new Date().toISOString(),
        images: data.images.map(file => URL.createObjectURL(file)), // Mock image URLs
      };
      setProducts([...products, newProduct]);
      toast.success('Thêm sản phẩm thành công');
      resetForm();
    } catch (error) {
      toast.error('Lỗi khi thêm sản phẩm');
    }
  };

  const handleUpdate = async (data) => {
    // Chuẩn bị form data cho API
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('category', data.category);
    formData.append('brand', data.brand);
    formData.append('price', data.price);
    formData.append('stock', data.stock);
    formData.append('status', data.status);
    data.images.forEach((image, index) => {
      formData.append('images', image);
    });

    try {
      // Sau này: Gọi API
      // await axios.put(`/api/products/${currentProduct.id}`, formData, {
      //   headers: { 'Content-Type': 'multipart/form-data' }
      // });
      setProducts(products.map(p =>
        p.id === currentProduct.id ? {
          ...p,
          ...data,
          images: data.images.map(file => URL.createObjectURL(file)) // Mock image URLs
        } : p
      ));
      toast.success('Cập nhật sản phẩm thành công');
      resetForm();
    } catch (error) {
      toast.error('Lỗi khi cập nhật sản phẩm');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
      try {
        // Sau này: Gọi API
        // await axios.delete(`/api/products/${id}`);
        setProducts(products.filter(p => p.id !== id));
        toast.success('Xóa sản phẩm thành công');
      } catch (error) {
        toast.error('Lỗi khi xóa sản phẩm');
      }
    }
  };

  const openModal = (mode, product = null) => {
    setModalMode(mode);
    setCurrentProduct(product);
    if (product) {
      setValue('name', product.name);
      setValue('category', product.category);
      setValue('brand', product.brand);
      setValue('price', product.price);
      setValue('stock', product.stock);
      setValue('status', product.status);
      setValue('images', product.images);
      setPreviewImages(product.images.map(img => typeof img === 'string' ? img : URL.createObjectURL(img)));
    } else {
      reset();
      setPreviewImages([]);
    }
    setShowModal(true);
  };

  const resetForm = () => {
    reset();
    setPreviewImages([]);
    setShowModal(false);
    setCurrentProduct(null);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setValue('images', files);
    setPreviewImages(files.map(file => URL.createObjectURL(file)));
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <Button variant="outline">Đăng xuất</Button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition ${activeTab === 'dashboard' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              <BarChart3 className="inline w-4 h-4 mr-2" />
              Thống kê
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition ${activeTab === 'products' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              <Package className="inline w-4 h-4 mr-2" />
              Quản lý sản phẩm
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Tổng sản phẩm</p>
                    <p className="text-2xl font-bold text-gray-900">{statistics.totalProducts}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Doanh thu</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(statistics.totalRevenue)}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Đã bán</p>
                    <p className="text-2xl font-bold text-gray-900">{statistics.totalSold}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <ShoppingCart className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Hết hàng</p>
                    <p className="text-2xl font-bold text-gray-900">{statistics.outOfStock}</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-lg">
                    <X className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </div>
            </div>
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Doanh số theo tháng</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sales" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Phân bổ danh mục</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'products' && (
          <div className="space-y-6">
            {/* Filters and Search */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Tìm kiếm sản phẩm..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tất cả danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả danh mục</SelectItem>
                    <SelectItem value="Điện thoại">Điện thoại</SelectItem>
                    <SelectItem value="Laptop">Laptop</SelectItem>
                    <SelectItem value="Tablet">Tablet</SelectItem>
                    <SelectItem value="Phụ kiện">Phụ kiện</SelectItem>
                    <SelectItem value="Đồng hồ">Đồng hồ</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tất cả trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    <SelectItem value="Còn hàng">Còn hàng</SelectItem>
                    <SelectItem value="Hết hàng">Hết hàng</SelectItem>
                    <SelectItem value="Sắp về">Sắp về</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => openModal('create')}>
                  <Plus className="w-5 h-5 mr-2" />
                  Thêm sản phẩm
                </Button>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">Sắp xếp:</span>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="id">ID</SelectItem>
                      <SelectItem value="name">Tên</SelectItem>
                      <SelectItem value="price">Giá</SelectItem>
                      <SelectItem value="stock">Tồn kho</SelectItem>
                      <SelectItem value="sold">Đã bán</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  >
                    {sortOrder === 'asc' ? '↑ Tăng dần' : '↓ Giảm dần'}
                  </Button>
                </div>
                <span className="text-sm text-gray-600">
                  Hiển thị {paginatedProducts.length} / {sortedProducts.length} sản phẩm
                </span>
              </div>
            </div>
            {/* Products Table */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Tên sản phẩm</TableHead>
                    <TableHead>Danh mục</TableHead>
                    <TableHead>Thương hiệu</TableHead>
                    <TableHead>Giá</TableHead>
                    <TableHead>Tồn kho</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Đã bán</TableHead>
                    <TableHead>Hình ảnh</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>{product.id}</TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>{product.brand}</TableCell>
                      <TableCell>{formatCurrency(product.price)}</TableCell>
                      <TableCell>{product.stock}</TableCell>
                      <TableCell>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${product.status === 'Còn hàng' ? 'bg-green-100 text-green-800' :
                            product.status === 'Hết hàng' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                          }`}>
                          {product.status}
                        </span>
                      </TableCell>
                      <TableCell>{product.sold}</TableCell>
                      <TableCell>{product.images.length} hình</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openModal('edit', product)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* Pagination */}
              <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Hiển thị</span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[70px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-gray-600">mục/trang</span>
                </div>
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
            </div>
          </div>
        )}
      </main>

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{modalMode === 'create' ? 'Thêm sản phẩm mới' : 'Chỉnh sửa sản phẩm'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(modalMode === 'create' ? handleCreate : handleUpdate)} className="space-y-4">
            <div>
              <Label htmlFor="name">Tên sản phẩm</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="category">Danh mục</Label>
              <Select onValueChange={(value) => setValue('category', value)} defaultValue={watch('category')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Điện thoại">Điện thoại</SelectItem>
                  <SelectItem value="Laptop">Laptop</SelectItem>
                  <SelectItem value="Tablet">Tablet</SelectItem>
                  <SelectItem value="Phụ kiện">Phụ kiện</SelectItem>
                  <SelectItem value="Đồng hồ">Đồng hồ</SelectItem>
                </SelectContent>
              </Select>
              {errors.category && <p className="text-red-500 text-sm">{errors.category.message}</p>}
            </div>
            <div>
              <Label htmlFor="brand">Thương hiệu</Label>
              <Input id="brand" {...register('brand')} />
              {errors.brand && <p className="text-red-500 text-sm">{errors.brand.message}</p>}
            </div>
            <div>
              <Label htmlFor="price">Giá (VNĐ)</Label>
              <Input id="price" type="number" {...register('price', { valueAsNumber: true })} />
              {errors.price && <p className="text-red-500 text-sm">{errors.price.message}</p>}
            </div>
            <div>
              <Label htmlFor="stock">Tồn kho</Label>
              <Input id="stock" type="number" {...register('stock', { valueAsNumber: true })} />
              {errors.stock && <p className="text-red-500 text-sm">{errors.stock.message}</p>}
            </div>
            <div>
              <Label htmlFor="status">Trạng thái</Label>
              <Select onValueChange={(value) => setValue('status', value)} defaultValue={watch('status')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Còn hàng">Còn hàng</SelectItem>
                  <SelectItem value="Hết hàng">Hết hàng</SelectItem>
                  <SelectItem value="Sắp về">Sắp về</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && <p className="text-red-500 text-sm">{errors.status.message}</p>}
            </div>
            <div>
              <Label htmlFor="images">Hình ảnh (tối đa 5)</Label>
              <div className="relative">
                <Input
                  id="images"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="mt-1"
                />
                <Upload className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
              {errors.images && <p className="text-red-500 text-sm">{errors.images.message}</p>}
              <div className="grid grid-cols-5 gap-2 mt-2">
                {previewImages.map((src, i) => (
                  <img key={i} src={src} alt={`preview ${i}`} className="w-full h-24 object-cover rounded" />
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>Hủy</Button>
              <Button type="submit">{modalMode === 'create' ? 'Thêm mới' : 'Cập nhật'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;