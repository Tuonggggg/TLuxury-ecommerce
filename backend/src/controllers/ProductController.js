import mongoose from "mongoose";
// ✅ Sửa lỗi tên file (chuyển sang chữ thường)
import Product from "../models/productModel.js";
import Category from "../models/categoryModel.js";

// =========================================================
// HÀM LOẠI BỎ DẤU TIẾNG VIỆT (TỐT)
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

// =========================================================
// ĐỆ QUY LẤY TẤT CẢ CATEGORY CON (TỐT)
// =========================================================
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
// 📦 GET PRODUCTS (Đã sửa lỗi phân trang)
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
      isSale,
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
        // Lấy tất cả IDs con nếu có
        const categoryIds = await getAllCategoryIds(cat._id);
        query.category = { $in: categoryIds };
      }
    }

    if (brand) query.brand = brand;
    if (status) query.status = status; // ✅ Lấy sản phẩm có discount > 0 (không bao gồm Flash Sale)

    if (isSale === "true") {
      query.discount = { $gt: 0 };
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = +minPrice;
      if (maxPrice) query.price.$lte = +maxPrice;
    }

    const sortOption = sortBy
      ? { [sortBy]: order === "asc" ? 1 : -1 }
      : { createdAt: -1 };

    const total = await Product.countDocuments(query);
    // ✅ Chuyển đổi page/limit sang số và tính skip
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(query)
      .populate("category", "name slug")
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit)); // Dùng parseInt(limit)

    res.json({
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      products,
    });
  } catch (error) {
    console.error("❌ [getProducts] Lỗi:", error);
    res.status(500).json({ message: error.message });
  }
};

// =========================================================
// 📦 GET PRODUCT BY ID (Đã sửa lỗi 500)
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
    // Tránh lỗi 500 nếu ID không hợp lệ
    res.status(400).json({ message: "ID sản phẩm không hợp lệ" });
  }
};

// =========================================================
// 🏷️ GET BRANDS (TỐT)
// =========================================================
export const getBrands = async (req, res) => {
  try {
    const brands = await Product.distinct("brand");
    if (!brands || brands.length === 0) {
      return res.status(200).json([]);
    }
    const formatted = brands
      .filter((b) => typeof b === "string" && b.trim() !== "")
      .map((b) => ({ value: b.trim(), label: b.trim() }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error("❌ [getBrands] Lỗi khi lấy danh sách brand:", error);
    res.status(500).json({
      message: "Lỗi server khi lấy danh sách thương hiệu",
      error: error.message,
    });
  }
};

// =========================================================
// 🛒 GET FLASH SALE PRODUCTS (Đã sửa logic)
// =========================================================
export const getFlashSaleProducts = async (req, res) => {
  try {
    const now = new Date(); // ✅ CHỈ LẤY SẢN PHẨM CÓ FLASH SALE HỢP LỆ (Không bao gồm discount thường)

    const query = {
      "flashSale.isActive": true,
      "flashSale.startTime": { $lte: now },
      "flashSale.endTime": { $gte: now },
    };
    // Lấy theo tiêu chí: flashSale.isActive=true VÀ đang trong thời gian
    const products = await Product.find(query).populate(
      "category",
      "name slug"
    );

    res.status(200).json({
      total: products.length,
      products,
    });
  } catch (error) {
    console.error("❌ [getFlashSaleProducts] Lỗi:", error);
    res.status(500).json({ message: "Lỗi khi lấy sản phẩm flash sale" });
  }
};

// =========================================================
// 🧩 CREATE PRODUCT (TỐT)
// =========================================================
export const createProduct = async (req, res) => {
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
      discount, // ⚡ Flash Sale
      flashIsActive,
      flashStartTime,
      flashEndTime,
      flashPrice,
    } = req.body;

    if (!name) return res.status(400).json({ message: "Thiếu tên sản phẩm" });
    if (!price) return res.status(400).json({ message: "Thiếu giá sản phẩm" });
    if (!category)
      return res.status(400).json({ message: "Thiếu danh mục sản phẩm" });

    let cat = mongoose.Types.ObjectId.isValid(category)
      ? await Category.findById(category)
      : await Category.findOne({ slug: category });
    if (!cat) return res.status(400).json({ message: "Category không hợp lệ" });

    const finalSlug = slug || name.toLowerCase().replace(/\s+/g, "-");
    const slugExists = await Product.findOne({ slug: finalSlug });
    if (slugExists)
      return res
        .status(400)
        .json({ message: "Slug đã tồn tại. Chọn tên khác." });

    let images = [];
    if (Array.isArray(req.files) && req.files.length > 0) {
      images = req.files.map((f) => f.path);
    }

    const discountValue = Number(discount);
    const safeDiscount = Math.max(
      0,
      Math.min(100, isNaN(discountValue) ? 0 : discountValue)
    ); // ⚡ Gắn thông tin Flash Sale (nếu có)

    const flashSaleData = {
      isActive: flashIsActive === "true",
      startTime: flashStartTime ? new Date(flashStartTime) : undefined,
      endTime: flashEndTime ? new Date(flashEndTime) : undefined,
      flashPrice: flashPrice ? Number(flashPrice) : undefined,
    };

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
      flashSale: flashSaleData,
    });

    const saved = await newProduct.save();
    const populated = await saved.populate("category", "name slug");

    res.status(201).json(populated);
  } catch (error) {
    console.error("❌ [createProduct] Lỗi:", error);
    res
      .status(500)
      .json({ message: error.message || "Lỗi server khi tạo sản phẩm" });
  }
};

