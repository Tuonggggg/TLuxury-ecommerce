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

// ✅ 1. IMPORT CÁC TRANG KẾT QUẢ THANH TOÁN
import OrderSuccessPage from "@/pages/layout/OrderSuccessPage";
import OrderFailedPage from "@/pages/layout/OrderFailedPage";
import MyOrdersPage from "@/pages/layout/MyOrdersPage";
import OrderDetailsPage from "@/pages/layout/OrderDetailsPage";

export const routes = [
  {
    path: "/",
    page: HomePage,
    isShowHeader: true,
  },
  {
    path: "/search",
    page: SearchPage,
    isShowHeader: true,
  },
  {
    path: "/category/:name",
    page: CategoryPage,
    isShowHeader: true,
  },
  {
    path: "/flashsale",
    page: FlashSalePage,
    isShowHeader: true,
  },
  {
    path: "/product/:id",
    page: ProductDetailsPage,
    isShowHeader: true,
  },
  {
    path: "/cart",
    page: CartPage,
    isShowHeader: true,
  },
  {
    path: "/cart/checkout",
    page: CheckoutPage,
    isShowHeader: true,
  }, // ✅ 2. THÊM ROUTE CHO TRANG THÀNH CÔNG (COD / VNPAY / MOMO)

  {
    path: "/order-success/:orderId",
    page: OrderSuccessPage,
    isShowHeader: true,
  }, // ✅ 3. THÊM ROUTE CHO TRANG THẤT BẠI (VNPAY / MOMO)
  {
    path: "/my-orders",
    page: MyOrdersPage,
    isShowHeader: true,
  },
  {
    path: "/order/:id",
    page: OrderDetailsPage,
    isShowHeader: true,
  },
  // (Backend đã redirect về /payment/failed)
  {
    path: "/payment/failed",
    page: OrderFailedPage,
    isShowHeader: true,
  }, // --- CÁC ROUTE XÁC THỰC ---

  {
    path: "/account/register",
    page: RegisterPage,
    isShowHeader: true,
  },
  {
    path: "/account/login",
    page: LoginForm,
    isShowHeader: true,
  },
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
  // --- CÁC ROUTE ADMIN / NOT FOUND ---
  {
    path: "/admin/dashboard",
    page: AdminDashboard,
    isShowHeader: false,
  },
  {
    path: "*",
    page: NotFoundPage,
    isShowHeader: false,
  },
];

export default routes;
