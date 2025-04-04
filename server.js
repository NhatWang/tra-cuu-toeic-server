require('dotenv').config();
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require("mongoose");
const Registration = require("./models/Registration"); // đường dẫn chính xác tới model

const app = express();
const PORT = 3000;

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ Đã kết nối MongoDB"))
.catch(err => console.error("❌ Lỗi kết nối MongoDB:", err));

// 2. Tạo session store với connect-mongo
const store = MongoStore.create({
  mongoUrl: process.env.MONGO_URI,
  collectionName: 'sessions'
});

store.on('error', (err) => {
  console.error('❌ Lỗi connect-mongo:', err);
});

app.set('trust proxy', 1); // 👈 BẮT BUỘC để cookie hoạt động (kể cả localhost)

app.use(session({
  secret: 'secret-key-123',
  resave: false,
  saveUninitialized: false,
  store: store,
  cookie: {
    maxAge: 1000 * 60 * 60 * 2, // 2 giờ
    sameSite: 'lax',
    secure: false
  }
}));

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

mongoose.connect('mongodb://localhost:27017/tra-cuu', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ Kết nối MongoDB thành công"))
.catch(err => console.error("❌ Kết nối MongoDB thất bại:", err));

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

    // 🔁 Đợi session được lưu rồi mới redirect
    req.session.save((err) => {
      if (err) {
        console.error('❌ Lỗi khi lưu session:', err);
        return res.status(500).send("Lỗi khi lưu phiên đăng nhập.");
      }

      console.log("✅ Session sau đăng nhập:", req.session);
      res.redirect('/admin.html');
    });

  } else {
    res.send(`<script>alert("Sai tài khoản hoặc mật khẩu"); location.href="/login";</script>`);
  }
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

// API xoá dòng theo index
app.delete('/api/xoa-dang-ky/:id', checkAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Registration.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: "Không tìm thấy đơn đăng ký." });
    }

    res.json({ success: true, message: "✅ Đã xoá thành công." });
  } catch (err) {
    console.error("❌ Lỗi khi xoá:", err);
    res.status(500).json({ error: "Không thể xoá đơn đăng ký." });
  }
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
app.post('/register-certificate', async (req, res) => {
  const { fullName, msv, lop, agreeCoso } = req.body;

  try {
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

app.get('/api/danh-sach', checkAuth, async (req, res) => {
  const { msv, lop, fullName } = req.query;
  const filter = {};
  if (msv) filter.msv = msv;
  if (lop) filter.lop = lop;
  if (fullName) filter.fullName = { $regex: fullName, $options: 'i' };

  try {
    const list = await Registration.find(filter).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "Không thể tải danh sách." });
  }
});
// ------------------- Trang mặc định -------------------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ------------------- Khởi động Server -------------------
app.listen(PORT, () => {
  console.log(`✅ Server đang chạy tại http://localhost:${PORT}`);
});