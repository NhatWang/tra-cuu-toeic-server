const express = require("express");
const path = require("path");
const router = express.Router();
const Registration = require("../models/Registration");
const dayjs = require("dayjs");

// Middleware
function checkAuth(req, res, next) {
  if (req.session.user) return next();
  res.redirect("/login");
}

router.get("/admin.html", checkAuth, (req, res) => {
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

module.exports = router;
