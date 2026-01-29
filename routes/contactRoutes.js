const express = require("express");
const router = express.Router();
const Contact = require("../models/contactModel");
const {
  testEmail,
  submitContactForm,
  getAllContactSubmission,
  getSubmissionById,
  updateContactSubmission,
  getContactStats,
  deleteContact,
} = require("../controllers/contactController");

// Replace your existing /test/email endpoint with this enhanced version
router.post("/test/email", testEmail);

// Middleware to get client IP
const getClientIP = (req) => {
  return (
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null)
  );
};

// API endpoint to handle contact form submissions
router.post("/contact/submit", submitContactForm);

// API to get all contact submissions (for admin panel)
router.get("/contact/submissions", getAllContactSubmission);

// API to get contact submission by ID
router.get("/contact/submission/:id", getSubmissionById);

// API to update contact submission status
router.patch("/contact/submission/:id/status", updateContactSubmission);

// API to get contact statistics
router.get("/contact/stats", getContactStats);

// API to delete contact submission
router.delete("/contact/submission/:id", deleteContact);

// Add these endpoints to your backend index.js file

// Newsletter Schema

module.exports = router;
