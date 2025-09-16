const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const PhucKhao = require("../models/PhucKhao");

// Load data.json (chứa điểm thi)
let diemThi = {};
try {
  const rawData = fs.readFileSync("./data.json", "utf8");
  diemThi = JSON.parse(rawData);
} catch (error) {
  console.error("❌ Lỗi khi đọc data.json:", error.message);
}

// Hàm tìm file chứng nhận PDF
function findCertificateFile(sbd) {
  const certDir = path.join(__dirname, "..", "public", "certificates");
  try {
    const files = fs.readdirSync(certDir);
    const matchedFile = files.find(file =>
      file.toLowerCase().trim() === `${sbd.toLowerCase().trim()}.pdf`
    );
    return matchedFile ? `/certificates/${matchedFile}` : null;
  } catch (err) {
    console.error("❌ Lỗi tìm file chứng nhận:", err.message);
    return null;
  }
}

// API tra cứu điểm
router.post('/api/tra-cuu', (req, res) => {
  const { sbd, msv } = req.body;

  if (!sbd || !msv) {
    return res.status(400).json({ success: false, message: "Thiếu SBD hoặc MSSV." });
  }

  const thongTin = diemThi[sbd];
  if (!thongTin) {
    return res.status(404).json({ success: false, message: "Không tìm thấy số báo danh." });
  }

  if (thongTin.msv !== msv) {
    return res.status(403).json({ success: false, message: "⚠️ MSSV không khớp." });
  }

  const tatCaDiem = Object.entries(diemThi)
    .filter(([_, item]) => typeof item.diem === 'number')
    .sort(([, a], [, b]) => b.diem - a.diem);

  const xepHang = tatCaDiem.findIndex(([key]) => key === sbd) + 1;
  const tongSoNguoi = tatCaDiem.length;
  const certificatePath = thongTin.diem >= 450 ? findCertificateFile(sbd) : null;

  return res.json({
    success: true,
    data: {
      ten: thongTin.ten,
      msv: thongTin.msv,
      sbd: sbd,
      diem: thongTin.diem,
      xepHang: xepHang,
      tongSoNguoi: tongSoNguoi,
      fileGiayChungNhan: certificatePath
    }
  });
});

router.post("/api/phuc-khao", async (req, res) => {
  const { sbd, msv, email } = req.body;

  if (!sbd || !msv || !email) {
    return res.status(400).json({ success: false, message: "Thiếu SBD, MSSV hoặc Email." });
  }

  try {
    // Kiểm tra có tồn tại trong data.json không
    const thongTin = diemThi[sbd];
    if (!thongTin || thongTin.msv !== msv) {
      return res.status(400).json({ success: false, message: "Thông tin không hợp lệ." });
    }

    // Kiểm tra trùng lặp
    const existed = await PhucKhao.findOne({ sbd, msv });
    if (existed) {
      return res.json({ success: false, message: "❌ Bạn đã gửi yêu cầu phúc khảo trước đó." });
    }

    // ✅ Tạo mới kèm email
    const newRequest = new PhucKhao({ sbd, msv, email, time: new Date(), status: "dang_xu_ly" });
    await newRequest.save();

    console.log(`📩 [PHÚC KHẢO] MSSV: ${msv}, SBD: ${sbd}, Email: ${email}`);
    return res.json({
      success: true,
      data: { sbd, msv, email },
      message: "✅ Đã nhận yêu cầu phúc khảo."
    });
  } catch (error) {
    console.error("❌ Lỗi lưu phúc khảo:", error);
    return res.status(500).json({ success: false, message: "Lỗi server." });
  }
});

module.exports = router;

