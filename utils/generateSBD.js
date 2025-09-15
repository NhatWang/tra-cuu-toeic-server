const ExamRegistration = require("../models/ExamRegistration");

async function generateSBD() {
  let sbd;
  let exists = true;

  while (exists) {
    const num = Math.floor(Math.random() * 100) + 1; // 1 → 100
    sbd = num.toString().padStart(3, "0");           // "001" → "100"
    exists = await ExamRegistration.findOne({ sbd });
  }

  return sbd;
}

module.exports = generateSBD;