const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, default: 10 },
  category: { 
    type: String, 
    enum: ['Electronics', 'Gadgets', 'Foods', 'Fashion', 'Home'],
    required: true
  }
});

module.exports = mongoose.model('Product', productSchema);