// File: src/pages/Admin/hooks/useProducts.js
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/axios";
import { toast } from "sonner";

const DB_STATUSES = [
  { value: "còn hàng", label: "Còn hàng" },
  { value: "hết hàng", label: "Hết hàng" },
  { value: "đặt trước", label: "Sắp về" },
];

const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const [totalPages, setTotalPages] = useState(1);
  const [totalProductsCount, setTotalProductsCount] = useState(0);

  // ------------------------- FETCH DATA -------------------------
  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get("/categories");
      const mapRecursive = (cats) =>
        (cats || []).flatMap((cat) => [
          { name: cat.name, slug: cat.slug, _id: cat._id },
          ...(cat.children ? mapRecursive(cat.children) : []),
        ]);

      const mappedCats = mapRecursive(res.data || []);
      setCategories(mappedCats);
    } catch (error) {
      console.error("Lỗi tải danh mục:", error);
      toast.error("Không thể tải danh mục.");
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        search: searchTerm,
        category: selectedCategory !== "all" ? selectedCategory : undefined,
        status: selectedStatus !== "all" ? selectedStatus : undefined,
        sortBy,
        order: sortOrder === "asc" ? "asc" : "desc",
        page: currentPage,
        limit: itemsPerPage,
      };

      const res = await api.get("/products", { params });

      setProducts(res.data.products || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalProductsCount(res.data.total || 0);
    } catch (error) {
      console.error("Lỗi tải sản phẩm:", error);
      toast.error("Không thể tải dữ liệu sản phẩm.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [
    searchTerm,
    selectedCategory,
    selectedStatus,
    sortBy,
    sortOrder,
    currentPage,
    itemsPerPage,
  ]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      fetchProducts();
    }
  }, [
    searchTerm,
    selectedCategory,
    selectedStatus,
    sortBy,
    sortOrder,
    itemsPerPage,
  ]);

  useEffect(() => {
    fetchProducts();
  }, [currentPage]);

  // ------------------------- CRUD ACTIONS -------------------------

  const createProduct = async (data, imageFiles) => {
    setIsSubmitting(true);
    const formData = new FormData();

    // CƠ BẢN
    formData.append("name", data.name ?? "");
    formData.append("description", data.description ?? "");
    formData.append("category", data.category ?? "");
    formData.append("brand", data.brand ?? "");
    formData.append("price", data.price ?? 0);
    formData.append("stock", data.stock ?? 0);
    formData.append("status", data.status ?? "còn hàng");
    formData.append("discount", Number(data.discount) || 0);

    // ✅ FLASH SALE
    if (data.flashSale) {
      formData.append(
        "flashSale[isActive]",
        data.flashSale.isActive ? "true" : "false"
      );
      formData.append("flashSale[salePrice]", data.flashSale.salePrice ?? 0);
      formData.append("flashSale[startTime]", data.flashSale.startTime ?? "");
      formData.append("flashSale[endTime]", data.flashSale.endTime ?? "");
    }

    // ẢNH
    Array.from(imageFiles || []).forEach((image) => {
      formData.append("images", image);
    });

    try {
      const res = await api.post("/products", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(`✅ Đã thêm sản phẩm "${res.data.name}" thành công!`);
      fetchProducts();
      return true;
    } catch (error) {
      console.error("Lỗi khi thêm sản phẩm:", error);
      toast.error(error.response?.data?.message || "Lỗi khi thêm sản phẩm");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateProduct = async (productId, data, imageFiles, existingImages) => {
    setIsSubmitting(true);
    const formData = new FormData();

    formData.append("name", data.name ?? "");
    formData.append("description", data.description ?? "");
    formData.append("category", data.category ?? "");
    formData.append("brand", data.brand ?? "");
    formData.append("price", data.price ?? 0);
    formData.append("stock", data.stock ?? 0);
    formData.append("status", data.status ?? "còn hàng");
    formData.append("discount", Number(data.discount) || 0);

    // ✅ FLASH SALE
    if (data.flashSale) {
      formData.append(
        "flashSale[isActive]",
        data.flashSale.isActive ? "true" : "false"
      );
      formData.append("flashSale[salePrice]", data.flashSale.salePrice ?? 0);
      formData.append("flashSale[startTime]", data.flashSale.startTime ?? "");
      formData.append("flashSale[endTime]", data.flashSale.endTime ?? "");
    }

    // ẢNH
    Array.from(imageFiles || []).forEach((image) => {
      formData.append("images", image);
    });
    (existingImages || []).forEach((url) => formData.append("existingImages", url));

    try {
      await api.put(`/products/${productId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("✅ Cập nhật sản phẩm thành công!");
      fetchProducts();
      return true;
    } catch (error) {
      console.error("Lỗi khi cập nhật sản phẩm:", error);
      toast.error(error.response?.data?.message || "Lỗi khi cập nhật sản phẩm");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteProduct = async (id, name) => {
    if (window.confirm(`Bạn có chắc muốn xóa sản phẩm "${name}"?`)) {
      try {
        await api.delete(`/products/${id}`);
        toast.success("🗑️ Xóa sản phẩm thành công!");
        fetchProducts();
        return true;
      } catch (error) {
        console.error("Lỗi khi xóa sản phẩm:", error);
        toast.error(error.response?.data?.message || "Lỗi khi xóa sản phẩm");
        return false;
      }
    }
    return false;
  };

  // ------------------------- UTILITIES -------------------------
  const getCategoryName = (slug) => {
    const cat = categories.find((c) => c.slug === slug);
    return cat ? cat.name : slug;
  };

  return {
    products,
    categories,
    DB_STATUSES,
    getCategoryName,
    loading,
    isSubmitting,
    currentPage,
    itemsPerPage,
    totalPages,
    totalProductsCount,
    setCurrentPage,
    setItemsPerPage,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    createProduct,
    updateProduct,
    deleteProduct,
  };
};

export default useProducts;
