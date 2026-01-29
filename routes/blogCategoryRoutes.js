const express = require('express');
const router = express.Router();
const { getAllBlogCategories, getBlogCategoryById, createBlogCategory, updateBlogCategory, toggleActiveStatusOfBlogCategory, deleteBlogCategory, reorderBlogCategory, getBlogCategoryStats } = require('../controllers/blogCategoryController');

router.get('/blog-categories', getAllBlogCategories);

// GET - Fetch single category by ID
router.get("/blog-categories/:id", getBlogCategoryById)

// POST - Create new category
router.post("/blog-categories", createBlogCategory)


// PUT - Update category
router.put("/blog-categories/:id", updateBlogCategory)


// PATCH - Toggle category active status
router.patch("/blog-categories/:id/toggle-active", toggleActiveStatusOfBlogCategory)

// DELETE - Delete category
router.delete("/blog-categories/:id", deleteBlogCategory)


// POST - Reorder categories
router.post("/blog-categories/reorder", reorderBlogCategory )

// GET - Get category statistics
router.get("/blog-categories/stats/overview", getBlogCategoryStats)

// console.log('📁 Categories Management API loaded successfully');
// console.log('   GET    /categories - Get all categories');
// console.log('   GET    /categories/:id - Get single category');
// console.log('   POST   /categories - Create new category');
// console.log('   PUT    /categories/:id - Update category');
// console.log('   PATCH  /categories/:id/toggle-active - Toggle active status');
// console.log('   DELETE /categories/:id - Delete category');
// console.log('   POST   /categories/reorder - Reorder categories');
// console.log('   GET    /categories/stats/overview - Get category statistics');


// Create Payment Intent


module.exports = router;