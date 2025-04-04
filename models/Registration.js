const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  fullName: String,
  msv: String,
  lop: String,
  agreed: Boolean
}, { timestamps: true }); // ✅ Thêm dòng này

module.exports = mongoose.model('Registration', registrationSchema);