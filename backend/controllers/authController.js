const User = require('../models/User');
const { validationResult } = require('express-validator');

// Register a new student
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
    }

    const { username, password, name, role, level, group } = req.body;

    if (role === 'admin') {
      return res.status(400).json({ success: false, message: 'غير مسموح بإنشاء حساب مدير جديد' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'اسم المستخدم موجود بالفعل' });
    }

    const newUser = await User.create({
      username,
      password, // In a real app, hash this!
      name,
      role: role || 'student',
      level: role === 'student' ? level : null,
      group: role === 'student' ? group : null
    });

    res.status(201).json({ success: true, message: 'تم إنشاء الحساب بنجاح', user: newUser });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء إنشاء الحساب' });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
    }

    const { username, password } = req.body;
    const user = await User.findOne({ username, password });

    if (user) {
      res.json({
        success: true,
        role: user.role,
        message: 'تم تسجيل الدخول بنجاح',
        user: {
          username: user.username,
          name: user.name,
          role: user.role,
          level: user.level,
          group: user.group
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء تسجيل الدخول' });
  }
};
