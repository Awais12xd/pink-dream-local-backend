const BlogCategory = require("../models/blogCategoryModel");

    
const getAllBlogCategories =   async (req, res) => {
  try {
    const { active, search } = req.query;

    let query = {};

    // Filter by active status if specified
    if (active !== undefined) {
      query.isActive = active == "true";
    }

    // Search by name if specified
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const blogCategories = await BlogCategory.find(query);

    res.json({
      success: true,
      blogCategories,
    });
  } catch (error) {
    console.error("Error fetching blogCategories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch blogCategories",
      error: error.message,
    });
  }
}


const getBlogCategoryById = async (req, res) => {
  try {
    const blogCategory = await BlogCategory.findById(req.params.id);

    if (!blogCategory) {
      return res.status(404).json({
        success: false,
        message: "Blog Category not found",
      });
    }

    res.json({
      success: true,
      blogCategory,
    });
  } catch (error) {
    console.error("Error fetching blog category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch blog category",
      error: error.message,
    });
  }
};

 const createBlogCategory  =  async (req, res) => {
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
    const existingCategory = await BlogCategory.findOne({
      $or: [{ name }, { slug }],
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category with this name already exists",
      });
    }

    // Get the highest order number
    const lastCategory = await BlogCategory.findOne().sort({ order: -1 });
    const order = lastCategory ? lastCategory.order + 1 : 1;

    const blogCategory = new BlogCategory({
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

    await blogCategory.save();

    console.log("✅Blog Category created:", blogCategory.name);

    res.json({
      success: true,
      message: "Blog Category created successfully",
      blogCategory,
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


const updateBlogCategory  =  async (req, res) => {
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

    const blogCategory = await BlogCategory.findById(req.params.id);

    if (!blogCategory) {
      return res.status(404).json({
        success: false,
        message: "Blog Category not found",
      });
    }

    // If name is being updated, generate new slug
    if (name && name !== blogCategory.name) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();

      // Check if new name/slug is already taken
      const existingCategory = await BlogCategory.findOne({
        _id: { $ne: req.params.id },
        $or: [{ name }, { slug }],
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: "Blog Category with this name already exists",
        });
      }

      blogCategory.name = name;
      blogCategory.slug = slug;
    }

    // Update other fields
    if (description !== undefined) blogCategory.description = description;
    if (image !== undefined) blogCategory.image = image;
    if (icon !== undefined) blogCategory.icon = icon;
    if (isActive !== undefined) blogCategory.isActive = isActive;
    if (parentCategory !== undefined)
      blogCategory.parentCategory = parentCategory;
    if (metaTitle !== undefined) blogCategory.metaTitle = metaTitle;
    if (metaDescription !== undefined)
      blogCategory.metaDescription = metaDescription;
    if (order !== undefined) blogCategory.order = order;

    await blogCategory.save();

    console.log("✅Blog Category updated:", blogCategory.name);

    res.json({
      success: true,
      message: "Blog Category updated successfully",
      blogCategory,
    });
  } catch (error) {
    console.error("Error updating blog category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update blog category",
      error: error.message,
    });
  }
};


const toggleActiveStatusOfBlogCategory  =  async (req, res) => {
  try {
    const blogCategory = await BlogCategory.findById(req.params.id);

    if (!blogCategory) {
      return res.status(404).json({
        success: false,
        message: "Blog Category not found",
      });
    }

    blogCategory.isActive = !blogCategory.isActive;
    await blogCategory.save();

    console.log(
      `✅ Category ${blogCategory.isActive ? "activated" : "deactivated"}:`,
      blogCategory.name,
    );

    res.json({
      success: true,
      message: `Blog Category ${blogCategory.isActive ? "activated" : "deactivated"} successfully`,
      blogCategory,
    });
  } catch (error) {
    console.error("Error toggling blog category status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle blog category status",
      error: error.message,
    });
  }
};

 const deleteBlogCategory =  async (req, res) => {
  try {
    const blogCategory = await BlogCategory.findById(req.params.id);

    if (!blogCategory) {
      return res.status(404).json({
        success: false,
        message: "Blog Category not found",
      });
    }

    await BlogCategory.findByIdAndDelete(req.params.id);

    console.log("✅Blog Category deleted:", blogCategory.name);

    res.json({
      success: true,
      message: "Blog Category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting blog category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete blog category",
      error: error.message,
    });
  }
};


const reorderBlogCategory  =  async (req, res) => {
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

const getBlogCategoryStats  =  async (req, res) => {
  try {
    const totalCategories = await BlogCategory.countDocuments();
    const activeCategories = await BlogCategory.countDocuments({
      isActive: true,
    });
    const inactiveCategories = await BlogCategory.countDocuments({
      isActive: false,
    });

    // Get categories with product counts
    // const blogCategories = await BlogCategory.find();

    // Update product counts for each category
    // const categoriesWithCounts = await Promise.all(
    //     blogCategories.map(async (category) => {
    //         const productCount = await Product.countDocuments({
    //             blogCategories: category.name,
    //             available: true
    //         });
    //         return {
    //             ...category.toObject(),
    //             productCount
    //         };
    //     })
    // );

    res.json({
      success: true,
      stats: {
        total: totalCategories,
        active: activeCategories,
        inactive: inactiveCategories,
      },
      // categories: categoriesWithCounts
    });
  } catch (error) {
    console.error("Error fetching blog category stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch blog category statistics",
      error: error.message,
    });
  }
};

module.exports = {
    getAllBlogCategories,
    getBlogCategoryById,
    createBlogCategory,
    updateBlogCategory,
    toggleActiveStatusOfBlogCategory,
    getBlogCategoryStats,
    deleteBlogCategory,
    reorderBlogCategory,
};


