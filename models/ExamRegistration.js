// models/ExamRegistration.js
const mongoose = require("mongoose");

// TTL: tự xoá document sau 10 phút nếu chưa thanh toán
const examRegistrationSchema = new mongoose.Schema({
  // Thông tin người đăng ký
  fullName: { type: String, required: true },
  msv:      { type: String, required: true },
  sdt:      { type: String, required: true },
  email:    { type: String, required: true },

  truong:   { type: String, required: true }, // đã xử lý "Khác" từ client
  khoa:     { type: String, required: true }, // đã xử lý "Khác" từ client
  nganh:    { type: String, required: true },
  namhoc:   { type: String, required: true }, // "1" | "2" | "3" | "4"
  cathi:    { type: String, required: true }, // "Ca 1" | "Ca 2"
  sbd:      { type: String, unique: true, sparse: true },

  // Thanh toán
  amount:        { type: Number, default: 50000 }, // tuỳ chỉnh
  paymentCode:   { type: String, unique: true, required: true }, // CHEMOxxxx
  paymentStatus: { type: String, enum: ["pending","paid","failed"], default: "pending" },

  // TTL xoá đơn nếu chưa thanh toán
  expireAt: { type: Date, index: { expires: "10m" } }, // xoá sau 10 phút

}, { timestamps: true });

module.exports = mongoose.model("ExamRegistration", examRegistrationSchema);