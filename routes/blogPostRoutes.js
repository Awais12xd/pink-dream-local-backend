const express = require("express");
const {
  createBlog,
  getAllBlogs,
  deleteBlog,
  getBlogById,
  writeCommentOnBlog,
  updateBlog,
  toggleBlogLike,
  replyToComment,
} = require("../controllers/blogPostController");
const { verifyAdminToken } = require("../middleware/authMiddleware");
const router = express.Router();

// router.post("/add-blog" , verifyAdminToken , addBlogPost)

router.post("/add-blog", createBlog);

// Get all blogs with filtering, sorting & pagination
router.get("/all-blogs", getAllBlogs);

//Delete a Blog
router.post("/delete-blog/:id", deleteBlog);

// Get a blog by id
router.get("/blog/:id", getBlogById);

//Write a comment
router.post("/blog/:id/comment", writeCommentOnBlog);

router.post("/blogs/:blogId/comments/:commentId/reply", replyToComment);

// POST /blogs/:blogId/comments/:commentId/reply



// Update Blog - FIXED to handle both ID types
router.put("/update-blog/:id", updateBlog);

//Toggle Like
router.post("/blog/:id/like", toggleBlogLike);

module.exports = router;
