const mongoose = require('mongoose');

const orderProductSchema = new mongoose.Schema({
  product: {
    _id: String,
    name: String
  },
  price: Number,
  quantity: Number
});

const orderSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  products: [orderProductSchema],
  shippingAddress: { type: String, required: true },
  paymentMethod: { 
    type: String, 
    enum: ['cod', 'gcash', 'maya', 'bank'], 
    required: true 
  },
  total: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['Processing', 'Packing', 'Delivering', 'Delivered', 'Cancelled'],
    default: 'Processing'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);