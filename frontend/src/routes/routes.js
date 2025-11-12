import HomePage from "@/pages/layout/HomePage";
import SearchPage from "@/pages/layout/SearchPage";
import CategoryPage from "@/pages/layout/CategoryPage";
import NotFoundPage from "@/pages/layout/NotFound";
import ProductDetailsPage from "@/pages/layout/ProductDetails";
import CartPage from "@/pages/layout/CartPage";
import RegisterPage from "@/pages/layout/RegisterPage";
import LoginForm from "@/pages/layout/LoginPage";
import AuthRecoveryPage from "@/pages/layout/AuthRecoveryPage";
import AdminDashboard from "@/pages/layout/admin/AdminPage";
import CheckoutPage from "@/pages/layout/OrderPage";
import FlashSalePage from "@/pages/layout/FlashSalePage";

// ✅ 1. IMPORT CÁC TRANG THANH TOÁN / ĐƠN HÀNG
import OrderSuccessPage from "@/pages/layout/OrderSuccessPage";
import OrderFailedPage from "@/pages/layout/OrderFailedPage";
import MyOrdersPage from "@/pages/layout/MyOrdersPage";
import OrderDetailsPage from "@/pages/layout/OrderDetailsPage";

// ✅ 2. IMPORT TRANG PROFILE
import ProfilePage from "@/pages/layout/ProfilePage";
import SuccessfulOrders from "@/pages/layout/admin/components/SuccessfulOrders";
import BlogPage from "@/pages/layout/BlogPage";
import BlogDetailPage from "@/pages/layout/BlogDetailPage";

export const routes = [
  { path: "/", page: HomePage, isShowHeader: true },
  { path: "/search", page: SearchPage, isShowHeader: true },
  { path: "/category/:name", page: CategoryPage, isShowHeader: true },
  { path: "/category/flashsale", page: FlashSalePage, isShowHeader: true },
  { path: "/product/:id", page: ProductDetailsPage, isShowHeader: true },
  { path: "/cart", page: CartPage, isShowHeader: true },
  { path: "/cart/checkout", page: CheckoutPage, isShowHeader: true },

  // ✅ ĐƠN HÀNG & THANH TOÁN
  {
    path: "/order-success/:orderId",
    page: OrderSuccessPage,
    isShowHeader: true,
  },
  { path: "/payment/failed", page: OrderFailedPage, isShowHeader: true },
  { path: "/my-orders", page: MyOrdersPage, isShowHeader: true },
  { path: "/order/:id", page: OrderDetailsPage, isShowHeader: true },

  // ✅ THÊM TRANG PROFILE
  { path: "/account/profile", page: ProfilePage, isShowHeader: true },

  // ✅ XÁC THỰC
  { path: "/account/register", page: RegisterPage, isShowHeader: true },
  { path: "/account/login", page: LoginForm, isShowHeader: true },
  {
    path: "/account/forgot-password",
    page: AuthRecoveryPage,
    isShowHeader: true,
  },
  {
    path: "/account/reset-password/:token",
    page: AuthRecoveryPage,
    isShowHeader: true,
  },

  // ✅ ADMIN & NOT FOUND
  { path: "/admin/dashboard", page: AdminDashboard, isShowHeader: false },
  { path: "/category/blog", page: BlogPage, isShowHeader: true },
  {
    path: "/blog/:slug",
    page: BlogDetailPage,
    isShowHeader: true,
  },
  {
    path: "/admin/successful-orders",
    page: SuccessfulOrders,
    isShowHeader: false,
  },
  { path: "*", page: NotFoundPage, isShowHeader: false },
];

export default routes;
