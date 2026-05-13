const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  title: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  sellerId: { type: String, default: '' },
  sellerName: { type: String, default: 'Vendedor' },
  image: { type: String, default: '' },
}, { _id: false });

const cartSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  items: { type: [cartItemSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);
