const express = require("express");
const router = express.Router();
const Registration = require("../models/Registration");
const dayjs = require("dayjs");

// Đăng ký nhận bản cứng
router.post('/register-certificate', async (req, res) => {
  const { fullName, msv, lop, agreeCoso } = req.body;

  try {
    const existingRegistration = await Registration.findOne({ msv: msv.trim() });
    if (existingRegistration) {
      return res.status(400).send("❌ Bạn đã đăng ký trước đó.");
    }

    await Registration.create({
      fullName,
      msv,
      lop,
      agreed: agreeCoso === 'on'
    });

    res.send("✅ Cảm ơn bạn đã đăng ký!");
  } catch (err) {
    console.error("❌ Lỗi lưu MongoDB:", err);
    res.status(500).send("⚠️ Có lỗi xảy ra khi gửi đăng ký.");
  }
});

// Tra cứu trạng thái đơn
router.post('/api/trang-thai-don', async (req, res) => {
  const { msv } = req.body;
  if (!msv) return res.status(400).json({ success: false, message: "Vui lòng nhập MSSV." });

  try {
    const don = await Registration.findOne({ msv: msv.trim() });
    if (!don) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn đăng ký." });
    }

    const taodon = don.createdAt ? dayjs(don.createdAt).format("HH:mm DD/MM/YYYY") : "Không có dữ liệu";
    const capnhat = don.updatedAt ? dayjs(don.updatedAt).format("HH:mm DD/MM/YYYY") : "Không có dữ liệu";

    res.json({
      success: true,
      status: don.status,
      fullName: don.fullName,
      lop: don.lop,
      taodon,
      capnhat
    });
  } catch (err) {
    console.error("❌ Lỗi khi tra trạng thái đơn:", err);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
});

// Cập nhật ngày và giờ giao
router.post('/api/cap-nhat-ngay-va-gio', async (req, res) => {
  const { msv, date } = req.body;
  if (!msv || !date) {
    return res.status(400).json({ success: false, message: "Thiếu MSSV hoặc ngày giờ." });
  }

  try {
    const [selectedTime, selectedDate] = date.split(" ");
    const registration = await Registration.findOne({ msv: msv.trim() });

    if (!registration) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng." });
    }

    if (registration.selectedDate && registration.selectedTime) {
      return res.status(403).json({
        success: false,
        message: "❌ Bạn đã chọn thời gian trước đó. Nếu cần thay đổi, vui lòng liên hệ.",
        selectedDate: registration.selectedDate,
        selectedTime: registration.selectedTime
      });
    }

    registration.selectedDate = selectedDate;
    registration.selectedTime = selectedTime;
    await registration.save();

    res.json({ success: true, message: "✅ Thời gian giao đã được lưu thành công." });
  } catch (err) {
    console.error("❌ Lỗi lưu thời gian:", err);
    res.status(500).json({ success: false, message: "Có lỗi khi lưu thời gian giao." });
  }
});

module.exports = router;
