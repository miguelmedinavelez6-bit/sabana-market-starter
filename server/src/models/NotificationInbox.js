const mongoose = require('mongoose');

const notificationInboxSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  lastReadAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('NotificationInbox', notificationInboxSchema);
