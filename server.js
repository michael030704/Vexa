require('dotenv').config();

// Safety checks
if (!process.env.MONGODB_URI) {
  console.error('❌ Missing MONGODB_URI in .env');
  process.exit(1);
}
if (!process.env.SESSION_SECRET) {
  console.error('❌ Missing SESSION_SECRET in .env');
  process.exit(1);
}

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const jwt = require('jsonwebtoken');

const app = express();

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout/main');

// Session (FIXED: uses MONGODB_URI)
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }), // ✅ CORRECT
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24 hours
}));

// User middleware
app.use(async (req, res, next) => {
  if (req.session.token) {
    try {
      const decoded = jwt.verify(req.session.token, process.env.JWT_SECRET);
      const User = require('./models/User');
      const user = await User.findById(decoded.userId).select('name address');
      if (user) res.locals.user = user;
    } catch (err) {
      console.error('Auth middleware error:', err);
    }
  }
  next();
});

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/products', require('./routes/products'));
app.use('/cart', require('./routes/cart'));
app.use('/orders', require('./routes/orders'));

// Profile
app.get('/profile', async (req, res) => {
  if (!req.session.token) return res.redirect('/');
  try {
    const decoded = jwt.verify(req.session.token, process.env.JWT_SECRET);
    const user = await require('./models/User').findById(decoded.userId);
    res.render('profile', { user });
  } catch {
    res.redirect('/');
  }
});

app.post('/profile', async (req, res) => {
  if (!req.session.token) return res.redirect('/');
  try {
    const decoded = jwt.verify(req.session.token, process.env.JWT_SECRET);
    const { name, address, birthdate, contactNumber } = req.body;
    await require('./models/User').findByIdAndUpdate(decoded.userId, {
      name, address, birthdate: birthdate ? new Date(birthdate) : null, contactNumber
    });
    res.redirect('/profile?success=1');
  } catch {
    res.redirect('/profile?error=1');
  }
});

// Home
app.get('/', async (req, res) => {
  const { category } = req.query;
  const Product = require('./models/Product');
  const products = category
    ? await Product.find({ category })
    : await Product.find();
  res.render('home', { products, category: category || null });
});

// Reset Password
app.get('/reset-password/:token', (req, res) => {
  res.render('reset-password', { token: req.params.token, layout: false });
});

