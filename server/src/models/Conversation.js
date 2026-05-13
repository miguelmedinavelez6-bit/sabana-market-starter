const mongoose = require('mongoose');

const conversationMessageSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  senderRole: { type: String, required: true },
  content: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: false });

const conversationSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  productTitle: { type: String, default: '' },
  productImage: { type: String, default: '' },
  sellerId: { type: String, required: true },
  sellerName: { type: String, default: 'Vendedor' },
  buyerId: { type: String, required: true },
  buyerName: { type: String, default: 'Comprador' },
  messages: { type: [conversationMessageSchema], default: [] },
  lastMessageAt: { type: Date, default: Date.now },
}, { timestamps: true });

conversationSchema.index({ productId: 1, sellerId: 1, buyerId: 1 }, { unique: true });

module.exports = mongoose.model('Conversation', conversationSchema);