// =========================================================
// 🧩 UPDATE PRODUCT (Đã sửa lỗi phức tạp)
// =========================================================
export const updateProduct = async (req, res) => {
  try {
    const updateData = { ...req.body };
    const productId = req.params.id; // ✅ Xử lý category

    if (updateData.category) {
      const cat = mongoose.Types.ObjectId.isValid(updateData.category)
        ? await Category.findById(updateData.category)
        : await Category.findOne({ slug: updateData.category });
      if (!cat)
        return res.status(400).json({ message: "Category không hợp lệ" });
      updateData.category = cat._id;
    } // ✅ Xử lý slug và name_no_sign

    if (updateData.name) {
      updateData.slug =
        updateData.slug ||
        removeVietnameseSigns(updateData.name).replace(/\s+/g, "-");
      updateData.name_no_sign = removeVietnameseSigns(updateData.name);
    } // ✅ Kiểm tra trùng lặp slug (trừ slug hiện tại)

    if (updateData.slug) {
      const slugExists = await Product.findOne({
        slug: updateData.slug,
        _id: { $ne: productId },
      });
      if (slugExists)
        return res
          .status(400)
          .json({ message: "Slug đã tồn tại. Chọn tên khác." });
    } // ✅ Giảm giá

    if (updateData.discount !== undefined) {
      const discountValue = Number(updateData.discount);
      updateData.discount = Math.max(
        0,
        Math.min(100, isNaN(discountValue) ? 0 : discountValue)
      );
    } // ✅ Ảnh: ảnh cũ + ảnh mới (Đã đơn giản hóa logic)

    let images = [];
    if (updateData.existingImages) {
      images = Array.isArray(updateData.existingImages)
        ? updateData.existingImages
        : [updateData.existingImages];
    }
    if (req.files && req.files.length > 0) {
      const newFiles = req.files.map((f) => f.path);
      images = [...images, ...newFiles];
    }
    updateData.images = images;
    delete updateData.existingImages; // Xóa trường không cần thiết // ✅ Flash Sale (Đã đơn giản hóa và sửa lỗi logic)

    // Lấy giá trị boolean chính xác
    const isFlashSaleEnabled =
      updateData.flashIsActive === "true" || updateData.flashIsActive === true;

    // Chuẩn bị dữ liệu Flash Sale
    if (isFlashSaleEnabled) {
      const flashStartTime = updateData.flashStartTime
        ? new Date(updateData.flashStartTime)
        : null;
      const flashEndTime = updateData.flashEndTime
        ? new Date(updateData.flashEndTime)
        : null;
      const flashPrice = updateData.flashPrice
        ? Number(updateData.flashPrice)
        : null;

      // Validation Flash Sale
      if (!flashStartTime || !flashEndTime)
        return res
          .status(400)
          .json({
            message: "Vui lòng chọn thời gian bắt đầu và kết thúc Flash Sale!",
          });
      if (flashStartTime >= flashEndTime)
        return res
          .status(400)
          .json({
            message: "Thời gian bắt đầu phải trước thời gian kết thúc!",
          });
      // Lấy giá gốc để so sánh
      const currentProduct = await Product.findById(productId).select("price");
      const priceToCompare = updateData.price || currentProduct.price;

      if (!flashPrice || flashPrice <= 0 || flashPrice >= priceToCompare)
        return res
          .status(400)
          .json({
            message: "Giá Flash Sale phải nhỏ hơn giá gốc và lớn hơn 0!",
          });

      updateData.flashSale = {
        isActive: true,
        startTime: flashStartTime,
        endTime: flashEndTime,
        flashPrice: flashPrice,
      };
    } else {
      // Nếu không bật, chỉ cần tắt cờ isActive
      updateData.flashSale = { isActive: false };
    }

    // Xóa các trường tạm thời từ req.body
    delete updateData.isFlashSale;
    delete updateData.flashStartTime;
    delete updateData.flashEndTime;
    delete updateData.flashPrice;
    delete updateData.existingImages; // ✅ Cập nhật sản phẩm

    const updated = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate("category", "name slug");

    if (!updated)
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

    res.json(updated);
  } catch (error) {
    console.error("❌ [updateProduct] Lỗi:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    res
      .status(400)
      .json({ message: error.message || "Lỗi cập nhật không xác định" });
  }
};

// =========================================================
// 🗑️ DELETE PRODUCT (Đã sửa lỗi 500)
// =========================================================
export const deleteProduct = async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    res.json({ message: "Xóa sản phẩm thành công" });
  } catch (error) {
    res.status(400).json({ message: "ID sản phẩm không hợp lệ" });
  }
};
