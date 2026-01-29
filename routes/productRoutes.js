const express = require('express');
const { addProduct, updateProduct, getProductById, getProductBySlug, getFeaturedProducts, searchProducts, getProductsByCategory, getProductFilters, getCategories, getAllProducts, removeProduct, incrementSalesCountOfProduct, getProductRecommendations, bulkStatusOperations, bulkDeleteProduct, updateProductInventory, getProductAnalytics, bulkUpdateProduct, productSeoSitemap, updateProductStock, productInventoryManagement, generateSampleDataForProductsAndSales } = require('../controllers/productController');
const router = express.Router();

// Enhanced API for add product with all new fields
router.post("/addproduct", addProduct );

// Enhanced API for updating products
router.post("/updateproduct", updateProduct);

// Enhanced API for getting single product with all fields and view tracking
router.get("/product/:id", getProductById);

// Enhanced API for getting products by slug (SEO-friendly URLs)
router.get("/product/slug/:slug", getProductBySlug );

// API for getting featured products
router.get("/featured-products", getFeaturedProducts );

// API for getting products by category with enhanced filtering
router.get("/category/:category", getProductsByCategory );

// Enhanced search API with more filters
router.get("/search", searchProducts );

// API for getting product filters (brands, colors, sizes, price range)
router.get("/product-filters", getProductFilters );

// Enhanced removeproduct API
router.post("/removeproduct", removeProduct );

// Enhanced allproducts API (IMPORTANT: Remove available: true filter for admin panel)
router.get("/allproducts", getAllProducts );

router.get("/categories", getCategories );

// =============================================
// NEW ENDPOINTS FOR PRODUCT DETAILS SUPPORT
// =============================================

// Get product analytics
router.get("/product/:id/analytics", getProductAnalytics );

// Update product inventory
router.put("/product/:id/inventory", updateProductInventory);

// Increment sales count when a sale is made
router.post("/product/:id/sale", incrementSalesCountOfProduct);

// Get product recommendations
router.get("/product/:id/recommendations", getProductRecommendations);

// Bulk operations for admin efficiency
router.post("/products/bulk-status", bulkStatusOperations );

// Bulk delete products
router.post("/products/bulk-delete",bulkDeleteProduct );

// API for bulk operations
router.post("/products/bulk-update", bulkUpdateProduct)



// Generate sample sales data for testing
router.post('/generate-sample-data', generateSampleDataForProductsAndSales);

// API for inventory management
router.get('/inventory/low-stock', productInventoryManagement);

// API for updating stock quantity
router.post('/inventory/update-stock', updateProductStock);

// API for SEO sitemap
router.get('/sitemap/products', productSeoSitemap);






module.exports = router;