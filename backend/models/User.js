const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  level: { type: String },
  group: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
