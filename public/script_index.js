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
  
