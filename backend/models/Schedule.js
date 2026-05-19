const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  level: String,
  group: String,
  day: String,
  time: String,
  subject: String,
  hall: String,
  fileUrl: String,
  isFile: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Schedule', scheduleSchema);
