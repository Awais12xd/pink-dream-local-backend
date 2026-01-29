const express = require("express");
const router = express.Router();
const PromoCode = require("../models/promoCodeModel");
const {
  createPromoCode,
  getAllPromoCodes,
  updatePromoCode,
  deletePromoCode,
  togglePromoCodeStatus,
  validatePromoCode,
  applyPromoCode,
  getPromoCodeStats,
  getActivePromoCodes,
  getPromoCode,
} = require("../controllers/promocodeController");

router.post("/promo-codes/create", createPromoCode);

// 2. GET ALL PROMO CODES (Admin)
router.get("/promo-codes/all", getAllPromoCodes);

// 4. UPDATE PROMO CODE
router.put("/promo-codes/update/:id", updatePromoCode);

// 5. DELETE PROMO CODE
router.delete("/promo-codes/delete/:id", deletePromoCode);

// 6. TOGGLE PROMO CODE STATUS
router.patch("/promo-codes/toggle-status/:id", togglePromoCodeStatus);

// 7. VALIDATE & APPLY PROMO CODE (For Customers)
router.post("/promo-codes/validate", validatePromoCode);

// 8. APPLY PROMO CODE TO ORDER (Called after order is placed)
router.post("/promo-codes/apply/:code", applyPromoCode);

// 9. GET PROMO CODE STATISTICS (Admin Dashboard)
router.get("/promo-codes/stats", getPromoCodeStats);

// 10. GET ACTIVE PROMO CODES (Public - for display on website)
router.get("/promo-codes/active", getActivePromoCodes);
// 3. GET SINGLE PROMO CODE
router.get("/promo-codes/:id", getPromoCode);

// console.log(' Promo Code System API loaded successfully');
// console.log('   POST   /api/promo-codes/create - Create promo code');
// console.log('   GET    /api/promo-codes/all - Get all promo codes');
// console.log('   GET    /api/promo-codes/:id - Get single promo code');
// console.log('   PUT    /api/promo-codes/update/:id - Update promo code');
// console.log('   DELETE /api/promo-codes/delete/:id - Delete promo code');
// console.log('   PATCH  /api/promo-codes/toggle-status/:id - Toggle active/inactive');
// console.log('   POST   /api/promo-codes/validate - Validate & calculate discount');
// console.log('   POST   /api/promo-codes/apply/:code - Apply to order');
// console.log('   GET    /api/promo-codes/stats - Get statistics');
// console.log('   GET    /api/promo-codes/active - Get active codes (public)');

module.exports = router;
