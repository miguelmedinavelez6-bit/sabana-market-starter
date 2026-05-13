const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporterId: { type: String, required: true },
  reporterName: { type: String, default: 'Usuario' },
  targetType: { type: String, enum: ['product', 'user'], required: true },
  targetId: { type: String, required: true },
  targetLabel: { type: String, default: '' },
  targetOwnerId: { type: String, default: '' },
  targetOwnerName: { type: String, default: '' },
  reason: { type: String, required: true, trim: true },
  details: { type: String, default: '', trim: true },
  status: { type: String, enum: ['pending', 'resolved', 'dismissed'], default: 'pending' },
  adminNote: { type: String, default: '', trim: true },
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
