// controllers/adminController.js - Admin Controller

const Product = require("../models/productModel");
const Order = require("../models/orderModel");
const Admin = require("../models/adminModel");
const { sendOrderStatusEmail } = require("../utils/emailService");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log("Admin login attempt:", username);

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    // Find admin
    const admin = await Admin.findOne({ username: username });

    if (!admin) {
      console.log("Admin not found:", username);
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    // Check password (simple comparison for now)
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      console.log("Invalid password for admin:", username);
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        id: admin._id,
        username: admin.username,
        role: admin.role,
        type: "admin", // Important: mark as admin token
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" },
    );

    console.log("Admin login successful:", username);

    res.json({
      success: true,
      message: "Admin login successful",
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        name: admin.name,
        role: admin.role,
        lastLogin: admin.lastLogin,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const adminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select("-password");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    res.json({
      success: true,
      admin: {
        id: admin._id,
        username: admin.username,
        name: admin.name,
        role: admin.role,
        lastLogin: admin.lastLogin,
        createdAt: admin.createdAt,
      },
    });
  } catch (error) {
    console.error("Admin profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const adminLogout = (req, res) => {
  res.json({
    success: true,
    message: "Admin logout successful",
  });
};

// Get all orders (admin)
const getAllOrders = async (req, res) => {
  try {
    console.log("Admin fetching all orders");

    const {
      page = 1,
      limit = 10,
      status = "",
      search = "",
      date = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const query = {};

    if (status && status !== "") {
      query.status = status;
    }

    if (search && search !== "") {
      query.$or = [
        { orderId: { $regex: search, $options: "i" } },
        { "shippingAddress.name": { $regex: search, $options: "i" } },
        { "shippingAddress.email": { $regex: search, $options: "i" } },
        { "items.name": { $regex: search, $options: "i" } },
      ];
    }

    if (date && date !== "") {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);

      query.createdAt = {
        $gte: startDate,
        $lt: endDate,
      };
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limitNum);

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const orders = await Order.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();

    console.log(
      `Admin found ${orders.length} orders out of ${totalOrders} total`,
    );

    res.json({
      success: true,
      orders: orders,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalOrders,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
        limit: limitNum,
      },
    });
  } catch (error) {
    console.error("Error fetching admin orders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

// Get order statistics (admin)
const getOrderStats = async (req, res) => {
  try {
    console.log("Admin fetching order statistics");

    const totalOrders = await Order.countDocuments();
    console.log(`Total orders in database: ${totalOrders}`);

    const statusCounts = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const statusBreakdown = {
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    statusCounts.forEach((stat) => {
      if (stat._id && statusBreakdown.hasOwnProperty(stat._id)) {
        statusBreakdown[stat._id] = stat.count;
      }
    });

    const revenueResult = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: {
              $ifNull: [
                { $toDouble: "$amount.total" },
                { $toDouble: "$totalAmount" },
              ],
            },
          },
          avgOrderValue: {
            $avg: {
              $ifNull: [
                { $toDouble: "$amount.total" },
                { $toDouble: "$totalAmount" },
              ],
            },
          },
        },
      },
    ]);

    const totalRevenue =
      revenueResult.length > 0 ? revenueResult[0].totalRevenue || 0 : 0;
    const avgOrderValue =
      revenueResult.length > 0 ? revenueResult[0].avgOrderValue || 0 : 0;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentOrdersCount = await Order.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    const completedOrders = statusBreakdown.delivered + statusBreakdown.shipped;

    const currentMonth = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const thisMonthStart = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1,
    );
    const lastMonthStart = new Date(
      lastMonth.getFullYear(),
      lastMonth.getMonth(),
      1,
    );
    const lastMonthEnd = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1,
    );

    const thisMonthOrders = await Order.countDocuments({
      createdAt: { $gte: thisMonthStart },
    });

    const lastMonthOrders = await Order.countDocuments({
      createdAt: {
        $gte: lastMonthStart,
        $lt: lastMonthEnd,
      },
    });

    const monthlyGrowth =
      lastMonthOrders > 0
        ? (
            ((thisMonthOrders - lastMonthOrders) / lastMonthOrders) *
            100
          ).toFixed(2)
        : thisMonthOrders > 0
          ? 100
          : 0;

    const stats = {
      totalOrders: totalOrders,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      avgOrderValue: parseFloat(avgOrderValue.toFixed(2)),
      pendingOrders: statusBreakdown.pending,
      confirmedOrders: statusBreakdown.confirmed,
      processingOrders: statusBreakdown.processing,
      shippedOrders: statusBreakdown.shipped,
      deliveredOrders: statusBreakdown.delivered,
      cancelledOrders: statusBreakdown.cancelled,
      completedOrders: completedOrders,
      recentOrdersCount,
      monthlyGrowth: parseFloat(monthlyGrowth),
      statusBreakdown: statusBreakdown,
    };

    console.log("Order statistics calculated:", stats);

    res.json({
      success: true,
      stats: stats,
    });
  } catch (error) {
    console.error("Error fetching order statistics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order statistics",
      error: error.message,
    });
  }
};

// Get single order (admin)
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log("Admin fetching order details for ID:", orderId);

    const reservedPaths = ["stats", "report", "bulk-status"];
    if (reservedPaths.includes(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID: reserved keyword",
      });
    }

    const order = await Order.findOne({
      $or: [{ _id: orderId }, { orderId: orderId }],
    }).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    console.log("Admin order details retrieved successfully");

    res.json({
      success: true,
      order: order,
    });
  } catch (error) {
    console.error("Error fetching admin order details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order details",
      error: error.message,
    });
  }
};

