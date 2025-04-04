const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  fullName: String,
  msv: String,
  lop: String,
  agreed: Boolean,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Registration', registrationSchema);