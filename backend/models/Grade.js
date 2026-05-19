const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  cgpa: String,
  semesterGpa: String,
  semester: String,
  courses: [{ subject: String, grade: String, marks: String }]
}, { timestamps: true });

module.exports = mongoose.model('Grade', gradeSchema);
