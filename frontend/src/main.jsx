// src/main.jsx (Đã thêm Context và Router)
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // 🔑 Import BrowserRouter
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthProvider.jsx'; // ✅ Đúng

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* 🔑 Bọc AuthProvider ở ngoài cùng để quản lý trạng thái toàn cục */}
    <AuthProvider>
      {/* 🔑 Bọc BrowserRouter bên trong để Context có thể sử dụng các hook của Router nếu cần */}
      <BrowserRouter> 
        <App />
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
);