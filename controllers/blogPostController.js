const mongoose = require("mongoose");
const BlogPost = require("../models/blogPostModel");
const BlogCategory = require("../models/blogCategoryModel");
const sanitizeHtml = require('sanitize-html');

// Helper function to validate product ID (supports both numeric and ObjectId)
const validateBlogId = (id) => {
  // Check if it's a valid MongoDB ObjectId
  if (mongoose.Types.ObjectId.isValid(id)) {
    return { isValid: true, type: "objectId", value: id };
  }

  // Check if it's a numeric ID
  const numId = parseInt(id);
  if (!isNaN(numId) && numId > 0) {
    return { isValid: true, type: "numeric", value: numId };
  }

  return { isValid: false, type: null, value: null };
};

const createBlog = async (req, res) => {
  try {
    const slug =
      req.body.slug ||
      req.body.title
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();

    const metaTitle =
      req.body.metaTitle ||
      `${req.body.title} - ${req.body.category} | Your Store`;

    const author = {
      name: req.body.authorName,
      profileImage:
        req.body.authorProfileImage ||
        "https://up.yimg.com/ib/th/id/OIP.fEi7a3-GaqSrnK68-Sp2YwHaHa?pid=Api&rs=1&c=1&qlt=95&w=105&h=105",
      bio: req.body.bio,
    };

     const safeHtml = sanitizeHtml(req.body.content, {
    allowedTags: [
      'p','h1','h2','h3','strong','em','a','ul','ol','li',
      'blockquote','code','pre'
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel']
    },
    allowedSchemes: ['http', 'https']
  });

    const blog = new BlogPost({
      title: req.body.title,
      category: req.body.category,
      shortDescription: req.body.shortDescription || "",
      content: safeHtml || "",
      image: req.body.image,
      author: author,
      tags: req.body.tags || [],
      featured: req.body.featured || false,
      trending: req.body.trending || false,
      status: req.body.status || "draft",
      publishedAt: Date.now(),
      readTime: req.body.readTime || 10,
      metaTitle: metaTitle,
      metaDescription: req.body.metaDescription || "",
      metaKeywords: req.body.metaKeywords || "",
      slug: slug,
    });

   

      

    console.log("Adding Blog:", blog.title);
    await blog.save();
    console.log("Blog saved successfully");

    res.json({
      success: true,
      title: req.body.title,
      blog: blog,
    });
  } catch (error) {
    console.error("Error adding blog:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const getAllBlogs = async (req, res) => {
  try {
    /* =========================
       PAGINATION
       ========================= */
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    /* =========================
       FILTER PARAMETERS
       ========================= */
    const search = req.query.search || "";
    const category = req.query.category || "all";
    const tag = req.query.tag || "";
    // const badge = req.query.badge || ""; // featured | trending
    const sortBy = req.query.sortBy || "latest";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
    const status = req.query.status || "All";

    /* =========================
       BASE QUERY
       ========================= */
    let query = {};

    if (status != "All") {
      query = {
        status: status,
      };
    }

    /* =========================
       SEARCH (title, excerpt, content)
       ========================= */
    if (typeof search === "string" && search.trim() !== "") {
      const keyword = search.trim();

      query.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { shortDescription: { $regex: keyword, $options: "i" } },
      ];
    }

    /* =========================
       CATEGORY FILTER
       ========================= */
    if (category.toLowerCase() !== "all") {
      query.category = category;
    }

    if (tag && tag.toLowerCase() !== "all") {
      query["tags.slug"] = tag.toLowerCase();
    }

    let sortObj = {};

    switch (sortBy) {
      case "name":
        sortObj.name = sortOrder;
        break;
      case "most_viewed":
        sortObj.views = -1;
        break;
      case "most_liked":
        sortObj.likes = -1;
        break;
      default:
        // latest / Oldest
        sortObj.publishedAt = sortOrder;
    }
    const [blogs, totalBlogs] = await Promise.all([
      BlogPost.find(query).sort(sortObj).skip(skip).limit(limit).lean(),
      BlogPost.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalBlogs / limit);

    res.status(200).json({
      success: true,
      blogs,
      pagination: {
        currentPage: page,
        totalPages,
        totalBlogs,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit,
      },
    });
  } catch (error) {
    console.error("Error in getAllBlogs:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const deleteBlog = async (req, res) => {
  try {
    const { title } = req.body;
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Blog ID is required",
      });
    }

    const deletedBlog = await BlogPost.findOneAndDelete({ _id: id });

    if (!deletedBlog) {
      return res.status(409).json({
        success: false,
        message: "Blog not found",
      });
    }

      

    console.log("Blog deleted:", deletedBlog.title);
    res.json({
      success: true,
      message: `Blog "${title || deletedBlog.title}" deleted successfully`,
      title: title || deletedBlog.title,
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete blog",
      error: error.message,
    });
  }
};

const getBlogById = async (req, res) => {
  const validateBlogId = (id) => {
    // Check if it's a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(id)) {
      return { isValid: true, type: "objectId", value: id };
    }

    // Check if it's a numeric ID
    const numId = parseInt(id);
    if (!isNaN(numId) && numId > 0) {
      return { isValid: true, type: "numeric", value: numId };
    }

    return { isValid: false, type: null, value: null };
  };
  try {
    const blogIdParam = req.params.id;
    console.log(`Received Blog ID: ${blogIdParam}`);

    const validation = validateBlogId(blogIdParam);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid blog ID format. Must be a valid MongoDB ObjectId or numeric ID.",
        provided: blogIdParam,
      });
    }

    let query = {};

    // Build query based on ID type
    if (validation.type === "objectId") {
      query._id = validation.value;
    } else if (validation.type === "numeric") {
      query.id = validation.value;
    }

    console.log(`Searching for blog with query:`, query);

    // Find product and increment view count
    const blog = await BlogPost.findOneAndUpdate(
      query,
      { $inc: { views: 1 } },
      { new: true },
    );

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
        searchedId: blogIdParam,
        queryUsed: query,
      });
    }

    // Convert to JSON to include virtuals
    const blogData = blog.toJSON();

    // Ensure SKU is generated if missing
    // if (!blogData.sku || blogData.sku === '') {
    //     blogData.sku = `${blog.category.substring(0, 3).toUpperCase()}-${blog.id || blog._id}`;
    // }

    // Calculate stock status
    // const stockStatus = {
    //     current_stock: product.stock_quantity || 0,
    //     low_stock_threshold: product.low_stock_threshold || 10,
    //     is_low_stock: (product.stock_quantity || 0) <= (product.low_stock_threshold || 10),
    //     is_out_of_stock: (product.stock_quantity || 0) === 0
    // };

    // productData.stock_status = stockStatus;
    // productData.discount_percentage = 0;

    // Calculate discount percentage
    // if (product.old_price && product.old_price > product.new_price) {
    //     productData.discount_percentage = Math.round(((product.old_price - product.new_price) / product.old_price) * 100);
    // }

    console.log(`Blog found: ${blog.title}. Total views: ${blog.views}`);

    res.json({
      success: true,
      blog: blogData,
    });
  } catch (error) {
    console.error("Error fetching blog details:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const writeCommentOnBlog = async (req, res) => {
  console.log("req is hitting");
  try {
    const { id } = req.params;
    const { text, user } = req.body;

    console.log(id, text);

    if (!text || text.trim() === "") {
      return res
        .status(400)
        .json({ success: false, message: "Comment is empty" });
    }

    const blog = await BlogPost.findById(id);
    if (!blog) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }

    console.log(user);

    blog.comments.push({
      user,
      text,
    });

    await blog.save();

    res.json({
      success: true,
      message: "Comment added",
      commentsCount: blog.comments.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateBlog = async (req, res) => {
  try {
    const validateBlogId = (id) => {
      // Check if it's a valid MongoDB ObjectId
      if (mongoose.Types.ObjectId.isValid(id)) {
        return { isValid: true, type: "objectId", value: id };
      }

      // Check if it's a numeric ID
      const numId = parseInt(id);
      if (!isNaN(numId) && numId > 0) {
        return { isValid: true, type: "numeric", value: numId };
      }

      return { isValid: false, type: null, value: null };
    };
    const dataId = req.body.id;

    if (!dataId) {
      return res.status(400).json({
        success: false,
        message: "Valid Blog ID is required",
      });
    }

    const updateData = {};
    const safeHtml = sanitizeHtml(req.body.content, {
    allowedTags: [
      'p','h1','h2','h3','strong','em','a','ul','ol','li',
      'blockquote','code','pre'
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel']
    },
    allowedSchemes: ['http', 'https']
  });

    // Build update object with validation
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.category !== undefined)
      updateData.category = req.body.category;
    if (req.body.shortDescription !== undefined)
      updateData.shortDescription = req.body.shortDescription;
    if (req.body.content !== undefined) updateData.content = safeHtml;
    if (req.body.status !== undefined) updateData.status = req.body.status;
    if (req.body.featured !== undefined)
      updateData.featured = req.body.featured;
    if (req.body.trending !== undefined)
      updateData.trending = req.body.trending;
    if (req.body.image !== undefined) updateData.image = req.body.image;


    if (updateData.title) {
      const slug = req.body.title
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      updateData.slug = slug;
    }

    let query = {};
    // if (validation.type === "objectId") {
    //   query._id = validation.value;
    // } else if (validation.type === "numeric") {
    //   query.id = validation.value;
    // }

    query._id = dataId;

    const updatedBlog = await BlogPost.findOneAndUpdate(query, updateData, {
      new: true,
    });

    if (!updatedBlog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    console.log("Blog updated:", updatedBlog.title);
    res.json({
      success: true,
      message: "Blog updated successfully",
      blog: updatedBlog,
    });
  } catch (error) {
    console.error("Error updating blog:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update blog",
      error: error.message,
    });
  }
};

const toggleBlogLike = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const blog = await BlogPost.findById(id);
    if (!blog) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }

    const numberUserId = parseInt(userId);

    const alreadyLiked = blog.likes.users.includes(numberUserId);

    if (alreadyLiked) {
      // Unlike
      blog.likes.users.pull(numberUserId);
      blog.likes.count -= 1;
    } else {
      // Like
      blog.likes.users.push(numberUserId);
      blog.likes.count += 1;
    }

    await blog.save();

    res.json({
      success: true,
      liked: !alreadyLiked,
      totalLikes: blog.likes.count,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createBlog,
  updateBlog,
  toggleBlogLike,
  writeCommentOnBlog,
  deleteBlog,
  getAllBlogs,
  getBlogById,
};
