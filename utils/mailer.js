// Fake mailer, chỉ để server không bị lỗi
module.exports = function () {
  console.log("📧 Mailer is disabled (dummy function).");
};
