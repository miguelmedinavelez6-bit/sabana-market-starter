const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  userId: { type: String, required: true },
  reviewerName: { type: String, default: 'Usuario' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '', trim: true },
  receivedByUserIds: { type: [String], default: [] },
  receivedBySellerNames: { type: [String], default: [] },
  productTitles: { type: [String], default: [] },
}, { timestamps: true });

reviewSchema.index({ orderId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
