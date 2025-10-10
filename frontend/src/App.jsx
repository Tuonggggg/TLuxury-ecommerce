// src/App.jsx (Cập nhật)

import { Routes, Route } from "react-router-dom";
import { Fragment } from "react";
import { Toaster } from "sonner"; // 🔑 Giữ lại import Toaster
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import { routes } from "@/routes/routes";

// DefaultLayout đã sửa: Thêm Toaster và ScrollToTop
function DefaultLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop /> {/* Đặt ở đây để chỉ hoạt động trên các trang có layout */}
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      {/* Toaster đặt ở cuối layout */}
      <Toaster position="top-right" richColors />
    </div>
  );
}

function App() {
  return (
    <>
      {/* 💡 Đã loại bỏ Toaster và ScrollToTop khỏi đây */}
      <Routes>
        {routes.map((route) => {
          const Page = route.page;
          // Sử dụng DefaultLayout hoặc Fragment tùy thuộc vào route
          const Layout = route.isShowHeader ? DefaultLayout : Fragment;

          return (
            <Route
              key={route.path}
              path={route.path}
              element={
                <Layout>
                  <Page />
                </Layout>
              }
            />
          );
        })}
      </Routes>
    </>
  );
}

export default App;