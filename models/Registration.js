const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  fullName: String,
  msv: String,
  lop: String,
  agreed: Boolean,
  status: { type: String, default: 'dang_xu_ly' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Registration', registrationSchema);