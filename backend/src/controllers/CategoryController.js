import Category from "../models/categoryModel.js";
import Product from "../models/ProductModel.js";

// =========================================================
// TỐI ƯU CACHE (Nâng cao)
// =========================================================

// Khởi tạo cache rỗng
let categoryMapCache = null;
let cacheTimestamp = 0;
// Đặt thời gian cache (ví dụ: 10 phút)
const CACHE_DURATION_MS = 10 * 60 * 1000;

/**
 * Hàm này lấy category map từ cache hoặc fetch mới nếu cache cũ
 */
async function getCategoryMap() {
  const now = Date.now();
  // Nếu cache còn hạn, trả về cache
  if (categoryMapCache && now - cacheTimestamp < CACHE_DURATION_MS) {
    return categoryMapCache;
  }

  // Nếu cache hết hạn, fetch mới
  // console.log("Refreshing category map cache..."); // Bỏ comment nếu muốn debug
  const allCategories = await Category.find({}).select("_id parent").lean();

  const categoryMap = new Map();
  allCategories.forEach((cat) => {
    const parentIdStr = cat.parent ? cat.parent.toString() : "root";
    if (!categoryMap.has(parentIdStr)) {
      categoryMap.set(parentIdStr, []);
    }
    categoryMap.get(parentIdStr).push(cat);
  });

  // Lưu vào cache
  categoryMapCache = categoryMap;
  cacheTimestamp = now;
  return categoryMap;
}

// -------------------------------------------------------------------
// PHẦN TỐI ƯU HÓA: Lấy tất cả ID Category con (cha + con)
// -------------------------------------------------------------------

/**
 * Hàm đệ quy tối ưu, lấy tất cả categoryId con (cha + con)
 * Sử dụng cache để tránh N+1 query.
 */
async function getAllCategoryIdsOptimized(parentId) {
  // BƯỚC 1: Lấy map từ cache thay vì query
  const categoryMap = await getCategoryMap(); // BƯỚC 2: Hàm đệ quy/tìm kiếm trong bộ nhớ

  const ids = [];
  function findChildrenIds(currentId) {
    // Đẩy ID hiện tại vào mảng
    ids.push(currentId); // Chuyển ID sang chuỗi để tra cứu trong Map
    const children = categoryMap.get(currentId.toString()) || [];
    for (const child of children) {
      findChildrenIds(child._id);
    }
  }

  findChildrenIds(parentId);
  return ids;
}

// -------------------------------------------------------------------
// CONTROLLER CHÍNH
// -------------------------------------------------------------------

/**
 * Lấy sản phẩm theo category (bao gồm subcategories) + Pagination + Filter
 */
export const getProductsByCategory = async (req, res) => {
  try {
    const parentId = req.params.id; // ID của category cha
    const {
      sortBy = "createdAt",
      order = "desc",
      page = 1,
      limit = 10,
      brand,
    } = req.query; // 1. Lấy tất cả category ID liên quan (cha + con) (Sử dụng hàm tối ưu)

    const categoryIds = await getAllCategoryIdsOptimized(parentId); // 2. Thiết lập điều kiện tìm kiếm (query)

    const query = {
      category: { $in: categoryIds },
    };

    if (brand && brand !== "all") {
      query.brand = brand;
    } // 3. Thiết lập Phân trang (Pagination)

    const pageSize = parseInt(limit, 10);
    const skip = (parseInt(page, 10) - 1) * pageSize; // 4. Thiết lập Sắp xếp (Sort)
    const sort = {};
    sort[sortBy] = order === "asc" ? 1 : -1; // 5. Lấy tổng số sản phẩm (cho phân trang)

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / pageSize); // 6. Lấy sản phẩm

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

/**
 * Lấy chi tiết 1 category + children theo slug
 * (Quan trọng cho trang CategoryPage)
 */
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

/**
 * Lấy tất cả category gốc + children (đa cấp)
 */
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

/**
 * Lấy chi tiết 1 category + children (theo ID)
 */
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

/**
 * Tạo category gốc
 */
export const createCategory = async (req, res) => {
  try {
    // ✅ Đã thêm 'image'
    const { name, slug, description, image } = req.body;

    const exists = await Category.findOne({ $or: [{ name }, { slug }] });
    if (exists) return res.status(400).json({ message: "Danh mục đã tồn tại" });

    // ✅ Đã thêm 'image'
    const category = new Category({ name, slug, description, image });
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Tạo category con
 */
export const addChildCategory = async (req, res) => {
  try {
    const { parentId } = req.params;
    // ✅ Đã thêm 'image'
    const { name, slug, description, image } = req.body;

    const parent = await Category.findById(parentId);
    if (!parent)
      return res.status(404).json({ message: "Category cha không tồn tại" });

    const exists = await Category.findOne({ $or: [{ name }, { slug }] });
    if (exists) return res.status(400).json({ message: "Danh mục đã tồn tại" });

    // ✅ Đã thêm 'image'
    const child = new Category({
      name,
      slug,
      description,
      parent: parentId,
      image,
    });
    await child.save(); // Middleware pre('save') sẽ tự động thêm vào parent.children
    res.status(201).json({
      message: "Thêm category con thành công",
      category: child,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Cập nhật category
 */
export const updateCategory = async (req, res) => {
  try {
    // ✅ Đã thêm 'image'
    const { name, slug, description, parent, image } = req.body;

    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Không tìm thấy danh mục" }); // Nếu parent thay đổi, cần update children của parent cũ & parent mới

    const oldParentId = category.parent ? category.parent.toString() : null;
    const newParentId = parent || null;

    category.name = name || category.name;
    category.slug = slug || category.slug;
    category.description = description || category.description;
    category.parent = newParentId;
    category.image = image || category.image; // ✅ Đã thêm dòng này

    await category.save(); // Nếu parent thay đổi, cập nhật children của parent cũ và parent mới

    if (oldParentId && oldParentId !== newParentId) {
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
    res.status(400).json({ message: error.message });
    T;
  }
};

/**
 * Xóa category
 */
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Không tìm thấy danh mục" }); // Xóa tất cả children recursively

    await deleteCategoryRecursive(category._id);

    // Cập nhật parent (nếu có)
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

/**
 * Hàm xóa category recursively
 */
async function deleteCategoryRecursive(categoryId) {
  const category = await Category.findById(categoryId);
  if (!category) return; // Xóa tất cả children trước

  if (category.children && category.children.length > 0) {
    for (const childId of category.children) {
      await deleteCategoryRecursive(childId);
    }
  } // Xóa category hiện tại


  await Category.findByIdAndDelete(categoryId);
}
