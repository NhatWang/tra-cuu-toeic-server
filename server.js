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

// API tra cứu
app.post("/api/tra-cuu", (req, res) => {
  const { sbd, msv } = req.body;

  if (!sbd || !msv) {
    return res.status(400).json({ success: false, message: "Thiếu SBD hoặc MSSV." });
  }

  const thongTin = diemThi[sbd];
  if (!thongTin) {
    return res.status(404).json({ success: false, message: "Không tìm thấy số báo danh." });
  }

  if (thongTin.msv !== msv) {
    return res.status(403).json({ success: false, message: "MSSV không khớp." });
  }

  return res.json({ success: true, data: thongTin });
});

// Khởi động server
app.listen(PORT, () => {
  console.log(`✅ Server đang chạy tại http://localhost:${PORT}`);
});