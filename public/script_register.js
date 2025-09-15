// ========== LOADING OVERLAY ==========
const tips = [
  "🔄 Chào bạn! Hệ thống đang khởi động...",
  "Đang tải dữ liệu...",
  "Hệ thống đang khởi động...",
  "Chuẩn bị sẵn sàng đăng ký...",
  "Gần xong rồi, cảm ơn bạn đã đợi!"
];

window.addEventListener("load", function () {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) {
    setTimeout(() => {
      overlay.style.display = "none";
    }, 10000); // 10 giây
  }

  const container = document.querySelector(".container");
  const logoContainer = document.querySelector(".logo-container");

  if (container) container.classList.add("fade-in");
  if (logoContainer) logoContainer.classList.add("slide-in");
});

// ========== CHẠY TIP ==========
let index = 0;
const text = document.querySelector(".loading-text");
if (text) {
  text.textContent = tips[0];
  setInterval(() => {
    index = (index + 1) % tips.length;
    text.textContent = tips[index];
  }, 2000);
}

// ========== VALIDATION ==========
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function isValidPhone(phone) {
  return /^(0|\+84)[0-9]{9}$/.test(phone);
}

// ========== TRƯỜNG / KHOA ==========
function handleTruongChange() {
  const truongSelect = document.getElementById("truong");
  const truongKhacInput = document.getElementById("truongKhac");

  if (truongSelect.value === "Khac") {
    truongKhacInput.style.display = "block";
    truongKhacInput.setAttribute("required", "required");
  } else {
    truongKhacInput.style.display = "none";
    truongKhacInput.removeAttribute("required");
    truongKhacInput.value = "";
  }
}

function handleKhoaChange() {
  const khoaSelect = document.getElementById("khoa");
  const khoaKhacInput = document.getElementById("khoakhac");

  if (khoaSelect.value === "Khac") {
    khoaKhacInput.style.display = "block";
    khoaKhacInput.setAttribute("required", "required");
  } else {
    khoaKhacInput.style.display = "none";
    khoaKhacInput.removeAttribute("required");
    khoaKhacInput.value = "";
  }
}

// ========== CHUYỂN FORM → PAYMENT ==========
document.addEventListener("DOMContentLoaded", () => {
  const nextBtn = document.getElementById("nextBtn");
  const formDangKy = document.getElementById("formDangKy");
  const paymentSection = document.getElementById("paymentSection");

if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    if (formDangKy.checkValidity()) {
      // Ẩn nguyên section form
      document.getElementById("registrationSection").style.display = "none";
      // Hiện payment
      document.getElementById("paymentSection").style.display = "block";
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Lưu dữ liệu tạm
      window.tempRegisterData = {
        fullName: document.getElementById("fullName").value,
        msv: document.getElementById("msv").value,
        sdt: document.getElementById("sdt").value,
        email: document.getElementById("email").value,
        truong: document.getElementById("truong").value === "Khac"
          ? document.getElementById("truongKhac").value
          : document.getElementById("truong").value,
        khoa: document.getElementById("khoa").value === "Khac"
          ? document.getElementById("khoakhac").value
          : document.getElementById("khoa").value,
        nganh: document.getElementById("nganh").value,
        namhoc: document.getElementById("namhoc").value,
        cathi: document.getElementById("cathi").value
      };

      // Gửi luôn dữ liệu để tạo QR
      guiDangKy(window.tempRegisterData);
    } else {
      formDangKy.reportValidity();
    }
  });
}

});

// ========== GỬI ĐĂNG KÝ & TẠO QR ==========
let savedData = null;

function guiDangKy(data) {
  const { email, sdt } = data;

  if (!isValidEmail(email)) {
    showToast("Email không hợp lệ", "error");
    return;
  }
  if (!isValidPhone(sdt)) {
    showToast("Số điện thoại không hợp lệ", "error");
    return;
  }

  // Tạo mã thanh toán
  const paymentCode = generatePaymentCode();
  savedData = { ...data, paymentCode, paymentStatus: "pending" };

  updateBankQR(savedData.msv, savedData.fullName, paymentCode);
  startCountdown(600); // 10 phút

  showToast("✅ Đăng ký hợp lệ! Vui lòng thanh toán.", "success");
}

function generatePaymentCode() {
  const prefix = "CHEMO";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return prefix + suffix;
}

function updateBankQR(msv, fullName, paymentCode) {
  const amount = 25000; // số tiền cố định
  const accountNumber = "96247LCHHOAHOC";
  const bankCode = "BIDV";
  const note = `${msv}%20${fullName}%20${paymentCode}`;

  const sepayQRUrl =
    `https://qr.sepay.vn/img?acc=${accountNumber}&bank=${bankCode}&amount=${amount}&des=${note}`;

  const qrImg = document.getElementById("bankQRImg");
  qrImg.src = sepayQRUrl;

  document.getElementById("paymentAmountDisplay").textContent =
    `Số tiền cần thanh toán: ${amount.toLocaleString("vi-VN")}₫`;
}

