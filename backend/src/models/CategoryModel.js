import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    
    // =============================================
    // ✅ THÊM DÒNG NÀY
    image: { type: String, default: null },
    // =============================================

    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    children: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
  },
  { timestamps: true }
);

// Middleware tự động push vào children của parent
categorySchema.pre("save", async function (next) {
  if (this.parent) {
    const parentCategory = await mongoose.model("Category").findById(this.parent);
    if (parentCategory && !parentCategory.children.includes(this._id)) {
      parentCategory.children.push(this._id);
      await parentCategory.save();
    }
  }
  next();
});

const Category = mongoose.models.Category
    ? mongoose.model("Category")
    : mongoose.model("Category", categorySchema);

export default Category;