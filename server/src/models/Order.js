const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: String,
  title: String,
  price: Number,
  quantity: Number,
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  items: [orderItemSchema],
  total: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'delivered'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
