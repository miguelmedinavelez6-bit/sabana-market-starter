const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  status: { type: String, enum: ['new', 'used', 'digital'], required: true },
  statusLabel: { type: String, required: true },
  images: [String],
  sellerId: { type: String, default: '' },
  sellerName: { type: String, required: true },
  sellerReputation: { type: Number, default: 5.0 },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
