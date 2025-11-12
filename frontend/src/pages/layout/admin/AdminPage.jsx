import React, { useState, useEffect, useCallback } from 'react';
import { Package, BarChart3, ListTree, Users, Package2, LogOut, Loader2, NotebookPen, TicketPercent } from 'lucide-react'; // Thêm Loader2
import { Button } from '@/components/ui/button';
import useProducts from './hooks/useProducts';
import DashboardStats from './components/DashboardStats';
import DashboardCharts from './components/DashboardCharts';
import ProductFilters from './components/ProductFilters';
import ProductTable from './components/ProductTable';
import ProductModal from './components/ProductModal';
import OrderManagement from './components/OrderManagement';
import UserManagement from './components/UserManagement';
import CategoryManagement from './components/CategoryManagement';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios'; // ✅ Import api
import { toast } from 'sonner'; // ✅ Import toast
import BlogManagement from './components/BlogManagement';
import DiscountManagement from './components/DiscountManagement';

const AdminPage = () => {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  // 1. HOOK LẤY DỮ LIỆU SẢN PHẨM PHÂN TRANG (CHO BẢNG PRODUCTTABLE)
  const {
    products, categories, getCategoryName,
    loading: productsLoading, // Đổi tên loading để tránh trùng lặp
    isSubmitting,
    currentPage, itemsPerPage, totalPages, totalProductsCount, setCurrentPage, setItemsPerPage,
    searchTerm, setSearchTerm, selectedCategory, setSelectedCategory, selectedStatus, setSelectedStatus,
    sortBy, setSortBy, sortOrder, setSortOrder,
    createProduct, updateProduct, deleteProduct,
  } = useProducts(); // Hook này chỉ dùng cho tab 'products'

  // ✅ 2. STATE MỚI ĐỂ LẤY TOÀN BỘ DỮ LIỆU (CHO BIỂU ĐỒ)
  const [allProductsForCharts, setAllProductsForCharts] = useState([]);
  const [chartsLoading, setChartsLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [currentProduct, setCurrentProduct] = useState(null);
  const [previewImages, setPreviewImages] = useState([]);

  // ✅ 3. HÀM GỌI API LẤY TẤT CẢ SẢN PHẨM (CHO BIỂU ĐỒ)
  const fetchAllProductsForCharts = useCallback(async () => {
    setChartsLoading(true);
    try {
      // Gọi API với tham số fetchAll=true (đã sửa trong ProductController)
      const res = await api.get('/products?fetchAll=true');
      setAllProductsForCharts(res.data.products || []);
    } catch (err) {
      toast.error("Lỗi tải dữ liệu biểu đồ", { description: err.message });
    } finally {
      setChartsLoading(false);
    }
  }, []);

  // ✅ 4. CHẠY HÀM FETCH KHI TAB DASHBOARD ĐƯỢC CHỌN
  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchAllProductsForCharts();
    }
  }, [activeTab, fetchAllProductsForCharts]);


  const openModal = (mode, product = null) => {
    setModalMode(mode);
    setCurrentProduct(product);
    if (product) {
      const imageSrcs = (product.images || []).map(img => typeof img === 'string' ? img : img.path || '');
      setPreviewImages(imageSrcs);
    } else {
      setPreviewImages([]);
    }
    setShowModal(true);
  };

  const handleLogout = async () => {
    await logout(); // Gọi hàm logout từ AuthProvider
  }


  const managementTabs = [
    { key: 'dashboard', name: 'Thống kê', icon: BarChart3 },
    { key: 'products', name: 'Sản phẩm', icon: Package },
    { key: 'categories', name: 'Danh mục', icon: ListTree },
    { key: 'orders', name: 'Đơn hàng', icon: Package2 },
    { key: 'users', name: 'Người dùng', icon: Users },
    { key: 'blog', name: 'Bài đăng', icon: NotebookPen },
    { key: 'discount', name: 'Voucher', icon: TicketPercent },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs (Quản lý chung) */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Menu Tabs */}
            <div className="flex space-x-8">
              {managementTabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition ${activeTab === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  <tab.icon className="inline w-4 h-4 mr-2" />
                  {tab.name}
                </button>
              ))}
            </div>

            {/* NÚT ĐĂNG XUẤT */}
            <Button variant="destructive" onClick={handleLogout} className="flex-shrink-0">
              <LogOut className="w-4 h-4 mr-2" />
              Đăng xuất
            </Button>

          </div>
        </div>
      </div>


      {/* Content Tabs */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* ✅ SỬ DỤNG LOGIC MỚI CHO BIỂU ĐỒ */}
          {chartsLoading ? (
            <div className="flex justify-center items-center p-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              <DashboardStats products={allProductsForCharts} />
              <DashboardCharts products={allProductsForCharts} />
            </>
          )}
        </div>
      )}

      {activeTab === 'products' && (
        <div className="space-y-6">
          {/* Sử dụng dữ liệu phân trang (từ useProducts) */}
          <ProductFilters
            searchTerm={searchTerm} setSearchTerm={setSearchTerm}
            categories={categories} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
            selectedStatus={selectedStatus} setSelectedStatus={setSelectedStatus}
            sortBy={sortBy} setSortBy={setSortBy} sortOrder={sortOrder} setSortOrder={setSortOrder}
            openModal={openModal}
          />

          <ProductTable
            products={products} loading={productsLoading} getCategoryName={getCategoryName}
            totalPages={totalPages} currentPage={currentPage} totalProductsCount={totalProductsCount}
            itemsPerPage={itemsPerPage} setCurrentPage={setCurrentPage} setItemsPerPage={setItemsPerPage}
            openModal={openModal} handleDeleteClick={deleteProduct}
          />
        </div>
      )}

      {/* RENDER CÁC TRANG QUẢN LÝ KHÁC */}
      {activeTab === 'categories' && <CategoryManagement />}
      {activeTab === 'orders' && <OrderManagement />}
      {activeTab === 'users' && <UserManagement />}
      {activeTab === 'blog' && <BlogManagement />}
      {activeTab === 'discount' && <DiscountManagement />}


      {/* Product Modal (Chỉ hiển thị khi quản lý sản phẩm) */}
      {activeTab === 'products' && (
        <ProductModal
          showModal={showModal} setShowModal={setShowModal}
          modalMode={modalMode} currentProduct={currentProduct}
          categories={categories} isSubmitting={isSubmitting}
          createProduct={createProduct} updateProduct={updateProduct}
          setPreviewImages={setPreviewImages} previewImages={previewImages}
        />
      )}
    </div>
  );
};

export default AdminPage;