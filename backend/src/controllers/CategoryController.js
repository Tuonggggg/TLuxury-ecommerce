import Category from "../models/CategoryModel.js";
import Product from "../models/ProductModel.js";

// -------------------------------------------------------------------
// PHẦN TỐI ƯU HÓA: Lấy tất cả ID Category con (cha + con)
// -------------------------------------------------------------------

/**
 * Hàm đệ quy tối ưu, lấy tất cả categoryId con (cha + con)
 * Giải quyết vấn đề N+1 query bằng cách fetch tất cả category một lần.
 */
async function getAllCategoryIdsOptimized(parentId) {
    // BƯỚC 1: Lấy TẤT CẢ categories chỉ trong MỘT TRUY VẤN
    const allCategories = await Category.find({}).select('_id parent').lean();

    // BƯỚC 2: Xây dựng một bản đồ (map) để tra cứu nhanh bằng ID cha
    const categoryMap = new Map();
    allCategories.forEach(cat => {
        // Sử dụng ID cha làm key
        const parentIdStr = cat.parent ? cat.parent.toString() : 'root';
        if (!categoryMap.has(parentIdStr)) {
            categoryMap.set(parentIdStr, []);
        }
        categoryMap.get(parentIdStr).push(cat);
    });

    // BƯỚC 3: Hàm đệ quy/tìm kiếm trong bộ nhớ
    const ids = [];
    function findChildrenIds(currentId) {
        // Đẩy ID hiện tại vào mảng
        ids.push(currentId);
        // Chuyển ID sang chuỗi để tra cứu trong Map
        const children = categoryMap.get(currentId.toString()) || []; 
        for (const child of children) {
            findChildrenIds(child._id);
        }
    }

    findChildrenIds(parentId);
    return ids;
}


// -------------------------------------------------------------------
// CONTROLLER SỬA ĐỔI & NÂNG CẤP (Thêm Pagination & Filter)
// -------------------------------------------------------------------

/**
 * Lấy sản phẩm theo category (bao gồm subcategories) + Pagination + Filter
 * Đã thay thế logic getAllCategoryIds cũ bằng phiên bản tối ưu.
 */
export const getProductsByCategory = async (req, res) => {
    try {
        const parentId = req.params.id; // ID của category cha
        // Lấy các query params, thiết lập giá trị mặc định
        const { 
            sortBy = "createdAt", 
            order = "desc", 
            page = 1, 
            limit = 10, 
            brand 
        } = req.query;

        // 1. Lấy tất cả category ID liên quan (cha + con) (Sử dụng hàm tối ưu)
        const categoryIds = await getAllCategoryIdsOptimized(parentId);

        // 2. Thiết lập điều kiện tìm kiếm (query)
        const query = {
            category: { $in: categoryIds } // Tìm sản phẩm thuộc bất kỳ ID nào trong danh sách
        };

        if (brand && brand !== "all") {
            query.brand = brand;
        }

        // 3. Thiết lập Phân trang (Pagination)
        const pageSize = parseInt(limit, 10);
        const skip = (parseInt(page, 10) - 1) * pageSize;
        
        // 4. Thiết lập Sắp xếp (Sort)
        const sort = {};
        sort[sortBy] = order === "asc" ? 1 : -1;

        // 5. Lấy tổng số sản phẩm (cho phân trang)
        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / pageSize);

        // 6. Lấy sản phẩm
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
            limit: pageSize
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// -------------------------------------------------------------------
// CONTROLLER THIẾU: Lấy chi tiết Category theo Slug (Để frontend hoạt động)
// -------------------------------------------------------------------

/**
 * Lấy chi tiết 1 category + children theo slug
 * Cần thiết để frontend load category bằng slug trong URL.
 */
export const getCategoryBySlug = async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug }).populate("children");
    if (!category)
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// -------------------------------------------------------------------
// CÁC CONTROLLER CÒN LẠI (GIỮ NGUYÊN)
// -------------------------------------------------------------------

/**
 * Lấy tất cả category gốc + children (đa cấp)
 */
export const getCategories = async (req, res) => {
    try {
        const categories = await Category.find({ parent: null }).populate({
            path: "children",
            populate: { path: "children" }, // có thể recursive nhiều cấp nếu cần
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
        const category = await Category.findById(req.params.id).populate("children");
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
        const { name, slug, description } = req.body;

        const exists = await Category.findOne({ $or: [{ name }, { slug }] });
        if (exists)
            return res.status(400).json({ message: "Danh mục đã tồn tại" });

        const category = new Category({ name, slug, description });
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
        const { name, slug, description } = req.body;

        const parent = await Category.findById(parentId);
        if (!parent)
            return res.status(404).json({ message: "Category cha không tồn tại" });

        const exists = await Category.findOne({ $or: [{ name }, { slug }] });
        if (exists)
            return res.status(400).json({ message: "Danh mục đã tồn tại" });

        const child = new Category({ name, slug, description, parent: parentId });
        await child.save();
        // Middleware pre('save') sẽ tự động thêm vào parent.children

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
        const { name, slug, description, parent } = req.body;

        const category = await Category.findById(req.params.id);
        if (!category)
            return res.status(404).json({ message: "Không tìm thấy danh mục" });

        // Nếu parent thay đổi, cần update children của parent cũ & parent mới
        const oldParentId = category.parent ? category.parent.toString() : null;
        const newParentId = parent || null;

        category.name = name || category.name;
        category.slug = slug || category.slug;
        category.description = description || category.description;
        category.parent = newParentId;

        await category.save();

        // Nếu parent thay đổi, cập nhật children của parent cũ và parent mới
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
    }
};

/**
 * Xóa category
 */
export const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category)
            return res.status(404).json({ message: "Không tìm thấy danh mục" });

        // Xóa tất cả children recursively
        await deleteCategoryRecursive(category._id);

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
    if (!category) return;

    // Xóa tất cả children trước
    for (const childId of category.children) {
        await deleteCategoryRecursive(childId);
    }

    // Xóa category hiện tại
    await Category.findByIdAndDelete(categoryId);
}