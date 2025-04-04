const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const session = require('express-session');
const MongoStore = require('connect-mongo');

const app = express();
const PORT = 3000;

app.use(session({
  secret: 'secret-key-123',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: 'mongodb://localhost:27017/tra-cuu', // 🔁 hoặc MongoDB Atlas URI
    collectionName: 'sessions'
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 2 // 2 giờ
  }
}));

const ADMIN_USERNAME = 'lchhh';      // 🔑 Tên đăng nhập
const ADMIN_PASSWORD = 'lienchihoihoahoc';     // 🔒 Mật khẩu đăng nhập

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));


// Middleware kiểm tra đăng nhập
function checkAuth(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/login');
}

// Trang đăng nhập (GET)
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Đăng nhập (POST)
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.user = username;
    return res.redirect('/admin.html');
  }
  return res.send(`<script>alert("Sai tài khoản hoặc mật khẩu"); location.href="/login";</script>`);
});

// Đăng xuất
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// Bảo vệ trang admin
app.get('/admin.html', checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// API lấy danh sách
app.get('/api/danh-sach', checkAuth, (req, res) => {
  const filePath = path.join(__dirname, "register-certificate.csv");
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Không thể đọc file" });

    const rows = data.trim().split("\n").slice(1);
    const parsed = rows.map(row => row.replace(/"/g, "").split(","));
    res.json(parsed);
  });
});

// API xoá dòng theo index
app.delete('/api/xoa-dang-ky', (req, res) => {
  const { index } = req.body;
  const filePath = path.join(__dirname, "register-certificate.csv");

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Không thể đọc file." });

    const lines = data.trim().split("\n");
    const header = lines[0];
    const rows = lines.slice(1);

    if (index < 0 || index >= rows.length) {
      return res.status(400).json({ error: "Index không hợp lệ." });
    }

    rows.splice(index, 1); // ❌ Xoá đúng 1 dòng theo index
    const newData = [header, ...rows].join("\n") + "\n";
    fs.writeFile(filePath, newData, (err) => {
      if (err) return res.status(500).json({ error: "Không thể ghi file." });
      res.json({ success: true });
    });
  });
});

// API tra cứu điểm
let diemThi = {};
try {
  const rawData = fs.readFileSync("./data.json", "utf8");
  diemThi = JSON.parse(rawData);
} catch (error) {
  console.error("Lỗi khi đọc dữ liệu:", error.message);
}

function findCertificateFile(sbd) {
  const certDir = path.join(__dirname, "public", "certificates");
  try {
    const files = fs.readdirSync(certDir);
    const matchedFile = files.find(file =>
      file.toLowerCase().trim() === `${sbd.toLowerCase().trim()}.pdf`
    );
    return matchedFile ? `/certificates/${matchedFile}` : null;
  } catch (err) {
    console.error("❌ Lỗi khi tìm file:", err.message);
    return null;
  }
}

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

// Đăng ký nhận bản cứng
app.post('/register-certificate', (req, res) => {
  const { fullName, msv, lop, agreeCoso } = req.body;
  const agreed = agreeCoso === 'on';

  const row = `"${fullName}","${msv}","${lop}","${agreed ? 'Cơ sở Nguyễn Văn Cừ' : ''}","${new Date().toISOString()}"\n`;
  const filePath = path.join(__dirname, 'register-certificate.csv');
  const header = `"Họ và tên","MSSV","Lớp","Cơ sở nhận","Thời gian đăng ký"\n`;
  const fullData = (!fs.existsSync(filePath) ? header : '') + row;
  fs.appendFile(filePath, fullData, (err) => {
    if (err) {
      console.error("❌ Không thể lưu đăng ký:", err);
      return res.status(500).send("⚠️ Có lỗi xảy ra khi gửi đăng ký.");
    }
    res.send("✅ Cảm ơn bạn đã đăng ký!");
  });
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // ✅ để xử lý POST form
app.use(express.static(path.join(__dirname, 'public')));

app.get("/api/danh-sach", (req, res) => {
  const filePath = path.join(__dirname, "register-certificate.csv");
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Không thể đọc file" });

    const rows = data.trim().split("\n").slice(1); // bỏ dòng tiêu đề
    const parsed = rows.map(row => row.replace(/"/g, "").split(","));
    res.json(parsed);
  });
});
app.get("/xem-dang-ky", (req, res) => {
  const filePath = path.join(__dirname, "register-certificate.csv");
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) return res.status(500).send("Không thể đọc file.");

    const rows = data.trim().split("\n").map(row => row.replace(/"/g, '').split(","));

    let html = `
      <h2>Danh sách đã đăng ký nhận bản cứng</h2>
      <table border="1" cellpadding="8" style="border-collapse: collapse;">
        <tr>
          <th>Họ và tên</th>
          <th>MSSV</th>
          <th>Lớp</th>
          <th>CS nhận</th>
          <th>Thời gian đăng ký</th>
        </tr>
    `;

    for (const row of rows) {
      html += `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
    }

    html += "</table>";
    res.send(html);
  });
});

// ------------------- Trang mặc định -------------------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ------------------- Khởi động Server -------------------
app.listen(PORT, () => {
  console.log(`✅ Server đang chạy tại http://localhost:${PORT}`);
});