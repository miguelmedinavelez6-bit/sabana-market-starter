const mongoose = require('mongoose');
const { ORDER_STATUS_STEPS } = require('../lib/orderStatus');

const orderItemSchema = new mongoose.Schema({
  productId: String,
  title: String,
  price: Number,
  quantity: Number,
  sellerId: String,
  sellerName: String,
  status: { type: String, enum: ORDER_STATUS_STEPS, default: 'pending' },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  items: [orderItemSchema],
  total: { type: Number, required: true },
  status: { type: String, enum: ORDER_STATUS_STEPS, default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
