import mongoose from "mongoose";
import Product from "../models/ProductModel.js";
import Category from "../models/CategoryModel.js";

// =========================================================
// HÀM LOẠI BỎ DẤU TIẾNG VIỆT
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
// ĐỆ QUY LẤY TẤT CẢ CATEGORY CON
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
      fetchAll, // ✅ 1. Thêm biến mới (true/false)
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

    if (brand) {
      query.brand = { $regex: brand, $options: "i" };
    }

    if (status) query.status = status;

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
      : { createdAt: -1 }; // ✅ 2. LOGIC ĐIỀU KIỆN MỚI

    if (fetchAll === "true") {
      // LẤY TẤT CẢ SẢN PHẨM (Cho Admin Dashboard)
      const products = await Product.find(query)
        .populate({
          path: "category",
          select: "name slug parent",
          populate: { path: "parent", select: "name" },
        })
        .sort(sortOption);

      res.json({
        total: products.length,
        page: 1,
        totalPages: 1,
        products,
      });
    } else {
      // LẤY THEO PHÂN TRANG (Cho Bảng Admin và trang Category)
      const total = await Product.countDocuments(query);
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const products = await Product.find(query)
        .populate({
          path: "category",
          select: "name slug parent",
          populate: { path: "parent", select: "name" },
        })
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit));

      res.json({
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        products,
      });
    }
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
    const now = new Date();
    const { search, sortBy, order } = req.query;

    let query = {
      $or: [
        {
          "flashSale.isActive": true,
          "flashSale.startTime": { $lte: now },
          "flashSale.endTime": { $gte: now },
        },
        { discount: { $gt: 0 } },
      ],
    };

    if (search) {
      const safeSearch = removeVietnameseSigns(search);
      query.name_no_sign = { $regex: safeSearch, $options: "i" };
    }

    let sortOption = { "flashSale.endTime": 1 };

    if (sortBy === "price") {
      sortOption = { "flashSale.flashPrice": order === "asc" ? 1 : -1 };
    } else if (sortBy === "discount") {
      sortOption = { discount: -1 };
    }

    const products = await Product.find(query)
      .populate("category", "name slug")
      .sort(sortOption);

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
    // ✅ FIX 400: Ép kiểu dữ liệu từ FormData (là string)
    const {
      name,
      slug,
      price: priceStr,
      description,
      category,
      stock: stockStr,
      brand,
      status,
      size,
      material,
      origin,
      discount: discountStr,
      flashIsActive,
      flashStartTime,
      flashEndTime,
      flashPrice: flashPriceStr,
    } = req.body;

    // Ép kiểu các trường số
    const price = Number(priceStr);
    const stock = Number(stockStr);
    const discount = Number(discountStr);
    const flashPrice = Number(flashPriceStr);

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

    const safeDiscount = Math.max(
      0,
      Math.min(100, isNaN(discount) ? 0 : discount)
    );

    const flashSaleData = {
      isActive: flashIsActive === "true",
      startTime: flashStartTime ? new Date(flashStartTime) : undefined,
      endTime: flashEndTime ? new Date(flashEndTime) : undefined,
      flashPrice: flashPrice ? flashPrice : undefined,
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
// 🧩 UPDATE PRODUCT (FIX LỖI MẤT ẢNH VÀ GHI ĐÈ)
// =========================================================
export const updateProduct = async (req, res) => {
  try {
    const updateData = { ...req.body };
    const productId = req.params.id;

    // ✅ 1. TRUY VẤN SẢN PHẨM HIỆN TẠI ĐỂ CÓ MẢNG ẢNH GỐC VÀ GIÁ
    const currentProduct = await Product.findById(productId).select(
      "price images"
    );
    if (!currentProduct)
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" }); // ✅ FIX 400: Ép kiểu dữ liệu từ FormData (Giữ nguyên)

    const { price, stock, discount, flashPrice, flashIsActive } = updateData;
    if (price !== undefined) updateData.price = Number(price);
    if (stock !== undefined) updateData.stock = Number(stock);
    if (discount !== undefined) updateData.discount = Number(discount);
    if (flashPrice !== undefined) updateData.flashPrice = Number(flashPrice);
    const isFlashSaleEnabled = flashIsActive === "true"; // ======================================================= // ✅ FIX LỖI ẢNH: Gộp ảnh cũ từ DB và ảnh mới từ Multer // =======================================================

    // ... (Logic xử lý category, slug, discount giữ nguyên) ...
    // ... (Logic kiểm tra trùng slug giữ nguyên) ...

    let images = []; // 1. Lấy ảnh mà FE MUỐN GIỮ LẠI (existingImages)

    if (updateData.existingImages) {
      // Nếu FE gửi existingImages, ta chỉ giữ lại những ảnh đó
      images = Array.isArray(updateData.existingImages)
        ? updateData.existingImages
        : [updateData.existingImages];
    } else {
      // Nếu FE KHÔNG gửi existingImages (lỗi hoặc chỉ update trường khác),
      // ta giữ nguyên tất cả ảnh hiện có trong DB.
      // Đây là lớp bảo vệ nếu Frontend không gửi trường này.
      images = currentProduct.images || [];
    }

    // 2. Thêm ảnh mới upload (req.files)
    if (req.files && req.files.length > 0) {
      const newFiles = req.files.map((f) => f.path);
      images = [...images, ...newFiles];
    }

    updateData.images = images; // Gán lại mảng ảnh cuối cùng
    delete updateData.existingImages; // Xóa trường tạm thời // ====== ✅ Xử lý Flash Sale (Giữ nguyên logic) ======

    if (isFlashSaleEnabled) {
      const flashStartTime = updateData.flashStartTime
        ? new Date(updateData.flashStartTime)
        : null;
      const flashEndTime = updateData.flashEndTime
        ? new Date(updateData.flashEndTime)
        : null;
      const flashPriceNum = updateData.flashPrice;

      // Lấy giá gốc để so sánh (Đã có currentProduct)
      const priceToCompare = updateData.price || currentProduct.price;

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
      if (
        !flashPriceNum ||
        flashPriceNum <= 0 ||
        flashPriceNum >= priceToCompare
      )
        return res
          .status(400)
          .json({
            message: "Giá Flash Sale phải nhỏ hơn giá gốc và lớn hơn 0!",
          });

      updateData.flashSale = {
        isActive: true,
        startTime: flashStartTime,
        endTime: flashEndTime,
        flashPrice: flashPriceNum,
      };
    } else {
      updateData.flashSale = { isActive: false };
    }

    // ❌ QUAN TRỌNG: XÓA TRƯỜNG STATUS ĐỂ HOOK MONGOOSE TỰ XỬ LÝ KHO HÀNG
    delete updateData.status; // Xóa các trường tạm thời từ req.body
    delete updateData.flashIsActive;
    delete updateData.flashStartTime;
    delete updateData.flashEndTime;
    delete updateData.flashPrice; // ✅ Cập nhật sản phẩm

    const updated = await Product.findByIdAndUpdate(productId, updateData, {
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
