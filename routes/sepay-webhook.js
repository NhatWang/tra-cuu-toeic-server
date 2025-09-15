const express = require("express");
const router = express.Router();
const ExamRegistration = require("../models/ExamRegistration");
const sendMail = require("../utils/mailer");
const sendConfirmationEmail = require("../utils/sendReceipt");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

router.post("/sepay-webhook", async (req, res) => {
  const { description } = req.body;
  const match = description?.match(/\bCHEMO[A-Z0-9]{3,5}\b/i);
  const paymentCode = match ? match[0].toUpperCase() : null;

  if (!paymentCode) {
    return res.json({ success: false, message: "❌ Không tìm thấy mã thanh toán." });
  }

  try {
    const user = await ExamRegistration.findOne({ paymentCode });
    if (!user) return res.json({ success: false, message: "❌ Không tìm thấy user." });

    if (user.paymentStatus === "paid") {
      return res.json({ success: true, message: "🔁 Đã thanh toán trước đó." });
    }

    await ExamRegistration.updateOne(
      { paymentCode },
      { $set: { paymentStatus: "paid" }, $unset: { expireAt: "" } }
    );

    req.app.get("io").emit("payment-updated", { mssv: user.msv, status: "paid" });

    try {
      await sendConfirmationEmail(user);
    } catch (err) {
      console.error("❌ Lỗi gửi mail xác nhận:", err.message);
    }

    if (ADMIN_EMAIL) {
      try {
        await sendMail({
          to: ADMIN_EMAIL,
          subject: `[Thông báo] Thanh toán từ ${user.fullName}`,
          html: `<p>${user.fullName} vừa thanh toán thành công với mã ${user.paymentCode}</p>`
        });
      } catch (err) {
        console.error("❌ Lỗi gửi mail admin:", err.message);
      }
    }

    return res.json({ success: true, message: `✅ Đã xác nhận mã ${paymentCode}` });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return res.status(500).json({ success: false, message: "❌ Lỗi máy chủ." });
  }
});

module.exports = router;
