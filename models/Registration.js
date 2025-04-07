import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema({
  fullName: String,
  msv: String,
  lop: String,
  agreed: Boolean,
  status: {
    type: String,
    enum: ['dang_xu_ly', 'cho_ky', 'da_ky', 'dang_van_chuyen', 'san_sang_giao', 'da_giao'],
    default: 'dang_xu_ly'
  }
}, { timestamps: true });

export default mongoose.model('Registration', registrationSchema);