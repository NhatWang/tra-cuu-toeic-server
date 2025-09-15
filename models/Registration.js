const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  fullName: String,
  msv: String,
  lop: String,
  agreed: Boolean,
  status: { type: String, default: 'dang_xu_ly' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  selectedDate: { type: String, default: null }, // Lưu ngày đã chọn
  selectedTime: { type: String, default: null }, // Lưu giờ đã chọn
}, { timestamps: true });

module.exports = mongoose.model('Registration', registrationSchema);