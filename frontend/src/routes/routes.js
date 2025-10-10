import HomePage from "@/pages/layout/HomePage";
import SearchPage from "@/pages/layout/SearchPage";
import CategoryPage from "@/pages/layout/CategoryPage";
import NotFoundPage from "@/pages/layout/NotFound";
import ProductDetailsPage from "@/pages/layout/ProductDetails";
import CartPage from "@/pages/layout/CartPage";
import RegisterPage from "@/pages/layout/RegisterPage";
import LoginForm from "@/pages/layout/LoginPage";
import AuthRecoveryPage from "@/pages/layout/AuthRecoveryPage"; // Đổi tên biến import để dễ hiểu
import AdminDashboard from "@/pages/layout/admin/AdminPage";
import CheckoutPage from "@/pages/layout/CheckoutPage";

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
  },
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
    page: AuthRecoveryPage, // Chức năng: Gửi Email (resetToken = undefined)
    isShowHeader: true,
  },
  {
    path: "/account/reset-password/:token",
    page: AuthRecoveryPage, // Chức năng: Đặt lại Mật khẩu (resetToken = có giá trị)
    isShowHeader: true,
  },
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
