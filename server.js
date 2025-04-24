require('dotenv').config();
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require("mongoose");
const Registration = require("./models/Registration"); // đường dẫn chính xác tới model
const dayjs = require('dayjs');

const app = express();
// 🛡 Bật trust proxy (bắt buộc khi deploy trên Render, Heroku...)
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ Đã kết nối MongoDB"))
.catch(err => console.error("❌ Lỗi kết nối MongoDB:", err));

// 2. Tạo session store với connect-mongo
const store = MongoStore.create({
  mongoUrl: process.env.MONGODB_URI,
  collectionName: 'sessions',
  ttl: 10 * 60, // Thời gian sống của session (5 phút)
  autoRemove: 'native', // Xoá tự động các session cũ
  autoRemoveInterval: 0.5, // Thời gian kiểm tra xoá session cũ (0.5 phút) 
});

store.on('error', (err) => {
  console.error('❌ Lỗi connect-mongo:', err);
});

app.use(session({
  secret: process.env.SESSION_SECRET || 'default-secret',
  resave: false,
  saveUninitialized: false,
  store: store, 
  // Sử dụng MongoDB để lưu trữ session
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Sử dụng HTTPS trong môi trường production
    httpOnly: true, // Không cho phép JavaScript truy cập cookie
    sameSite: 'strict', // Ngăn chặn CSRF
    orginalMaxAge: 10 * 60 * 1000 // Thời gian sống của cookie (10 phút),
  }
}));

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));


// Middleware kiểm tra đăng nhập
function checkAuth(req, res, next) {
  if (req.session.user) {
    return next();
  }
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
  req.session.destroy((err) => {
    if (err) {
      console.error("Lỗi khi huỷ session:", err);
    }
    res.clearCookie('connect.sid'); // Xoá cookie phiên
    console.log("✅ Đã đăng xuất.");
    res.redirect('/login');
  });
});

// Bảo vệ trang admin
app.get('/admin.html', checkAuth, (req, res) => {
  // Nếu đã đăng nhập, gửi trang admin.html
  console.log("✅ Người dùng đã đăng nhập:", req.session.user);
  res.sendFile(path.join(__dirname, 'private', 'admin.html'));
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

  // Kiểm tra xem mã số sinh viên đã đăng ký chưa
  const existingRegistration = await Registration.findOne({ msv: msv.trim() });

  if (existingRegistration) {
    // Nếu thí sinh đã đăng ký, trả về lỗi
    return res.status(400).send("❌ Bạn đã đăng ký nhận giấy chứng nhận bản cứng trước đó.");
  }

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
    console.error("❌ Lỗi khi tải danh sách:", err);
    res.status(500).json({ error: "Không thể tải danh sách." });
  }
});

app.post('/api/trang-thai-don', async (req, res) => {
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
      taodon: taodon,
      capnhat: capnhat,
 });
  } catch (err) {
    console.error("Lỗi khi tra trạng thái đơn:", err);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
});

app.put("/api/cap-nhat-trang-thai/:id", checkAuth, async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  const valid = ['dang_xu_ly', 'cho_ky', 'da_ky', 'dang_van_chuyen', 'san_sang_nhan', 'da_nhan']; ;
  if (!valid.includes(status)) {
    return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });
  }

  try {
    const updated = await Registration.findByIdAndUpdate(id, { status }, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: "Không tìm thấy đơn đăng ký" });

    res.json({ success: true, message: "✅ Cập nhật thành công", data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
});

// API để lưu thời gian và ngày giao
app.post('/api/cap-nhat-ngay-va-gio', async (req, res) => {
  const { msv, date } = req.body;

  if (!msv || !date) {
    return res.status(400).json({ success: false, message: "Thiếu MSSV hoặc ngày giờ." });
  }

  try {
    const [selectedTime, selectedDate] = date.split(" ");

    // Tìm người dùng theo MSSV
    const registration = await Registration.findOne({ msv: msv.trim() });

    if (!registration) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng." });
    }

    // ✅ Nếu đã có selectedDate và selectedTime => từ chối cập nhật
    if (registration.selectedDate && registration.selectedTime) {
      return res.status(403).json({
        success: false,
        message: "❌ Bạn đã chọn thời gian trước đó. Nếu cần thay đổi, vui lòng liên hệ.",
        selectedDate: registration.selectedDate,
        selectedTime: registration.selectedTime
      });
    }

    // ✅ Cập nhật ngày và giờ
    registration.selectedDate = selectedDate;
    registration.selectedTime = selectedTime;

    await registration.save();

    res.json({ success: true, message: "✅ Thời gian giao đã được lưu thành công." });
  } catch (err) {
    console.error("❌ Lỗi lưu thời gian giao:", err);
    res.status(500).json({ success: false, message: "Có lỗi khi lưu thời gian giao." });
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