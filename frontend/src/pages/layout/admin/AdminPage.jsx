import React, { useState } from 'react';
import { Package, BarChart3, ListTree, Users, Package2, LogOut } from 'lucide-react'; // Thêm LogOut icon
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
// 🚨 IMPORT useAuth HOOK
import { useAuth } from '@/context/AuthContext';


const AdminPage = () => {
  // 🚨 GỌI HOOK useAuth
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  // SỬ DỤNG HOOK ĐÃ TẠO (Cho Product, Dashboard)
  const {
    products, categories, getCategoryName,
    loading, isSubmitting,
    currentPage, itemsPerPage, totalPages, totalProductsCount, setCurrentPage, setItemsPerPage,
    searchTerm, setSearchTerm, selectedCategory, setSelectedCategory, selectedStatus, setSelectedStatus,
    sortBy, setSortBy, sortOrder, setSortOrder,
    createProduct, updateProduct, deleteProduct,
  } = useProducts();

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [currentProduct, setCurrentProduct] = useState(null);
  const [previewImages, setPreviewImages] = useState([]);

  // Gộp tất cả logic mở modal (Chỉ dùng cho Product CRUD)
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

  // 🚨 HÀM XỬ LÝ ĐĂNG XUẤT
  const handleLogout = async () => {
    await logout(); // Gọi hàm logout từ AuthProvider
  }


  // Danh sách các tab quản lý
  const managementTabs = [
    { key: 'dashboard', name: 'Thống kê', icon: BarChart3 },
    { key: 'products', name: 'Sản phẩm', icon: Package },
    { key: 'categories', name: 'Danh mục', icon: ListTree },
    { key: 'orders', name: 'Đơn hàng', icon: Package2 },
    { key: 'users', name: 'Người dùng', icon: Users },
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
          <DashboardStats products={products} />
          <DashboardCharts products={products} getCategoryName={getCategoryName} />
        </div>
      )}

      {activeTab === 'products' && (
        <div className="space-y-6">
          <ProductFilters
            searchTerm={searchTerm} setSearchTerm={setSearchTerm}
            categories={categories} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
            selectedStatus={selectedStatus} setSelectedStatus={setSelectedStatus}
            sortBy={sortBy} setSortBy={setSortBy} sortOrder={sortOrder} setSortOrder={setSortOrder}
            openModal={openModal}
          />

          <ProductTable
            products={products} loading={loading} getCategoryName={getCategoryName}
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