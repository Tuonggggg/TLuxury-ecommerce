import mongoose from "mongoose";
import Product from "../models/ProductModel.js";
import Category from "../models/CategoryModel.js";

// =========================================================
// HÀM LOẠI BỎ DẤU TIẾNG VIỆT (Giữ nguyên)
// ...
// =========================================================

const removeVietnameseSigns = (str) => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
};

async function getAllCategoryIds(parentId) {
  const ids = [parentId];
  const children = await Category.find({ parent: parentId });
  for (const child of children) {
    const childIds = await getAllCategoryIds(child._id);
    ids.push(...childIds);
  }
  return ids;
}

// =========================================================
// GET PRODUCTS (Giữ nguyên)
// =========================================================
export const getProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      brand,
      status,
      sortBy,
      order,
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    if (search) {
      const safeSearch = removeVietnameseSigns(search);
      query.name_no_sign = { $regex: safeSearch, $options: "i" };
    }

    if (category) {
      const cat = await Category.findOne({ slug: category });
      if (cat) {
        const categoryIds = await getAllCategoryIds(cat._id);
        query.category = { $in: categoryIds };
      }
    }

    if (brand) query.brand = brand;
    if (status) query.status = status;

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = +minPrice;
      if (maxPrice) query.price.$lte = +maxPrice;
    }

    const sortOption = sortBy
      ? { [sortBy]: order === "asc" ? 1 : -1 }
      : { createdAt: -1 };

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate("category", "name slug")
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(+limit);

    res.json({
      total,
      page: +page,
      totalPages: Math.ceil(total / limit),
      products,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =========================================================
// GET PRODUCT BY ID (Giữ nguyên)
// =========================================================
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "category",
      "name slug"
    );
    if (!product)
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =========================================================
// CREATE PRODUCT (Giữ nguyên)
// =========================================================
export const createProduct = async (req, res) => {
  console.log("📸 Uploaded files raw:", req.files);
  try {
    const {
      name,
      slug,
      price,
      description,
      category,
      stock,
      brand,
      status,
      size,
      material,
      origin,
      discount,
    } = req.body;

    if (!name) return res.status(400).json({ message: "Thiếu tên sản phẩm" });
    if (!price) return res.status(400).json({ message: "Thiếu giá sản phẩm" });
    if (!category)
      return res.status(400).json({ message: "Thiếu danh mục sản phẩm" }); // Tìm category

    let cat = mongoose.Types.ObjectId.isValid(category)
      ? await Category.findById(category)
      : await Category.findOne({ slug: category });
    if (!cat) return res.status(400).json({ message: "Category không hợp lệ" }); // Sinh slug

    const finalSlug = slug || name.toLowerCase().replace(/\s+/g, "-");
    const slugExists = await Product.findOne({ slug: finalSlug });
    if (slugExists)
      return res
        .status(400)
        .json({ message: "Slug đã tồn tại. Chọn tên khác." }); // Xử lý ảnh

    let images = [];
    if (Array.isArray(req.files) && req.files.length > 0) {
      images = req.files.map((f) => f.path);
    } // 4. ✅ Xử lý Discount

    const discountValue = Number(discount);
    const safeDiscount = Math.max(
      0,
      Math.min(100, isNaN(discountValue) ? 0 : discountValue)
    ); // Tạo product

    const newProduct = new Product({
      name,
      name_no_sign: removeVietnameseSigns(name),
      slug: finalSlug,
      price,
      description,
      category: cat._id,
      stock: stock || 0,
      brand: brand || "",
      status: status || "còn hàng",
      size: size || "",
      material: material || "",
      origin: origin || "",
      discount: safeDiscount,
      images,
    });

    const saved = await newProduct.save();
    const populated = await saved.populate("category", "name slug");

    res.status(201).json(populated);
  } catch (error) {
    console.error("❌ [createProduct] Lỗi khi tạo sản phẩm:", error);
    res
      .status(500)
      .json({ message: error.message || "Lỗi server khi tạo sản phẩm" });
  }
};

// =========================================================
// UPDATE PRODUCT (Đã Hoàn Thiện Xử lý Lỗi)
// =========================================================
export const updateProduct = async (req, res) => {
  console.log("🚀 ~ updateProduct ~ body:", req.body);
  try {
    const updateData = { ...req.body }; // 1. Xử lý Category
    if (updateData.category) {
      const cat = mongoose.Types.ObjectId.isValid(updateData.category)
        ? await Category.findById(updateData.category)
        : await Category.findOne({ slug: updateData.category });
      if (!cat)
        return res.status(400).json({ message: "Category không hợp lệ" });
      updateData.category = cat._id;
    } // 2. Xử lý Name/Slug/Name_no_sign

    if (updateData.name) {
      updateData.slug =
        updateData.slug || updateData.name.toLowerCase().replace(/\s+/g, "-");
    } // 3. ✅ Xử lý Discount (Ép kiểu trước khi lưu vào updateData)

    if (updateData.discount !== undefined) {
      const discountValue = Number(updateData.discount);
      updateData.discount = Math.max(
        0,
        Math.min(100, isNaN(discountValue) ? 0 : discountValue)
      );
    } // 4. Xử lý Ảnh Cloudinary

    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map((f) => f.path);
    }
    if (req.body.images) {
      const oldImages = Array.isArray(req.body.images)
        ? req.body.images
        : [req.body.images];
      images.push(...oldImages);
    }
    if (images.length > 0) updateData.images = images; // 5. Thực hiện cập nhật

    const updated = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true, // Quan trọng: Chạy validators
    }).populate("category", "name slug");

    if (!updated)
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

    res.json(updated);
  } catch (error) {
    console.error("❌ [updateProduct] Lỗi cập nhật chi tiết:", error); // ✅ Xử lý lỗi Mongoose Validation

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message); // Trả về lỗi 400 kèm thông báo chi tiết
      return res.status(400).json({ message: messages.join(", ") });
    } // Xử lý lỗi chung khác
    res
      .status(400)
      .json({ message: error.message || "Lỗi cập nhật không xác định" });
  }
};

// =========================================================
// DELETE PRODUCT (Giữ nguyên)
// =========================================================
export const deleteProduct = async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    res.json({ message: "Xóa sản phẩm thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
