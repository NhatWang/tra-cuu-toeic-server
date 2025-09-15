const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const UTM_Avo = path.resolve(__dirname, '../public/fonts/UTM Avo.ttf');
const UTM_AvoItalic = path.resolve(__dirname, '../public/fonts/UTM AvoItalic.ttf');
const UTM_AvoBoldItalic = path.resolve(__dirname, '../public/fonts/UTM AvoBold_Italic.ttf');
const UTM_AvoBold = path.resolve(__dirname, '../public/fonts/UTM AvoBold.ttf');

async function generateReceiptPDF(data) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      // ===== Logo =====
      const logoPath = path.resolve(process.cwd(), 'public/images/chemopen/receipt.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, (doc.page.width - 400) / 2, 30, { width: 400 });
        doc.moveDown(4);
      }
      doc.moveDown(6);

      // ===== Tiêu đề =====
      doc
        .fontSize(20)
        .font(UTM_AvoBold)
        .fillColor('#000')
        .text('PHIẾU XÁC NHẬN ĐĂNG KÝ', { align: 'center' });

      doc
        .moveDown(0.5)
        .fontSize(20)
        .font(UTM_AvoBold)
        .fillColor('#000')
        .text('THI THỬ TOEIC 2025', { align: 'center' });

      doc
        .moveDown(2)


      // ===== Mã xác minh =====
      const verifyCode = crypto.createHash('sha1').update(data.paymentCode).digest('hex').slice(-6).toUpperCase();
      doc
        .fontSize(10)
        .fillColor('#888')
        .text(`Mã xác minh: ${verifyCode}`, {
          align: 'left',
          continued: false,
          underline: false,
          link: undefined
        });

      doc.moveDown(0.5);

      // ===== Khung thông tin =====
      const labelX = 70;
      const valueX = 250;
      const lineHeight = 22;

      doc.moveDown(1);
      doc.fontSize(13).fillColor('#000');
      const infoStartY = doc.y;

      const boxHeight = lineHeight * 10 + 24;
      doc.roundedRect(50, infoStartY - 15, doc.page.width - 100, boxHeight, 10).stroke('#aaa');

      const drawLine = (label, value, yOffset) => {
        const y = infoStartY + yOffset;
        doc.font(UTM_AvoBold).text(label, labelX, y);
        doc.font(UTM_Avo).text(value, valueX, y);
      };
      const vnTime = dayjs().tz('Asia/Ho_Chi_Minh').format('HH:mm:ss DD/MM/YYYY');
      drawLine("Họ tên:", data.fullName, 0);
      drawLine("MSSV:", data.msv, lineHeight);
      drawLine("Email:", data.email, lineHeight * 2);
      drawLine("Số điện thoại:", data.sdt, lineHeight * 3);
      drawLine("Trường:", data.truong, lineHeight * 4);
      drawLine("Khoa:", data.khoa, lineHeight * 5);
      drawLine("Ngành học:", data.nganh, lineHeight * 6);
      drawLine("Năm học:", data.namhoc, lineHeight * 7);
      drawLine("Ca thi:", data.cathi, lineHeight * 8);
      drawLine("Thời gian đăng ký:", vnTime, lineHeight * 9);
      drawLine("Số báo danh:", )

      doc.moveDown(3);

      // ===== Ghi chú căn giữa tuyệt đối =====
      const noteVN = 'Lưu ý: Vui lòng có mặt trước giờ thi 15 phút và mang theo thẻ sinh viên.hận điện tử.';

      doc.fontSize(12).font(UTM_AvoBoldItalic);
      const vnWidth = doc.widthOfString(noteVN);
      const xVN = (doc.page.width - vnWidth) / 2;
      doc.text(noteVN, xVN, doc.y, { lineBreak: false });

      doc.moveDown(1.3);
      doc.fontSize(11).font(UTM_AvoItalic);
      const enWidth = doc.widthOfString(noteEN);
      const xEN = (doc.page.width - enWidth) / 2;
      doc.text(noteEN, xEN, doc.y, { lineBreak: false });

      doc.moveDown(3);

      // ===== Ký tên căn giữa theo khối phải =====
      const now = dayjs().tz('Asia/Ho_Chi_Minh');
      const day = now.date();
      const month = now.month() + 1;
      const year = now.year();
      const dateText = `TP. Hồ Chí Minh, ngày ${day} tháng ${month} năm ${year}`;

      doc.fontSize(12).font(UTM_AvoItalic);
      const x = 300;
      doc.text(dateText, x, doc.y, { lineBreak: false });

      doc.moveDown(1.5);
      doc.font(UTM_Avo);
      const y = 360;
      doc.text("Trưởng ban Ban Tổ chức", y, doc.y, { lineBreak: false });

      const sign = path.resolve(process.cwd(), 'public/images/chemopen/Sign.png');
      if (fs.existsSync(sign)) {
        const t = 330;
        doc.image(sign, t, doc.y - 5, { width: 200 });
        doc.moveDown(2.5);
      }
      doc.moveDown(4);
      doc.fontSize(14).font(UTM_AvoBold);
      const z = 370;
      doc.text("Nguyễn Vân Giang", z, doc.y, { lineBreak: false });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = generateReceiptPDF;
