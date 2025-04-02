const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Load dữ liệu
let diemThi = {};
try {
const rawData = fs.readFileSync("./data.json", "utf8");
diemThi = JSON.parse(rawData);
} catch (error) {
console.error("Lỗi khi đọc dữ liệu:", error.message);
}
  const path = require("path");
// Hàm tìm file giấy chứng nhận theo SBD
function findCertificateFile(sbd) {
  const certDir = path.join(__dirname, "public", "certificates");

  try {
    const files = fs.readdirSync(certDir);
    console.log("📁 Tệp có trong certificates/:", files);

    const matchedFile = files.find(file =>
      file.toLowerCase().trim() === `${sbd.toLowerCase().trim()}.pdf`
    );

    console.log("🔍 So sánh với sbd:", `${sbd}.pdf`);
    console.log("✅ Tìm thấy:", matchedFile);

    return matchedFile ? `/certificates/${matchedFile}` : null;
  } catch (err) {
    console.error("❌ Lỗi khi tìm file:", err.message);
    return null;
  }
}
// API tra cứu
app.post('/api/tra-cuu', (req, res) => {
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
  console.log("📄 fileGiayChungNhan:", certificatePath);

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
}); // ✅ <-- thêm dòng này để đóng app.post

// Phục vụ file tĩnh trong thư mục public
app.use(express.static(path.join(__dirname, 'public')));

// Route mặc định trả về index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Khởi động server
app.listen(PORT, () => {
  console.log(`✅ Server đang chạy tại http://localhost:${PORT}`);
});