// Seed
app.get('/seed', async (req, res) => {
  const Product = require('./models/Product');
  const User = require('./models/User');

  await Product.deleteMany({});
  await User.deleteMany({});

  await User.create([
    { name: 'Alex Rivera', email: 'alex@example.com', password: 'vexa123' },
    { name: 'Taylor Kim', email: 'taylor@example.com', password: 'vexa123' }
  ]);

  const products = [
    { name: 'Quantum Laptop Pro', description: '32GB RAM, 2TB SSD, 4K Display', price: 2199, stock: 5, category: 'Electronics' },
    { name: 'Nexus Smartphone X', description: '200MP Camera, 5000mAh Battery', price: 1099, stock: 12, category: 'Electronics' },
    { name: 'Ultra HD Smart TV', description: '65" 4K OLED, Smart Assistant', price: 1499, stock: 7, category: 'Electronics' },
    { name: 'Wireless Earbuds Pro', description: 'Active Noise Cancellation, 30h Play', price: 179, stock: 25, category: 'Electronics' },
    { name: 'Gaming Console V2', description: '1TB Storage, 4K Gaming', price: 499, stock: 10, category: 'Electronics' },
    { name: 'Digital Camera DSLR', description: '45MP Sensor, 4K Video', price: 1299, stock: 8, category: 'Electronics' },
    { name: 'Smart Watch Series 8', description: 'ECG, GPS, 7-Day Battery', price: 399, stock: 15, category: 'Electronics' },
    { name: 'Wireless Keyboard & Mouse', description: 'Ergonomic, Silent Keys', price: 89, stock: 30, category: 'Electronics' },
    { name: 'Smart Fitness Tracker', description: 'Heart Rate, Sleep, GPS Tracking', price: 129, stock: 25, category: 'Gadgets' },
    { name: 'Portable Power Bank 20K', description: '20,000mAh, Fast Charge, Dual USB', price: 49, stock: 50, category: 'Gadgets' },
    { name: 'Wireless Charging Pad', description: '15W Fast Wireless Charging', price: 35, stock: 40, category: 'Gadgets' },
    { name: 'Mini Bluetooth Speaker', description: '360° Sound, Waterproof', price: 59, stock: 35, category: 'Gadgets' },
    { name: 'Smart LED Light Strip', description: 'RGB, App-Controlled, Music Sync', price: 59, stock: 20, category: 'Gadgets' },
    { name: 'VR Headset Lite', description: 'Immersive 3D Experience', price: 249, stock: 12, category: 'Gadgets' },
    { name: 'Drone with Camera', description: '4K Video, 30min Flight Time', price: 349, stock: 8, category: 'Gadgets' },
    { name: 'Organic Superfood Mix', description: 'Chia, Quinoa, Goji Berries - 500g', price: 24, stock: 30, category: 'Foods' },
    { name: 'Gourmet Coffee Beans', description: 'Single-Origin Ethiopian, 1kg', price: 32, stock: 25, category: 'Foods' },
    { name: 'Dark Chocolate Assortment', description: '70% Cocoa, 12-Piece Box', price: 18, stock: 40, category: 'Foods' },
    { name: 'Organic Honey Jar', description: 'Raw, Unfiltered, 500g', price: 15, stock: 50, category: 'Foods' },
    { name: 'Vegan Protein Powder', description: 'Plant-Based, 1kg', price: 29, stock: 35, category: 'Foods' },
    { name: 'Artisan Pasta Set', description: 'Handmade, 6 Varieties', price: 22, stock: 20, category: 'Foods' },
    { name: 'Urban Tech Jacket', description: 'Water-Resistant, Hidden Pockets', price: 149, stock: 18, category: 'Fashion' },
    { name: 'Minimalist Sneakers', description: 'Eco-Friendly Materials, Cloud Comfort', price: 89, stock: 25, category: 'Fashion' },
    { name: 'Luxury Watch', description: 'Stainless Steel, Sapphire Glass', price: 299, stock: 10, category: 'Fashion' },
    { name: 'Silk Scarf Collection', description: 'Hand-Printed, 3 Designs', price: 45, stock: 30, category: 'Fashion' },
    { name: 'Leather Crossbody Bag', description: 'Genuine Leather, Adjustable Strap', price: 119, stock: 15, category: 'Fashion' },
    { name: 'Bamboo Cutlery Set', description: 'Eco-Friendly, Travel-Ready', price: 22, stock: 40, category: 'Home' },
    { name: 'Aromatherapy Diffuser', description: 'Wood Grain, 7 LED Colors', price: 39, stock: 30, category: 'Home' },
    { name: 'Memory Foam Pillow', description: 'Cervical Support, Hypoallergenic', price: 49, stock: 35, category: 'Home' },
    { name: 'Ceramic Plant Pots (Set of 3)', description: 'Modern Design, Drainage Holes', price: 28, stock: 50, category: 'Home' },
    { name: 'Weighted Blanket', description: '15lbs, Cooling Fabric', price: 69, stock: 20, category: 'Home' },
    { name: 'Smart Doorbell Camera', description: '1080p, Motion Detection, Cloud Storage', price: 129, stock: 15, category: 'Home' }
  ];

  await Product.insertMany(products);
  res.send('✅ Vexa seed data loaded! 32 products across 5 categories.');
});

// Orders
app.get('/orders', async (req, res) => {
  if (!req.session.token) return res.redirect('/auth/login');
  try {
    const decoded = jwt.verify(req.session.token, process.env.JWT_SECRET);
    const { status } = req.query;
    const Order = require('./models/Order');
    const filter = { user: decoded.userId };
    if (status && ['Processing', 'Packing', 'Delivering', 'Delivered', 'Cancelled'].includes(status)) {
      filter.status = status;
    }
    const orders = await Order.find(filter).sort({ createdAt: -1 }).lean();
    res.render('orders', { orders, selectedStatus: status || 'All' });
  } catch (err) {
    console.error('Orders error:', err);
    res.redirect('/?error=1');
  }
});

// 404
app.use((req, res) => {
  res.status(404).send('Page not found');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Vexa running on http://localhost:${PORT}`);
});