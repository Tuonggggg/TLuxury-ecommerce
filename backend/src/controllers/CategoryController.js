import Category from "../models/CategoryModel.js";
import Product from "../models/productModel.js";
import mongoose from "mongoose";
import { removeVietnameseSigns } from "../utils/stringUtils.js";

// =========================================================
// TỐI ƯU CACHE (Giữ nguyên)
// =========================================================
let categoryMapCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION_MS = 10 * 60 * 1000;

async function getCategoryMap() {
  const now = Date.now();
  if (categoryMapCache && now - cacheTimestamp < CACHE_DURATION_MS) {
    return categoryMapCache;
  }
  const allCategories = await Category.find({}).select("_id parent").lean();
  const categoryMap = new Map();
  allCategories.forEach((cat) => {
    const parentIdStr = cat.parent ? cat.parent.toString() : "root";
    if (!categoryMap.has(parentIdStr)) {
      categoryMap.set(parentIdStr, []);
    }
    categoryMap.get(parentIdStr).push(cat);
  });
  categoryMapCache = categoryMap;
  cacheTimestamp = now;
  return categoryMap;
}

async function getAllCategoryIdsOptimized(parentId) {
  const categoryMap = await getCategoryMap();
  const ids = [];
  function findChildrenIds(currentId) {
    ids.push(currentId);
    const children = categoryMap.get(currentId.toString()) || [];
    for (const child of children) {
      findChildrenIds(child._id);
    }
  }
  findChildrenIds(parentId);
  return ids;
}

// =========================================================
// CONTROLLER CHÍNH
// =========================================================

