// Fake sendReceipt, chỉ để server không bị lỗi khi thiếu module
module.exports = function (data) {
  console.log("🧾 sendReceipt disabled (dummy). Data:", data);
};