const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  reason: String,
  studentId: { type: String, required: true },
  studentName: String,
  status: { type: String, default: 'قيد المراجعة' }
}, { timestamps: true });

module.exports = mongoose.model('Request', requestSchema);
