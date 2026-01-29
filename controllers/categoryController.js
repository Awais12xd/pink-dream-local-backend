const Category = require("../models/categoryModel");
const Product = require("../models/productModel");

exports.getAllCategories = async (req, res) => {
  try {
    const { active, search } = req.query;

    let query = {};

    // Filter by active status if specified
    if (active !== undefined) {
      query.isActive = active === "true";
    }

    // Search by name if specified
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const categories = await Category.find(query).sort({ order: 1, name: 1 });

    res.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: error.message,
    });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.json({
      success: true,
      category,
    });
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch category",
      error: error.message,
    });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const {
      name,
      description,
      image,
      icon,
      isActive,
      parentCategory,
      metaTitle,
      metaDescription,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

    // Check if category with same name or slug exists
    const existingCategory = await Category.findOne({
      $or: [{ name }, { slug }],
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category with this name already exists",
      });
    }

    // Get the highest order number
    const lastCategory = await Category.findOne().sort({ order: -1 });
    const order = lastCategory ? lastCategory.order + 1 : 1;

    const category = new Category({
      name,
      slug,
      description: description || "",
      image: image || "",
      icon: icon || "",
      isActive: isActive !== undefined ? isActive : true,
      parentCategory: parentCategory || null,
      metaTitle: metaTitle || name,
      metaDescription: metaDescription || description || "",
      order,
    });

    await category.save();

    console.log("✅ Category created:", category.name);

    res.json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create category",
      error: error.message,
    });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const {
      name,
      description,
      image,
      icon,
      isActive,
      parentCategory,
      metaTitle,
      metaDescription,
      order,
    } = req.body;

    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // If name is being updated, generate new slug
    if (name && name !== category.name) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();

      // Check if new name/slug is already taken
      const existingCategory = await Category.findOne({
        _id: { $ne: req.params.id },
        $or: [{ name }, { slug }],
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: "Category with this name already exists",
        });
      }

      category.name = name;
      category.slug = slug;
    }

    // Update other fields
    if (description !== undefined) category.description = description;
    if (image !== undefined) category.image = image;
    if (icon !== undefined) category.icon = icon;
    if (isActive !== undefined) category.isActive = isActive;
    if (parentCategory !== undefined) category.parentCategory = parentCategory;
    if (metaTitle !== undefined) category.metaTitle = metaTitle;
    if (metaDescription !== undefined)
      category.metaDescription = metaDescription;
    if (order !== undefined) category.order = order;

    await category.save();

    console.log("✅ Category updated:", category.name);

    res.json({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update category",
      error: error.message,
    });
  }
};

exports.toggleCategoryActiveStatus = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    category.isActive = !category.isActive;
    await category.save();

    console.log(
      `✅ Category ${category.isActive ? "activated" : "deactivated"}:`,
      category.name,
    );

    res.json({
      success: true,
      message: `Category ${category.isActive ? "activated" : "deactivated"} successfully`,
      category,
    });
  } catch (error) {
    console.error("Error toggling category status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle category status",
      error: error.message,
    });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Check if category has products
    const productCount = await Product.countDocuments({
      category: category.name,
    });

    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It has ${productCount} products. Please reassign or delete products first.`,
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    console.log("✅ Category deleted:", category.name);

    res.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete category",
      error: error.message,
    });
  }
};

exports.reorderCategory = async (req, res) => {
  try {
    const { categoryIds } = req.body;

    if (!Array.isArray(categoryIds)) {
      return res.status(400).json({
        success: false,
        message: "Category IDs must be an array",
      });
    }

    // Update order for each category
    const updatePromises = categoryIds.map((id, index) =>
      Category.findByIdAndUpdate(id, { order: index }),
    );

    await Promise.all(updatePromises);

    console.log("✅ Categories reordered successfully");

    res.json({
      success: true,
      message: "Categories reordered successfully",
    });
  } catch (error) {
    console.error("Error reordering categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reorder categories",
      error: error.message,
    });
  }
};

exports.getCategoryStats = async (req, res) => {
  try {
    const totalCategories = await Category.countDocuments();
    const activeCategories = await Category.countDocuments({ isActive: true });
    const inactiveCategories = await Category.countDocuments({
      isActive: false,
    });

    // Get categories with product counts
    const categories = await Category.find();

    // Update product counts for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const productCount = await Product.countDocuments({
          category: category.name,
          available: true,
        });
        return {
          ...category.toObject(),
          productCount,
        };
      }),
    );

    res.json({
      success: true,
      stats: {
        total: totalCategories,
        active: activeCategories,
        inactive: inactiveCategories,
      },
      categories: categoriesWithCounts,
    });
  } catch (error) {
    console.error("Error fetching category stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch category statistics",
      error: error.message,
    });
  }
};

module.exports = exports;
