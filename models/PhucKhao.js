const mongoose = require("mongoose");

const PhucKhaoSchema = new mongoose.Schema({
  sbd: { type: String, required: true },
  msv: { type: String, required: true },
  email: { type: String, required: true },
  time: { type: Date, default: Date.now },
  status: { type: String, default: "dang_xu_ly" } // các trạng thái: dang_xu_ly, da_xem, da_phan_hoi
});

module.exports = mongoose.model("PhucKhao", PhucKhaoSchema);