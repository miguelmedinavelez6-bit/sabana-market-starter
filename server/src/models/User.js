const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  institutionalEmail: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  career: { type: String, default: 'Comunidad Unisabana' },
  photoUrl: { type: String, default: '' },
  reputation: { type: Number, default: 5.0 },
  isVerified: { type: Boolean, default: true },
  isSuspended: { type: Boolean, default: false },
  suspensionReason: { type: String, default: '' },
  microsoftId: { type: String, default: '' },
  authProvider: { type: String, enum: ['password', 'microsoft'], default: 'password' },
  role: { type: String, enum: ['buyer', 'seller', 'admin'], default: 'buyer' },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
