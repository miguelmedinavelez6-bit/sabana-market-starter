const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  senderRole: { type: String, required: true },
  text: { type: String, required: true },
  ts: { type: Number, required: true },
}, { _id: false });

const messageThreadSchema = new mongoose.Schema({
  productId: { type: String, required: true, unique: true },
  productTitle: { type: String, default: '' },
  sellerName: { type: String, default: '' },
  messages: { type: [messageSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('MessageThread', messageThreadSchema);
