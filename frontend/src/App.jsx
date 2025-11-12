import { Routes, Route } from "react-router-dom";
import { Fragment } from "react";
import { Toaster } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import { routes } from "@/routes/routes";
// ✅ IMPORT COMPONENT CHAT MỚI
import LiveChatButton from "@/components/LiveChatButton";


// DefaultLayout đã sửa: Thêm LiveChatButton
function DefaultLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />

      {/* ✅ TÍCH HỢP NÚT CHAT VÀO LAYOUT */}
      <LiveChatButton />

      <Toaster position="top-right" richColors />
    </div>
  );
}

function App() {
  return (
    <>
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