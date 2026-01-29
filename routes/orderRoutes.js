const express = require('express');
const router = express.Router();
const Order = require('../models/orderModel');
const { sendOrderConfirmationEmail } = require('../utils/emailService');
const { getUserOrders, cancelOrder, getOrderStats, getOrderById, createOrder } = require('../controllers/orderController');
const { verifyToken } = require('../middleware/authMiddleware');

// Enhanced Order Creation with billing address
router.post("/order/create", createOrder);

//Get all orders for a user with pagination, filtering, and search
router.get('/orders', verifyToken, getUserOrders);

// Get single order details by ID
router.get('/orders/:orderId', verifyToken, getOrderById);

// Cancel an order (if it's still cancellable)
router.post('/orders/:orderId/cancel', verifyToken, cancelOrder);

// Get user's order statistics
router.get('/orders/stats/summary', verifyToken, getOrderStats);



module.exports = router;