export const getProductsByCategory = async (req, res) => {
  try {
    const parentId = req.params.id;
    const {
      sortBy = "createdAt",
      order = "desc",
      page = 1,
      limit = 10,
      brand,
    } = req.query;
    const categoryIds = await getAllCategoryIdsOptimized(parentId);
    const query = { category: { $in: categoryIds } };
    if (brand && brand !== "all") query.brand = brand;
    const pageSize = parseInt(limit, 10);
    const skip = (parseInt(page, 10) - 1) * pageSize;
    const sort = {};
    sort[sortBy] = order === "asc" ? 1 : -1;
    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / pageSize);
    const products = await Product.find(query)
      .populate("category", "name slug")
      .sort(sort)
      .skip(skip)
      .limit(pageSize);
    res.json({
      products,
      page: parseInt(page, 10),
      totalPages,
      totalProducts,
      limit: pageSize,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCategoryBySlug = async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug }).populate(
      "children"
    );
    if (!category)
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ parent: null }).populate({
      path: "children",
      populate: { path: "children" },
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).populate(
      "children"
    );
    if (!category)
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =========================================================
// 🟢 TẠO CATEGORY (Đã Sửa Lỗi parentId is not defined)
// =========================================================
export const createCategory = async (req, res) => {
  try {
    // Lấy dữ liệu từ FormData
    let { name, slug, description, parent, customPath } = req.body;

    if (!name)
      return res.status(400).json({ message: "Tên danh mục là bắt buộc" });

    const finalSlug =
      slug || removeVietnameseSigns(name).toLowerCase().replace(/\s+/g, "-");
    const exists = await Category.findOne({ slug: finalSlug });
    if (exists)
      return res
        .status(400)
        .json({ message: "Danh mục đã tồn tại (trùng slug)" });

    // ✅ FIX LỖI QUAN TRỌNG: Sử dụng biến 'finalParentId' thay vì 'parentId' chưa khai báo
    let finalParentId = null;

    // Kiểm tra chuỗi "null", "undefined", "root" do FormData gửi lên
    if (
      parent &&
      parent !== "root" &&
      parent !== "null" &&
      parent !== "undefined" &&
      parent !== ""
    ) {
      if (mongoose.Types.ObjectId.isValid(parent)) {
        const parentCat = await Category.findById(parent);
        if (!parentCat)
          return res
            .status(400)
            .json({ message: "Danh mục cha không tồn tại" });
        finalParentId = parent;
      }
    }

    if (customPath === "null" || customPath === "undefined") customPath = null;

    let imageUrl = null;
    if (req.file) imageUrl = req.file.path;

    const category = new Category({
      name,
      slug: finalSlug,
      description,
      image: imageUrl,
      parent: finalParentId, // ✅ Sử dụng đúng biến 'finalParentId'
      customPath: customPath || null,
    });

    await category.save();
    res.status(201).json(category);
  } catch (error) {
    console.error("Create Category Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// =========================================================
// 🟡 CẬP NHẬT CATEGORY (Đã Sửa Lỗi Logic Parent)
// =========================================================
export const updateCategory = async (req, res) => {
  try {
    let { name, slug, description, parent, customPath } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category)
      return res.status(404).json({ message: "Không tìm thấy danh mục" });

    const oldParentId = category.parent ? category.parent.toString() : null;

    // ✅ FIX LỖI: Sử dụng biến 'newParentId'
    let newParentId = null;

    if (
      parent &&
      parent !== "root" &&
      parent !== "null" &&
      parent !== "undefined" &&
      parent !== ""
    ) {
      if (mongoose.Types.ObjectId.isValid(parent)) {
        if (parent === category._id.toString()) {
          return res
            .status(400)
            .json({ message: "Không thể chọn chính danh mục này làm cha." });
        }
        newParentId = parent;
      }
    }

    category.name = name || category.name;
    if (name) {
      category.slug =
        slug || removeVietnameseSigns(name).toLowerCase().replace(/\s+/g, "-");
    }
    category.description = description || category.description;

    if (customPath && customPath !== "undefined" && customPath !== "null") {
      category.customPath = customPath;
    }

    category.parent = newParentId; // ✅ Sử dụng đúng biến 'newParentId'

    if (req.file) {
      category.image = req.file.path;
    }

    await category.save();

    // Cập nhật quan hệ cha cũ
    if (
      oldParentId &&
      oldParentId !== (newParentId ? newParentId.toString() : null)
    ) {
      const oldParent = await Category.findById(oldParentId);
      if (oldParent) {
        oldParent.children = oldParent.children.filter(
          (id) => id.toString() !== category._id.toString()
        );
        await oldParent.save();
      }
    }

    res.json(category);
  } catch (error) {
    console.error("Update Category Error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
    await deleteCategoryRecursive(category._id);
    if (category.parent) {
      const parent = await Category.findById(category.parent);
      if (parent) {
        parent.children = parent.children.filter(
          (id) => id.toString() !== category._id.toString()
        );
        await parent.save();
      }
    }
    res.json({ message: "Xóa danh mục thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

async function deleteCategoryRecursive(categoryId) {
  const category = await Category.findById(categoryId);
  if (!category) return;
  if (category.children && category.children.length > 0) {
    for (const childId of category.children) {
      await deleteCategoryRecursive(childId);
    }
  }
  await Category.findByIdAndDelete(categoryId);
}

// (Bạn có thể bỏ hàm addChildCategory vì createCategory đã xử lý đủ.
// Nhưng nếu muốn giữ, hãy đảm bảo dùng đúng biến)
export const addChildCategory = async (req, res) => {
  try {
    const { parentId } = req.params; // ✅ Lấy ID cha từ URL
    const { name, slug, description, customPath } = req.body;

    const parent = await Category.findById(parentId);
    if (!parent)
      return res.status(404).json({ message: "Category cha không tồn tại" });

    const finalSlug =
      slug || removeVietnameseSigns(name).toLowerCase().replace(/\s+/g, "-");
    const exists = await Category.findOne({ slug: finalSlug });
    if (exists) return res.status(400).json({ message: "Danh mục đã tồn tại" });

    let imageUrl = null;
    if (req.file) imageUrl = req.file.path;

    const child = new Category({
      name,
      slug: finalSlug,
      description,
      parent: parentId, // ✅ Sử dụng parentId từ params
      image: imageUrl,
      customPath: customPath || null,
    });

    await child.save();
    res
      .status(201)
      .json({ message: "Thêm category con thành công", category: child });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
