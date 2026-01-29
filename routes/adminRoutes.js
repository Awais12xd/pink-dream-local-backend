const express = require("express");
const router = express.Router();
const Admin = require("../models/adminModel");
const Order = require("../models/orderModel");
const { verifyAdminToken } = require("../middleware/authMiddleware");
const { sendOrderStatusEmail } = require("../utils/emailService");
const {
  getAllOrders,
  getOrderStats,
  getOrdersReport,
  bulkUpdateOrderStatus,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  adminLogin,
  adminProfile,
  adminLogout,
  adminRetryFailEmails,
  deleteAllOrders,
  fixImageUrls,
} = require("../controllers/adminController");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-here";

// Admin: Get all orders with pagination, filtering, and search
router.get("/admin/orders", getAllOrders);

// IMPORTANT: Stats route MUST come BEFORE the /:orderId route
// Admin: Get order statistics
router.get("/admin/orders/stats", getOrderStats);

// Admin: Get orders by date range (for reports) - MUST come before /:orderId
router.get("/admin/orders/report", getOrdersReport);

// Admin: Bulk update order status - MUST come before /:orderId
router.patch("/admin/orders/bulk-status", bulkUpdateOrderStatus);

// Admin: Get single order details by ID - MUST come AFTER specific routes
router.get("/admin/orders/:orderId", getOrderById);

// Admin: Update order status - MUST come AFTER the GET route
router.patch("/admin/orders/:orderId/status", updateOrderStatus);

// Admin: Delete order (use with caution) - MUST come AFTER other routes
router.delete("/admin/orders/:orderId", deleteOrder);

// Admin: Delete ALL orders (use with EXTREME caution)
router.delete("/admin/orders/delete-all/confirm", deleteAllOrders);



// Admin Login
router.post("/admin/login", adminLogin);

// Get admin profile
router.get("/admin/profile", verifyAdminToken, adminProfile);

// Admin logout
router.post("/admin/logout", verifyAdminToken, adminLogout);

// Add a separate endpoint to retry failed emails
router.post("/admin/retry-email/:orderId", adminRetryFailEmails );

router.post("/fix-image-urls", fixImageUrls);



module.exports = router;
