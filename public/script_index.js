let traCuuKetQua = null;

// Hàm chính để tra cứu điểm
function traCuuDiem() {
  const sbd = document.getElementById("sbd").value.trim();
  const msv = document.getElementById("msv").value.trim();

  if (!sbd || !msv) {
    openModal(`<p class="fail">⚠️ Vui lòng nhập đủ SBD và MSSV</p>`);
    return;
  }

  fetch("http://localhost:3000/api/tra-cuu", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sbd, msv }),
  })
    .then((res) => res.json())
    .then((data) => {
      console.log("✅ Dữ liệu API:", data)
      if (data.success) {
        const { ten,
                diem,
                msv, 
                sbd, 
                xepHang, 
                tongSoNguoi,
                fileGiayChungNhan
               } = data.data;

        let thongBao = "";
        let diemHienThi = "Vắng";
        let hangXep = "";

        // ✅ Chỉ xử lý nếu có điểm
        if (typeof diem === "number" && !isNaN(diem)) {
          diemHienThi = diem;
          if (diem >= 450) {
            thongBao = `<p class="success">✅ Đủ điều kiện được cấp giấy chứng nhận</p>`;
          
            // ✅ Thêm nút nếu có file nhận về từ API
            if (fileGiayChungNhan) {
              thongBao += `
                <div class="btn-cert-wrapper">
                  <a href="${fileGiayChungNhan}" target="_blank" class="btn-cert">
                    🎓 Xem Giấy Chứng Nhận
                  </a>
                  <button onclick="openRegisterModal()" class="btn-cert" style="background-color: #ffc107; margin-left: 12px;">
                    ✉️ Nhận bản cứng
                  </button>
                </div>
              `;
            } else {
              // Để debug nếu không thấy file:
              console.warn("⚠️ Không tìm thấy fileGiayChungNhan cho SBD:", sbd);
            }
          
            // Confetti 🎉
            confetti({
              particleCount: 100,
              spread: 150,
              origin: { y: 0.6 }
            });
          } else {
            thongBao = `<p class="fail">📘 Bạn hãy cố gắng ôn tập nhé!</p>`;
          }

          // ✅ Chỉ hiển thị xếp hạng nếu có điểm
          hangXep = `<p><strong>Xếp hạng:</strong> ${xepHang} / ${tongSoNguoi}</p>`;
        }

        // ✅ Hiển thị kết quả trong modal
        openModal(`
          <p><strong>Họ và tên:</strong> ${ten}</p>
          <p><strong>Mã số sinh viên:</strong> ${msv}</p>
          <p><strong>Số báo danh:</strong> ${sbd}</p>
          <p><strong>Điểm:</strong> ${diemHienThi}</p> 
          ${hangXep}
          ${thongBao}
        `);

        traCuuKetQua = { ten, msv }; // ✅ Lưu thông tin để so sánh khi đăng ký

      } else {
        openModal(`<p class="fail">${data.message}</p>`);
      }
    })
    .catch((err) => {
      console.error("Lỗi khi gọi API:", err);
      openModal(`<p class="fail">Đã xảy ra lỗi khi tra cứu.</p>`);
    });
}

// Hàm mở modal
function openModal(noiDungHTML) {
  const modal = document.getElementById("modalKetQua");
  const modalBody = document.getElementById("modalBody");
  modalBody.innerHTML = noiDungHTML;
  modal.style.display = "block";
}

// Hàm đóng modal
function closeModal() {
  document.getElementById("modalKetQua").style.display = "none";
}

// Đóng modal khi click ra ngoài
window.onclick = function (event) {
  const modal = document.getElementById("modalKetQua");
  if (event.target === modal) {
    modal.style.display = "none";
  }
};
  // 2. Thay đổi dòng chữ loading mỗi 2 giây
  const tips = [
    "🔄 Đang tải dữ liệu...",
    "📘 Hệ thống đang khởi động...",
    "🎯 Chuẩn bị sẵn sàng tra cứu điểm...",
    "🚀 Gần xong rồi, cảm ơn bạn đã đợi!"
  ];