// ========== COUNTDOWN ==========
let countdownInterval = null;
let qrShakeInterval = null;

function startCountdown(seconds) {
  let remaining = Math.floor(seconds);
  const box = document.getElementById("countdownBox");
  const display = document.getElementById("countdown");
  const qrImg = document.getElementById("bankQRImg");
  const ping = document.getElementById("pingSound");

  box.style.display = "block";

  if (countdownInterval) clearInterval(countdownInterval);
  if (qrShakeInterval) clearInterval(qrShakeInterval);

  countdownInterval = setInterval(() => {
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    display.textContent =
      `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

    if (remaining === 30) {
      qrImg.classList.add("qr-warning");
      qrShakeInterval = setInterval(() => {
        qrImg.classList.add("shake");
        setTimeout(() => qrImg.classList.remove("shake"), 800);
        if (ping) { ping.currentTime = 0; ping.play().catch(() => {}); }
      }, 2000);
    }

    if (remaining <= 0) {
      clearInterval(countdownInterval);
      if (qrShakeInterval) clearInterval(qrShakeInterval);
      qrImg.classList.remove("qr-warning");
      qrImg.classList.remove("shake");
      qrImg.style.opacity = "0.4";
      qrImg.style.pointerEvents = "none";
      showModal("⏰ Đã hết thời gian giữ đơn, vui lòng đăng ký lại!");
      return;
    }
    remaining--;
  }, 1000);
}

// ========== TOAST ==========
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `custom-toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    toast.addEventListener("transitionend", () => toast.remove());
  }, 3000);
}

// ========== MODAL HẾT HẠN ==========
function showModal(message) {
  const modal = document.createElement("div");
  modal.style.cssText = `
    position: fixed; top:0; left:0; width:100%; height:100%;
    background: rgba(0,0,0,0.6); display:flex; justify-content:center; align-items:center; z-index:9999;
  `;
  modal.innerHTML = `
    <div style="background:#fff; padding:30px; border-radius:10px; text-align:center; max-width:90%;">
      <h3>${message}</h3>
      <button id="closeAutoModal" style="margin-top:20px; padding:10px 20px;">Đóng</button>
    </div>`;
  document.body.appendChild(modal);
  document.getElementById("closeAutoModal").addEventListener("click", () => {
    modal.remove();
    window.location.reload();
  });
}

// Kết nối tới server qua Socket.IO
const socket = io();  // nếu backend và frontend chung domain
// Nếu khác domain, ví dụ backend chạy port 3000 thì:
// const socket = io("http://localhost:3000");

socket.on("connect", () => {
  console.log("✅ Đã kết nối Socket.IO tới server");
});

socket.on("disconnect", () => {
  console.log("❌ Mất kết nối Socket.IO");
});

// 📡 Nhận sự kiện thanh toán thành công từ server
socket.on("payment-updated", ({ mssv, status }) => {
  console.log("📡 Nhận sự kiện:", mssv, status);

  // So khớp với MSSV hiện tại (người đang đăng ký)
  const currentMssv = window.tempRegisterData?.msv 
    || savedData?.msv 
    || null;

  if (status === "paid" && mssv === currentMssv) {
    // ✅ Ẩn phần QR
    document.getElementById("countdownBox").style.display = "none";

    // ✅ Thông báo
    showToast("🎉 Thanh toán thành công!", "success");

    // ✅ Hiện modal cảm ơn
    showFinalThankYouModal(window.tempRegisterData?.fullName || "bạn");
  }
});

function showFinalThankYouModal(fullName) {
  const modal = document.createElement("div");
  modal.style.cssText = `
    position: fixed; top:0; left:0; width:100%; height:100%;
    background: rgba(0,0,0,0.6); display:flex; justify-content:center; align-items:center; z-index:9999;
  `;
  modal.innerHTML = `
    <div style="background:white; padding:30px; border-radius:12px; text-align:center; max-width:400px; width:90%;">
      <h2>✅ Cảm ơn ${fullName}!</h2>
      <p>Bạn đã thanh toán thành công. BTC sẽ gửi mail xác nhận trong ít phút.</p>
      <button id="closeThankYouBtn" style="margin-top:20px; padding:10px 20px;">Đóng</button>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById("closeThankYouBtn").addEventListener("click", () => {
    modal.remove();
    window.location.href = "/"; // quay lại trang chủ
  });

  setTimeout(() => {
    modal.remove();
    window.location.href = "/";
  }, 5000);
}