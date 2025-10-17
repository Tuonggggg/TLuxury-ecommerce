// src/main.jsx (ĐÃ SỬA LỖI CONTEXT)
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // 🔑 Import BrowserRouter
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthProvider.jsx'; // ✅ Đúng

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* 1. BỌC BẰNG ROUTER TRƯỚC (BẮT BUỘC) */}
    <BrowserRouter>
      {/* 2. BỌC BẰNG CONTEXT SAU (AuthProvider bây giờ có thể dùng useNavigate) */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);