document.addEventListener("DOMContentLoaded", function () {
  // 1. Xử lý nhấn Enter
  const sbdInput = document.getElementById("sbd");
  const msvInput = document.getElementById("msv");

  [sbdInput, msvInput].forEach((input) => {
    input.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        traCuuDiem();
      }
    });
  });
  let index = 0;
  const text = document.querySelector(".loading-text");
  if (text) {
    text.textContent = tips[0];
    setInterval(() => {
      index = (index + 1) % tips.length;
      text.textContent = tips[index];
    }, 2000);
  }
});
// ======================= KHI TẢI XONG TRANG =========================
window.addEventListener("load", function () {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) {
    overlay.style.opacity = "0";
    setTimeout(() => {
      overlay.style.display = "none";
    }, 600);
  }

  const container = document.querySelector(".container");
  const logoContainer = document.querySelector(".logo-container");

  if (container) container.classList.add("fade-in");
  if (logoContainer) logoContainer.classList.add("slide-in");
});

// Mở modal đăng ký
function openRegisterModal() {
  const modal = document.getElementById("modalRegister");
  if (modal) {
    modal.style.display = "block";
  }
}
// Đóng modal đăng ký
function closeRegisterModal() {
  const modal = document.getElementById("modalRegister");
  if (modal) {
    modal.style.display = "none";
  }
}
// Đóng nếu bấm ngoài
window.addEventListener("click", function (e) {
  const modal = document.getElementById("modalRegister");
  if (e.target === modal) {
    modal.style.display = "none";
  }
});
// ======= FORM ĐĂNG KÝ NHẬN BẢN CỨNG =======
// Lắng nghe khi DOM đã tải xong
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("registerForm");
  const messageDiv = document.getElementById("registerMessage");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault(); // ✅ Ngăn form hành xử mặc định

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

// ✅ So sánh thông tin với kết quả tra cứu
if (!traCuuKetQua) {
showToast("⚠️ Vui lòng tra cứu điểm trước khi đăng ký!", "error");
return;
}

function normalize(str) {
  return (str || "")
    .normalize("NFC") // Hoặc "NFD"
    .replace(/\s+/g, " ") // bỏ khoảng trắng dư
    .trim()
    .toLowerCase();
}

const tenForm = normalize(data.fullName);
const msvForm = normalize(data.msv);
const tenTraCuu = normalize(traCuuKetQua.ten);
const msvTraCuu = normalize(traCuuKetQua.msv);

if (tenForm !== tenTraCuu || msvForm !== msvTraCuu) {
  showToast("❌ Họ tên hoặc MSSV không khớp với kết quả tra cứu!", "error");
  return;
}

// Tiếp tục gửi nếu đúng
const btn = form.querySelector('button[type="submit"]');
btn.disabled = true;
btn.textContent = "Đang gửi...";

fetch("/register-certificate", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify(data)
})
.then(res => res.text())
.then(message => {
showToast(message);
btn.disabled = false;
btn.textContent = "Gửi đăng ký";

setTimeout(() => {
messageDiv.innerHTML = "";
closeRegisterModal();
}, 1500);
})
.catch(err => {
console.error("❌ Lỗi gửi form:", err);
showToast("❌ Gửi thất bại. Vui lòng thử lại!", "error");
btn.disabled = false;
btn.textContent = "Gửi đăng ký";
});
});
})

function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");

  const toast = document.createElement("div");
  toast.className = `toast ${type === "error" ? "error" : ""}`;
  toast.textContent = message;

  container.appendChild(toast);

   // Sau 1.5s, thêm class .exit để trượt ra phải
  setTimeout(() => {
    toast.classList.add("exit");
  }, 1500);

  // Sau 1s, xoá khỏi DOM
  setTimeout(() => {
    toast.remove();
  }, 1000);
}