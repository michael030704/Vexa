const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// routes/products.js
router.post('/add/:id', auth, async (req, res) => {
  try {
    const { quantity = 1 } = req.body; // Default to 1
    const productId = req.params.id;
    const user = await User.findById(req.userId);

    if (!user.cart) user.cart = [];
    if (user.cart.length >= 30) {
      return res.status(400).json({ error: 'Cart is full (max 30 items).' });
    }

    const existing = user.cart.find(item => 
      item.product && item.product.toString() === productId
    );

    if (existing) {
      existing.quantity += quantity;
    } else {
      user.cart.push({ product: productId, quantity });
    }

    await user.save();
    res.json({ success: true, message: 'Added to cart!' });
  } catch (err) {
    res.status(500).json({ error: 'Error adding to cart' });
  }
});

module.exports = router;