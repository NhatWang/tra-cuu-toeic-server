dayjs.extend(dayjs_plugin_relativeTime);
    let rawData = [];
    
    function fetchAndRenderData() {
      fetch("/api/danh-sach")
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          if (!Array.isArray(data)) {
            throw new Error("Invalid data format: Expected an array");
          }
          rawData = data;
          renderTable(rawData);
          updateFilters(rawData);
        })
        .catch(err => {
          console.error("Error fetching data:", err);
          document.getElementById("adminTable").innerHTML = "<p>Không thể tải dữ liệu.</p>";
          document.getElementById("summary").textContent = "Lỗi khi tải dữ liệu.";
        });
    }
    function updateFilters(data) {
      const lopSet = new Set(data.map(r => r.lop));
      const lopSelect = document.getElementById("filterLop");
      lopSelect.innerHTML = '<option value="">-- Lọc theo lớp --</option>';
      [...lopSet].sort().forEach(lop => {
        const opt = document.createElement("option");
        opt.value = lop;
        opt.textContent = lop;
        lopSelect.appendChild(opt);
      });
    }
    function renderTable(data) {
      if (!Array.isArray(data) || data.length === 0) {
        adminTable.innerHTML = "<p>Không có dữ liệu.</p>";
        summary.textContent = "Tổng: 0";
        return;
      }

      // Thống kê
      const count = data.reduce((acc, d) => {
        acc[d.status] = (acc[d.status] || 0) + 1;
        return acc;
      }, {});

      summary.innerHTML = `
        Tổng: ${data.length} | 
        ⏳ ${count.dang_xu_ly || 0} - 
        🖋 ${count.cho_ky || 0} - 
        ✅ ${count.da_ky || 0} - 
        🚚 ${count.dang_van_chuyen || 0} - 
        📦 ${count.san_sang_giao || 0} - 
        📬 ${count.da_giao || 0}`;

      let html = `
        <table><thead>
          <tr><th>STT</th><th>Họ tên</th><th>MSSV</th><th>Lớp</th><th>CS</th><th>Thời gian tạo</th><th>Thời gian cập nhật</th><th>Trạng thái</th><th>Xoá</th></tr>
        </thead><tbody>`;

      data.forEach((r, i) => {
        html += `
          <tr>
            <td>${i + 1}</td>
            <td>${r.fullName}</td>
            <td>${r.msv}</td>
            <td>${r.lop}</td>
            <td>${r.agreed ? "NVC" : ""}</td>
            <td title="${dayjs(r.createdAt).format("HH:mm DD/MM/YYYY")}">
              ${dayjs(r.createdAt).fromNow()}
            </td>
            <td title="${dayjs(r.updatedAt).format("HH:mm DD/MM/YYYY")}">
              ${dayjs(r.updatedAt).fromNow()}
            </td>
            <td>
              <select onchange="capNhatTrangThai('${r._id}', this.value)">
                <option value="dang_xu_ly" ${r.status === 'dang_xu_ly' ? 'selected' : ''}>⏳ Đang xử lý</option>
                <option value="cho_ky" ${r.status === 'cho_ky' ? 'selected' : ''}>🖋 Chờ ký</option>
                <option value="da_ky" ${r.status === 'da_ky' ? 'selected' : ''}>✅ Đã ký</option>
                <option value="dang_van_chuyen" ${r.status === 'dang_van_chuyen' ? 'selected' : ''}>🚚 Đang vận chuyển</option>
                <option value="san_sang_giao" ${r.status === 'san_sang_giao' ? 'selected' : ''}>📦 Sẵn sàng giao</option>
                <option value="da_giao" ${r.status === 'da_giao' ? 'selected' : ''}>📬 Đã giao</option>
              </select>
            </td>
            <td><button onclick="xoaDangKy('${r._id}')" style="color:red;">🗑️</button></td>
          </tr>`;
      });

      html += "</tbody></table>";
      document.getElementById("adminTable").innerHTML = html;
    }
    
    function capNhatTrangThai(id, status) {
  fetch(`/api/cap-nhat-trang-thai/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  })
    .then(res => res.json())
    .then(data => {
      showToast(data.message || "Đã cập nhật");
      fetchAndRenderData();
    })
    .catch(error => {
      console.error("Lỗi khi cập nhật trạng thái:", error);
    });
}
    
function xoaDangKy(id) {
  if (!confirm("Bạn có chắc muốn xóa?")) return;
  fetch(`/api/xoa-dang-ky/${id}`, { method: "DELETE" })
    .then(res => res.json())
    .then(data => {
      showToast(data.message || "Đã xóa");
      fetchAndRenderData(); // Cập nhật lại dữ liệu sau khi xóa
    })
    .catch(error => {
      console.error("Lỗi khi xóa đăng ký:", error);
    });
}
    
    function exportToExcel() {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rawData.map(r => ({
        "Họ tên": r.fullName,
        "MSSV": r.msv,
        "Lớp": r.lop,
        "Cơ sở": r.agreed ? "NVC" : "",
        "Thời gian": dayjs(r.createdAt).format("HH:mm DD/MM/YYYY"),
        "Trạng thái": hienTrangThai(r.status)
      })));
      XLSX.utils.book_append_sheet(wb, ws, "Danh sách");
      XLSX.writeFile(wb, "dang_ky_toeic.xlsx");
    }
    
    function hienTrangThai(status) {
      const d = {
        dang_xu_ly: "Đang xử lý",
        cho_ky: "Chờ ký",
        da_ky: "Đã ký",
        dang_van_chuyen: "Vận chuyển",
        san_sang_giao: "Sẵn sàng giao",
        da_giao: "Đã giao",
      };
      return d[status] || status;
    }
    
    function showToast(msg, type = "success") {
      const toast = document.createElement("div");
      toast.className = `toast ${type === "error" ? "error" : ""}`;
      toast.textContent = msg;
      document.getElementById("toast-container").appendChild(toast);
      setTimeout(() => toast.classList.add("exit"), 3000);
      setTimeout(() => toast.remove(), 3500);
    }
    
    document.getElementById("filterLop").addEventListener("change", filterTable);
    document.getElementById("filterStatus").addEventListener("change", filterTable);
    document.getElementById("searchInput").addEventListener("input", filterTable);
    
    function filterTable() {
      const lop = filterLop.value;
      const status = filterStatus.value;
      const keyword = searchInput.value.toLowerCase();
      const filtered = rawData.filter(r => {
        const matchLop = lop ? r.lop === lop : true;
        const matchStatus = status ? r.status === status : true;
        const matchKeyword = 
          r.fullName.toLowerCase().includes(keyword) ||
          r.msv.toLowerCase().includes(keyword) ||
          r.lop.toLowerCase().includes(keyword);
        return matchLop && matchStatus && matchKeyword;
      });
      renderTable(filtered);
    }
    
    fetchAndRenderData();
    setInterval(fetchAndRenderData, 10000);