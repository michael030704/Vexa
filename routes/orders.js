const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');
const User = require('../models/User');

// Auth middleware
const authUser = async (req, res, next) => {
  try {
    if (!req.session.token) {
      return res.status(401).json({ success: false, message: 'Not logged in' });
    }
    const decoded = jwt.verify(req.session.token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid session' });
  }
};

// 🔥 AUTO-UPDATE ORDER STATUS HELPER
async function scheduleOrderStatusUpdates(orderId) {
  const stages = ['Packing', 'Delivering', 'Delivered'];
  stages.forEach((status, index) => {
    setTimeout(async () => {
      try {
        // Only update if not cancelled
        const order = await Order.findById(orderId);
        if (order && order.status !== 'Cancelled') {
          await Order.findByIdAndUpdate(orderId, { status });
          console.log(`✅ Order ${orderId} updated to: ${status}`);
        }
      } catch (err) {
        console.error(`Failed to auto-update order ${orderId}:`, err);
      }
    }, (index + 1) * 60 * 1000); // 1min, 2min, 3min
  });
}

// POST /orders/create → from homepage "Order Now"
router.post('/create', authUser, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, total } = req.body;

    if (!shippingAddress || !paymentMethod || !total || !items?.length) {
      return res.status(400).json({ success: false, message: 'Missing order details' });
    }

    const newOrder = new Order({
      user: req.userId,
      products: items.map(item => ({
        product: {
          _id: item._id,
          name: item.name
        },
        price: item.price,
        quantity: item.quantity
      })),
      shippingAddress,
      paymentMethod,
      total,
      status: 'Processing'
    });

    await newOrder.save();

    // ✅ START AUTO-STATUS UPDATES
    scheduleOrderStatusUpdates(newOrder._id);

    res.status(201).json({
      success: true,
      orderId: newOrder._id,
      message: 'Order placed successfully!'
    });

  } catch (err) {
    console.error('Order error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /orders/create-from-cart → from cart page
router.post('/create-from-cart', authUser, async (req, res) => {
  try {
    const { shippingAddress, paymentMethod } = req.body;
    if (!shippingAddress || !paymentMethod) {
      return res.status(400).json({ success: false, message: 'Missing address or payment method' });
    }

    const cart = req.session.cart;
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    const total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const newOrder = new Order({
      user: req.userId,
      products: cart.items.map(item => ({
        product: {
          _id: item.productId,
          name: item.name
        },
        price: item.price,
        quantity: item.quantity
      })),
      shippingAddress,
      paymentMethod,
      total,
      status: 'Processing'
    });

    await newOrder.save();

    // ✅ START AUTO-STATUS UPDATES
    scheduleOrderStatusUpdates(newOrder._id);

    // Clear cart
    req.session.cart = { items: [], total: 0 };

    res.status(201).json({
      success: true,
      orderId: newOrder._id,
      message: 'Order placed successfully!'
    });

  } catch (err) {
    console.error('Cart order error:', err);
    res.status(500).json({ success: false, message: 'Failed to place order' });
  }
});

// Cancel order
router.post('/cancel/:id', authUser, async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findOne({ _id: orderId, user: req.userId });
    if (!order) return res.status(404).send('Order not found');
    if (order.status === 'Delivered' || order.status === 'Cancelled') {
      return res.status(400).send('Cannot cancel this order');
    }
    order.status = 'Cancelled';
    await order.save();
    res.redirect('/orders?cancelled=1');
  } catch (err) {
    console.error(err);
    res.redirect('/orders?error=1');
  }
});

module.exports = router;