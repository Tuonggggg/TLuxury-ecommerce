import mongoose from "mongoose";
import Product from "../models/ProductModel.js";
import Category from "../models/CategoryModel.js";

// Hàm lấy tất cả categoryId con recursively
async function getAllCategoryIds(parentId) {
  const ids = [parentId];
  const children = await Category.find({ parent: parentId });
  for (const child of children) {
    const childIds = await getAllCategoryIds(child._id);
    ids.push(...childIds);
  }
  return ids;
}

// Lấy tất cả sản phẩm
export const getProducts = async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, brand, status, sortBy, order, page = 1, limit = 10 } = req.query;
    let query = {};

    if (search) query.name = { $regex: search, $options: "i" };
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
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const sortOption = sortBy ? { [sortBy]: order === "asc" ? 1 : -1 } : { createdAt: -1 };
    const skip = (page - 1) * limit;
    const total = await Product.countDocuments(query);

    const products = await Product.find(query)
      .populate("category", "name slug")
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));

    res.json({ total, page: Number(page), totalPages: Math.ceil(total / limit), products });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy 1 sản phẩm
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category", "name slug");
    if (!product) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Tạo sản phẩm mới
export const createProduct = async (req, res) => {
  console.log('🚀 ~ createProduct ~ req:', req.body, req.file, req.files);
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

    if (!name) return res.status(400).json({ message: "Tên sản phẩm là bắt buộc" });
    if (!price) return res.status(400).json({ message: "Giá sản phẩm là bắt buộc" });
    if (!category) return res.status(400).json({ message: "Category là bắt buộc" });

    // Category có thể là ObjectId hoặc slug
    let cat = null;
    if (mongoose.Types.ObjectId.isValid(category)) {
      cat = await Category.findById(category);
    }
    if (!cat) {
      cat = await Category.findOne({ slug: category });
    }
    if (!cat) return res.status(400).json({ message: "Category không hợp lệ" });

    // Tự sinh slug nếu không có
    const finalSlug = slug || name.toLowerCase().replace(/\s+/g, "-");

    // Xử lý ảnh upload hoặc URL sẵn có
    const images = [];
    if (req.file) images.push(req.file.path); // single file
    if (req.files) images.push(...req.files.map(f => f.path)); // multiple files
    if (req.body.images) images.push(...req.body.images); // URL có sẵn

    const newProduct = new Product({
      name,
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
    const populatedProduct = await savedProduct.populate("category", "name slug");

    res.status(201).json(populatedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Cập nhật sản phẩm
export const updateProduct = async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Category nếu gửi slug hoặc ObjectId
    if (updateData.category) {
      const cat = mongoose.Types.ObjectId.isValid(updateData.category)
        ? await Category.findById(updateData.category)
        : await Category.findOne({ slug: updateData.category });
      if (!cat) return res.status(400).json({ message: "Category không hợp lệ" });
      updateData.category = cat._id;
    }

    // Tự sinh slug nếu không có
    if (updateData.name && !updateData.slug) {
      updateData.slug = updateData.name.toLowerCase().replace(/\s+/g, "-");
    }

    // Xử lý ảnh upload hoặc URL
    const images = [];
    if (req.file) images.push(req.file.path);
    if (req.files) images.push(...req.files.map(f => f.path));
    if (req.body.images) images.push(...req.body.images);
    if (images.length > 0) updateData.images = images;

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate("category", "name slug");

    if (!updatedProduct) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Xóa sản phẩm
export const deleteProduct = async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    res.json({ message: "Xóa sản phẩm thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
