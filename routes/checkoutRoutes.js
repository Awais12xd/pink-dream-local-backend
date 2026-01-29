const express = require('express');
const router = express.Router();
const { stripe, paypalClient } = require('../config/payment');
const Order = require('../models/orderModel');
const { sendOrderConfirmationEmail } = require('../utils/emailService');
const { createPaymentIntent, confirmPayment, createPayPalOrder, capturePayPalOrder, testPayPal } = require('../controllers/paymentController');

router.post('/payment/create-payment-intent',createPaymentIntent);

// Update your payment confirmation to use non-blocking email
router.post('/payment/confirm', confirmPayment);

// CREATE PAYPAL ORDER - This runs when user clicks PayPal button
router.post('/payment/paypal/create-order', createPayPalOrder);

// CAPTURE PAYPAL PAYMENT - This runs when PayPal payment is approved
router.post('/payment/paypal/capture-order', capturePayPalOrder);

// Test endpoint to verify PayPal connection
router.get('/payment/paypal/test', testPayPal);

// New endpoint to update order status and send email

module.exports = router;