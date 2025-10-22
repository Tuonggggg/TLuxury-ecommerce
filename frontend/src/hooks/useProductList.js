// File: src/hooks/useProductList.js
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';

const useProductList = (slug) => {
    const isFlashSale = slug === 'flashsale';

    const [category, setCategory] = useState(null);
    const [products, setProducts] = useState([]);
    const [filter, setFilter] = useState({ price: "asc", brand: "all" });
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 8;

    // 1. Logic Fetch Category (Chỉ chạy nếu KHÔNG phải Flash Sale)
    useEffect(() => {
        if (isFlashSale) {
            setCategory({ name: "Flash Sale", slug: "flashsale" }); // Giả lập object category
            return;
        }

        if (!slug) return;
        const fetchCategory = async () => {
            try {
                const res = await api.get(`/categories/slug/${slug}`);
                setCategory(res.data);
            } catch (err) {
                console.error("Lỗi khi lấy category:", err);
                // toast.error("Không tìm thấy danh mục.");
            }
        };
        fetchCategory();
    }, [slug, isFlashSale]);

    // 2. Logic Fetch Sản phẩm
    const fetchProducts = useCallback(async () => {
        if (!isFlashSale && (!category || !category._id)) return;
        
        try {
            setLoading(true);
            
            const params = {
                sortBy: "price",
                order: filter.price,
                brand: filter.brand !== "all" ? filter.brand : undefined,
                page,
                limit: itemsPerPage,
            };
            
            // 🔑 QUYẾT ĐỊNH API CALL: Flash Sale hay Category thường
            let res;
            if (isFlashSale) {
                params.isSale = 'true'; // Thêm bộ lọc giảm giá
                res = await api.get(`/products`, { params });
            } else {
                params.category = slug; // Lọc theo slug (BE sẽ tìm ID category)
                res = await api.get(`/products`, { params }); // Giả sử BE chấp nhận slug
                // Hoặc bạn có thể dùng: `/categories/${category._id}/products` nếu endpoint đó tồn tại
            }

            setProducts(res.data.products || []);
            setTotalPages(res.data.totalPages || 1);
        } catch (err) {
            console.error("Lỗi khi lấy sản phẩm:", err);
            toast.error("Không thể tải sản phẩm.");
        } finally {
            setLoading(false);
        }
    }, [category, filter, page, isFlashSale, slug]);

    useEffect(() => {
        if (isFlashSale || (category && category._id)) {
            fetchProducts();
        }
    }, [fetchProducts]);

    return {
        category,
        products,
        filter, setFilter,
        page, setPage,
        loading,
        totalPages,
        itemsPerPage,
        isFlashSale // Trả về cờ để giao diện biết đó là Flash Sale
    };
};

export default useProductList;