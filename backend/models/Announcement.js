const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  level: String,
  group: String,
  message: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
