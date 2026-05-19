const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  subject: { type: String, required: true },
  absences: { type: Number, default: 0 },
  totalLectures: { type: Number, default: 1 }
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
