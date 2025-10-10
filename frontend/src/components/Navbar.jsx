import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/axios';
import { ChevronDown } from 'lucide-react';

const CACHE_KEY = 'categories_cache_v1';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 giờ

const CategoryItem = ({ cat, handleCategoryClick }) => {
  const hasChildren = cat.children && cat.children.length > 0;

  return (
    <li key={cat._id || cat.name} className="relative group/item transition-elegant">
      <button
        onClick={() => handleCategoryClick(cat)}
        className="inline-flex items-center text-sm font-medium h-10 px-4 text-primary-foreground transition-elegant hover:bg-primary-light hover:text-white"
      >
        {cat.name || cat.title}
        {hasChildren && (
          <ChevronDown className="ml-1 h-4 w-4 transition-transform duration-300 group-hover/item:rotate-180" />
        )}
      </button>

      {hasChildren && (
        <div
          className="absolute left-1/2 -translate-x-1/2 mt-0 w-56 
          bg-white rounded-lg shadow-lg border border-gray-200 
          opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible 
          transition-elegant z-20"
          style={{ minWidth: 'max-content' }}
        >
          <ul>
            {cat.children.map((child) => (
              <li key={child._id || child.name}>
                <button
                  onClick={() => handleCategoryClick(child)}
                  className="w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer rounded-md font-medium
                  hover:bg-[#FFEED4] hover:text-[#654a21]"
                >
                  {child.name || child.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
};

const Navbar = ({ openMenu, setOpenMenu }) => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ Hàm tải danh mục với cache
  const fetchCategories = async (force = false) => {
    try {
      // Kiểm tra cache có tồn tại và còn hạn
      const cache = localStorage.getItem(CACHE_KEY);
      if (!force && cache) {
        const { data, timestamp } = JSON.parse(cache);
        if (Date.now() - timestamp < CACHE_TTL) {
          setCategories(data);
          return; // dùng cache, không gọi API nữa
        }
      }

      setLoading(true);
      const res = await api.get('/categories');
      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data?.items)
        ? res.data.items
        : [];

      setCategories(data);
      // ✅ Lưu vào cache
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ data, timestamp: Date.now() })
      );
    } catch (error) {
      console.error('❌ Lỗi khi tải danh mục:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCategoryClick = (category) => {
    const identifier = category.slug || category.name || category;
    navigate(`/category/${encodeURIComponent(identifier)}`);
    if (setOpenMenu) setOpenMenu(false);
  };

  const parentCategories = categories.filter((cat) => cat.parent === null);

  return (
    <nav className="bg-[#654321] border-primary-dark/80 shadow-md">
      {/* Desktop Navbar */}
      <ul className="hidden md:flex justify-center">
        {loading ? (
          <li className="h-10 flex items-center px-4 text-sm text-primary-foreground">
            Đang tải...
          </li>
        ) : parentCategories.length > 0 ? (
          parentCategories.map((cat) => (
            <CategoryItem
              key={cat._id}
              cat={cat}
              handleCategoryClick={handleCategoryClick}
            />
          ))
        ) : (
          <li className="h-10 flex items-center px-4 text-sm text-primary-foreground">
            Không có danh mục
          </li>
        )}
      </ul>

      {/* ✅ Mobile Navbar (đã chỉnh UI) */}
      {openMenu && (
        <ul className="md:hidden flex flex-col gap-1 px-4 py-3 bg-[#FFF9F3] border-[#D3BFA6]">
          {loading ? (
            <li className="py-2 text-sm text-[#654321]">Đang tải...</li>
          ) : categories.length > 0 ? (
            categories.map((cat) => (
              <li key={cat._id || cat.name}>
                <button
                  onClick={() => handleCategoryClick(cat)}
                  className="w-full text-left py-2 px-3 text-sm font-medium text-[#654321] border-[#E8D9C4]
                  hover:bg-[#FFEED4] hover:text-[#654a21] rounded-md transition-all duration-200"
                >
                  {cat.name || cat.title}
                </button>
              </li>
            ))
          ) : (
            <li className="py-2 text-sm text-[#654321]">Không có danh mục</li>
          )}
        </ul>
      )}
    </nav>
  );
};

export default Navbar;