// Update order status (admin)
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    console.log(`Admin updating order ${orderId} status to ${status}`);

    const validStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const order = await Order.findOneAndUpdate(
      {
        $or: [{ _id: orderId }, { orderId: orderId }],
      },
      {
        status: status,
        updatedAt: new Date(),
      },
      { new: true },
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    console.log(`Order ${orderId} status updated to ${status}`);

    try {
      if (
        order.shippingAddress?.email &&
        typeof sendOrderStatusEmail === "function"
      ) {
        await sendOrderStatusEmail(order, status);
        console.log(
          `Status update email sent to customer for order: ${orderId}`,
        );
      }
    } catch (emailError) {
      console.error("Status update email failed:", emailError);
    }

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      order: order,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: error.message,
    });
  }
};

// Bulk update order status
const bulkUpdateOrderStatus = async (req, res) => {
  try {
    const { orderIds, status } = req.body;

    console.log(`Admin bulk updating ${orderIds?.length} orders to ${status}`);

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order IDs array is required",
      });
    }

    const validStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const result = await Order.updateMany(
      {
        $or: [{ _id: { $in: orderIds } }, { orderId: { $in: orderIds } }],
      },
      {
        status: status,
        updatedAt: new Date(),
      },
    );

    console.log(`Bulk updated ${result.modifiedCount} orders to ${status}`);

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} orders to ${status}`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error bulk updating order status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to bulk update orders",
      error: error.message,
    });
  }
};

// Delete order (admin)
const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    console.log(`Admin deleting order: ${orderId}`);

    const reservedPaths = ["stats", "report", "bulk-status"];
    if (reservedPaths.includes(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID: reserved keyword",
      });
    }

    const deletedOrder = await Order.findOneAndDelete({
      $or: [{ _id: orderId }, { orderId: orderId }],
    });

    if (!deletedOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    console.log(`Order ${orderId} deleted successfully`);

    res.json({
      success: true,
      message: "Order deleted successfully",
      deletedOrder: {
        id: deletedOrder._id,
        orderId: deletedOrder.orderId,
      },
    });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete order",
      error: error.message,
    });
  }
};

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ available: true });
    const inactiveProducts = await Product.countDocuments({ available: false });
    const publishedProducts = await Product.countDocuments({
      status: "published",
    });
    const draftProducts = await Product.countDocuments({ status: "draft" });
    const featuredProducts = await Product.countDocuments({ featured: true });
    const lowStockProducts = await Product.countDocuments({
      $expr: { $lte: ["$stock_quantity", "$low_stock_threshold"] },
    });

    const categoryStats = await Product.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const brandStats = await Product.aggregate([
      { $match: { brand: { $ne: "" } } },
      { $group: { _id: "$brand", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const recentProducts = await Product.find({}).sort({ date: -1 }).limit(5);

    res.json({
      success: true,
      stats: {
        totalProducts,
        activeProducts,
        inactiveProducts,
        publishedProducts,
        draftProducts,
        featuredProducts,
        lowStockProducts,
        categoryStats,
        brandStats,
        recentProducts,
      },
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
    });
  }
};

// Get orders report
const getOrdersReport = async (req, res) => {
  try {
    const { startDate, endDate, status = "", format = "json" } = req.query;

    console.log(`Admin generating orders report: ${startDate} to ${endDate}`);

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    const query = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };

    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query).sort({ createdAt: -1 }).lean();

    const summary = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => {
        const orderTotal = order.amount?.total || order.totalAmount || 0;
        return sum + parseFloat(orderTotal);
      }, 0),
      statusBreakdown: {},
    };

    orders.forEach((order) => {
      const status = order.status || "unknown";
      summary.statusBreakdown[status] =
        (summary.statusBreakdown[status] || 0) + 1;
    });

    console.log(`Orders report generated: ${orders.length} orders`);

    res.json({
      success: true,
      report: {
        period: {
          startDate,
          endDate,
        },
        summary,
        orders: format === "summary" ? [] : orders,
      },
    });
  } catch (error) {
    console.error("Error generating orders report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate orders report",
      error: error.message,
    });
  }
};

const deleteAllOrders = async (req, res) => {
  try {
    console.log("🗑️🗑️🗑️ Admin attempting to delete ALL orders");

    // Get count before deletion
    const orderCount = await Order.countDocuments();

    if (orderCount === 0) {
      return res.json({
        success: true,
        message: "No orders to delete",
        deletedCount: 0,
      });
    }

    // Delete all orders
    const result = await Order.deleteMany({});

    console.log(`✅ Deleted ${result.deletedCount} orders from database`);

    res.json({
      success: true,
      message: `Successfully deleted all ${result.deletedCount} orders`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("❌ Error deleting all orders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete all orders",
      error: error.message,
    });
  }
};

const adminRetryFailEmails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    await sendEmailWithTimeout({
      from: process.env.EMAIL_USER,
      to: order.shippingAddress?.email,
      subject: `Order Confirmation - ${orderId}`,
      html: `<h1>Your order ${orderId} has been confirmed!</h1>`,
    });

    res.json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to send email",
      error: error.message,
    });
  }
}

const fixImageUrls = async (req, res) => {
  const baseUrl = process.env.BASE_URL;

  const result = await Product.updateMany(
    { image: { $regex: "localhost:4000" } },
    [{ $set: { image: { $replaceOne: { input: "$image", find: "http://localhost:4000", replacement: baseUrl } } } }]
  );

  res.json({ success: true, updated: result.modifiedCount });
};


module.exports = {
  adminLogin,
  adminLogout,
  adminProfile,
  getAllOrders,
  getOrderStats,
  getOrderById,
  updateOrderStatus,
  bulkUpdateOrderStatus,
  deleteOrder,
  deleteAllOrders,
  getDashboardStats,
  getOrdersReport,
  adminRetryFailEmails,
  fixImageUrls
};
