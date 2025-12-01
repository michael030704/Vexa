const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
require('../models/Product');

router.get('/', auth, async (req, res) => {
  console.log('🔍 Accessing /cart, User ID:', req.userId);

  try {
    const user = await User.findById(req.userId);
    if (!user) {
      console.log('❌ User not found');
      return res.status(404).send('User not found');
    }

    // ✅ Ensure cart exists (for old users)
    if (!user.cart || !Array.isArray(user.cart)) {
      user.cart = [];
      await user.save();
    }

    // ✅ Only populate if cart has items (prevents schema error on empty cart)
    if (user.cart.length > 0) {
      await user.populate('cart.product');
    }

    res.render('cart', { cart: user.cart });
  } catch (err) {
    console.error('🚨 CART ERROR:', err);
    res.status(500).send('Error loading cart');
  }
});

router.post('/remove/:id', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.userId,
      { $pull: { cart: { product: req.params.id } } }
    );
    res.redirect('/cart');
  } catch (err) {
    console.error('Remove error:', err);
    res.status(500).send('Remove error');
  }
});

router.post('/update/:id', auth, async (req, res) => {
  try {
    const { quantity } = req.body;
    const productId = req.params.id;
    const user = await User.findById(req.userId);

    if (!user.cart) user.cart = [];

    const item = user.cart.find(i => i.product && i.product.toString() === productId);
    if (item) {
      item.quantity = Math.max(1, Math.min(30, parseInt(quantity) || 1));
      await user.save();
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: 'Update failed' });
  }
});

router.post('/add-temp', auth, async (req, res) => {
  try {
    const { _id, quantity = 1 } = req.body;
    const user = await User.findById(req.userId);

    if (!user.cart) user.cart = [];

    // Prevent duplicates
    const existingItem = user.cart.find(item => 
      item.product && item.product.toString() === _id
    );

    if (existingItem) {
      existingItem.quantity = Math.min(30, existingItem.quantity + (quantity || 1));
    } else {
      user.cart.push({ product: _id, quantity: Math.max(1, quantity) });
    }

    await user.save();
    res.json({ success: true });
  } catch (err) {
    console.error('Add to cart error:', err);
    res.status(500).json({ error: 'Failed to add item' });
  }
});
// Add to routes/cart.js
router.post('/remove-ordered', auth, async (req, res) => {
  try {
    const { itemIndexes } = req.body;
    const user = await User.findById(req.userId);
    if (user.cart) {
      user.cart = user.cart.filter((_, i) => !itemIndexes.includes(i));
      await user.save();
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

module.exports = router;