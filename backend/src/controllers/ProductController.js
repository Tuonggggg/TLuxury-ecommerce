import mongoose from "mongoose";
import Product from "../models/ProductModel.js";
import Category from "../models/CategoryModel.js";

// =========================================================
// HÀM TIỆN ÍCH: LOẠI BỎ DẤU TIẾNG VIỆT
// =========================================================
const removeVietnameseSigns = (str) => {
  if (!str) return "";
  str = str.toLowerCase();
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  return str.trim();
};

// Hàm lấy tất cả categoryId con recursively (Giữ nguyên)
async function getAllCategoryIds(parentId) {
  const ids = [parentId];
  const children = await Category.find({ parent: parentId });
  for (const child of children) {
    const childIds = await getAllCategoryIds(child._id);
    ids.push(...childIds);
  }
  return ids;
}

// Lấy tất cả sản phẩm (getProducts)
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
    let query = {};

    // 1. Xử lý Tìm kiếm (SEARCH - ĐÃ SỬA LỖI KHÔNG DẤU)
    // Tìm kiếm trên trường name_no_sign bằng chuỗi đã loại bỏ dấu (Front-end search value)
    if (search) {
      // Loại bỏ dấu khỏi chuỗi tìm kiếm của người dùng
      const safeSearch = removeVietnameseSigns(search);
      // Tìm kiếm trên trường name_no_sign không phân biệt hoa/thường (i)
      query.name_no_sign = { $regex: safeSearch, $options: "i" };
    }

    // 2. Xử lý Lọc theo Category
    if (category) {
      const cat = await Category.findOne({ slug: category });
      if (cat) {
        const categoryIds = await getAllCategoryIds(cat._id);
        query.category = { $in: categoryIds };
      }
    }

    // 3. Xử lý Lọc đơn giản
    if (brand) query.brand = brand;
    if (status) query.status = status;

    // 4. Xử lý Lọc theo Giá (PRICE - ĐÃ TỐI ƯU HÓA)
    if (minPrice || maxPrice) {
      query.price = {};
      const min = Number(minPrice);
      const max = Number(maxPrice);

      if (!isNaN(min) && min >= 0) query.price.$gte = min;
      if (!isNaN(max) && max > 0) query.price.$lte = max;

      // Xóa query.price nếu không có điều kiện nào được áp dụng
      if (Object.keys(query.price).length === 0) {
        delete query.price;
      }
    }

    // 5. Xử lý Phân trang và Sắp xếp
    const sortOption = sortBy
      ? { [sortBy]: order === "asc" ? 1 : -1 }
      : { createdAt: -1 };
    const pageSize = Number(limit) > 0 ? Number(limit) : 10;
    const pageNum = Number(page) > 0 ? Number(page) : 1;
    const skip = (pageNum - 1) * pageSize;

    const total = await Product.countDocuments(query);

    const products = await Product.find(query)
      .populate("category", "name slug")
      .sort(sortOption)
      .skip(skip)
      .limit(pageSize);

    res.json({
      total,
      page: pageNum,
      totalPages: Math.ceil(total / pageSize),
      products,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy 1 sản phẩm
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

// Tạo sản phẩm mới (ĐÃ SỬA: LƯU TRƯỜNG name_no_sign)
export const createProduct = async (req, res) => {
  console.log("🚀 ~ createProduct ~ req:", req.body, req.file, req.files);
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

    if (!name)
      return res.status(400).json({ message: "Tên sản phẩm là bắt buộc" });
    if (!price)
      return res.status(400).json({ message: "Giá sản phẩm là bắt buộc" });
    if (!category)
      return res.status(400).json({ message: "Category là bắt buộc" }); // Category có thể là ObjectId hoặc slug

    let cat = null;
    if (mongoose.Types.ObjectId.isValid(category)) {
      cat = await Category.findById(category);
    }
    if (!cat) {
      cat = await Category.findOne({ slug: category });
    }
    if (!cat) return res.status(400).json({ message: "Category không hợp lệ" }); // Tự sinh slug nếu không có

    const finalSlug = slug || name.toLowerCase().replace(/\s+/g, "-");

    // LƯU TRƯỜNG name_no_sign BẰNG CÁCH LOẠI BỎ DẤU TỪ TRƯỜNG name
    const nameNoSign = removeVietnameseSigns(name); // Xử lý ảnh upload hoặc URL sẵn có

    const images = [];
    if (req.file) images.push(req.file.path); // single file
    if (req.files) images.push(...req.files.map((f) => f.path)); // multiple files
    if (req.body.images) images.push(...req.body.images); // URL có sẵn

    const newProduct = new Product({
      name,
      name_no_sign: nameNoSign, // 🚨 LƯU TRƯỜNG MỚI ĐỂ TÌM KIẾM
      slug: finalSlug,
      price,
      description,
      category: cat._id,
      stock,
      brand,
      status,
      size,
      material,
      origin,
      discount,
      images,
    });

    const savedProduct = await newProduct.save();
    const populatedProduct = await savedProduct.populate(
      "category",
      "name slug"
    );

    res.status(201).json(populatedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Cập nhật sản phẩm (ĐÃ SỬA: CẬP NHẬT TRƯỜNG name_no_sign)
export const updateProduct = async (req, res) => {
  try {
    const updateData = { ...req.body }; // Category nếu gửi slug hoặc ObjectId

    if (updateData.category) {
      const cat = mongoose.Types.ObjectId.isValid(updateData.category)
        ? await Category.findById(updateData.category)
        : await Category.findOne({ slug: updateData.category });
      if (!cat)
        return res.status(400).json({ message: "Category không hợp lệ" });
      updateData.category = cat._id;
    } // Tự sinh slug nếu không có

    if (updateData.name && !updateData.slug) {
      updateData.slug = updateData.name.toLowerCase().replace(/\s+/g, "-");
    }

    // 🚨 THÊM LOGIC CẬP NHẬT name_no_sign
    if (updateData.name) {
      updateData.name_no_sign = removeVietnameseSigns(updateData.name);
    } // Xử lý ảnh upload hoặc URL

    const images = [];
    if (req.file) images.push(req.file.path);
    if (req.files) images.push(...req.files.map((f) => f.path));
    if (req.body.images) images.push(...req.body.images);
    if (images.length > 0) updateData.images = images;

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate("category", "name slug");

    if (!updatedProduct)
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Xóa sản phẩm
export const deleteProduct = async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct)
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    res.json({ message: "Xóa sản phẩm thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
