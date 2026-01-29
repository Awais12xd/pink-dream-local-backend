const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    items: [{
        productId: {
            type: Number,
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Cart", cartSchema);

// Add these endpoints to your existing index.js file after your existing APIs

// Enhanced Wishlist Schema (you already have a basic one, but this is more complete)