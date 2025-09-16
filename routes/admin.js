const express = require("express");
const path = require("path");
const router = express.Router();
const Registration = require("../models/Registration");
const dayjs = require("dayjs");
const PhucKhao = require("../models/PhucKhao");

// Middleware
function checkAuth(req, res, next) {
  if (req.session.user) return next();
  res.redirect("/login");
}

router.get("/admin", checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "..", "private", "admin.html"));
});

router.get("/api/danh-sach", checkAuth, async (req, res) => {
  const { msv, lop, fullName } = req.query;
  const filter = {};
  if (msv) filter.msv = msv;
  if (lop) filter.lop = lop;
  if (fullName) filter.fullName = { $regex: fullName, $options: 'i' };

  try {
    const list = await Registration.find(filter).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    console.error("❌ Lỗi khi tải danh sách:", err);
    res.status(500).json({ error: "Không thể tải danh sách." });
  }
});

router.delete('/api/xoa-dang-ky/:id', checkAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Registration.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "Không tìm thấy đơn đăng ký." });
    res.json({ success: true, message: "✅ Đã xoá thành công." });
  } catch (err) {
    console.error("❌ Lỗi xoá:", err);
    res.status(500).json({ error: "Không thể xoá." });
  }
});

router.put("/api/cap-nhat-trang-thai/:id", checkAuth, async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  const valid = ['dang_xu_ly', 'cho_ky', 'da_ky', 'dang_van_chuyen', 'san_sang_nhan', 'da_nhan'];
  if (!valid.includes(status)) return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });

  try {
    const updated = await Registration.findByIdAndUpdate(id, { status }, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: "Không tìm thấy đơn đăng ký" });
    res.json({ success: true, message: "✅ Cập nhật thành công", data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
});

router.get("/api/admin/phuc-khao", checkAuth, async (req, res) => {
  try {
    const dsPhucKhao = await PhucKhao.find().sort({ time: -1 });
    return res.json({ success: true, data: dsPhucKhao });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Lỗi server." });
  }
});

router.delete("/api/admin/phuc-khao/:id", checkAuth, async (req, res) => {
  try {
    const deleted = await PhucKhao.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: "Không tìm thấy yêu cầu." });
    res.json({ success: true, message: "✅ Đã xoá yêu cầu phúc khảo." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi server." });
  }
});

router.put("/api/admin/phuc-khao/:id", checkAuth, async (req, res) => {
  const { status, reply } = req.body;
  const { id } = req.params;

  const validStatuses = ["dang_xu_ly", "da_xem", "da_phan_hoi"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ." });
  }

  try {
    const record = await PhucKhao.findById(id);
    if (!record) {
      return res.status(404).json({ success: false, message: "Không tìm thấy yêu cầu phúc khảo." });
    }

    record.status = status;
    if (reply) record.reply = reply;
    await record.save();

    return res.json({
      success: true,
      message: "✅ Đã cập nhật thành công.",
      data: record
    });
  } catch (err) {
    console.error("❌ Lỗi cập nhật phúc khảo:", err);
    return res.status(500).json({ success: false, message: "Lỗi server." });
  }
});


module.exports = router;
