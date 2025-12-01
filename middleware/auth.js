// middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  if (!req.session.token) return res.redirect('/login');
  try {
    const decoded = jwt.verify(req.session.token, process.env.JWT_SECRET);
    req.userId = decoded.userId; // 👈 MUST BE HERE
    next();
  } catch (err) {
    res.redirect('/login');
  }
};