const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { type: String, required: true },
  
  // ✅ ADD CART FIELD — THIS FIXES THE ERROR
  cart: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'  // Must match your Product model name
    },
    quantity: { type: Number, default: 1, min: 1, max: 100 }
  }],

  // Optional: other fields
  address: String,
  contactNumber: String,
  birthdate: Date,
  resetToken: String,
  resetTokenExpiry: Date
}, {
  timestamps: true
});

// ✅ Auto-hash password (async, no next())
userSchema.pre('save', async function() {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
});

module.exports = mongoose.model('User', userSchema);