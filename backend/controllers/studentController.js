const User = require('../models/User');
const Grade = require('../models/Grade');
const Attendance = require('../models/Attendance');
const Request = require('../models/Request');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

// 1. Create a Student (Admin action)
exports.createStudent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
    }

    const { username, password, name, level, group } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'رقم القيد / اسم المستخدم هذا مسجل بالفعل في النظام' });
    }

    // Encrypt password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newStudent = await User.create({
      username,
      password: hashedPassword,
      name,
      role: 'student',
      level,
      group
    });

    res.status(201).json({
      success: true,
      message: 'تم إضافة الطالب بنجاح',
      student: {
        username: newStudent.username,
        name: newStudent.name,
        level: newStudent.level,
        group: newStudent.group,
        role: newStudent.role
      }
    });
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء إضافة الطالب' });
  }
};

// 2. Read Students (With filtration query params)
exports.getStudents = async (req, res) => {
  try {
    const { name, level, group, username } = req.query;
    let query = { role: 'student' };

    // filtration using query params
    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }
    if (level) {
      query.level = level;
    }
    if (group) {
      query.group = group;
    }
    if (username) {
      query.username = username;
    }

    const students = await User.find(query);
    const mappedStudents = students.map(s => ({
      id: s.username,
      name: s.name,
      level: s.level,
      group: s.group,
      role: s.role
    }));

    res.status(200).json(mappedStudents);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في جلب بيانات الطلاب' });
  }
};

// 3. Read Single Student Profile
exports.getProfile = async (req, res) => {
  try {
    const studentId = req.query.studentId || req.params.id;
    if (!studentId) {
      return res.status(400).json({ success: false, message: 'معرف الطالب مطلوب' });
    }

    const user = await User.findOne({ username: studentId });
    if (user) {
      res.status(200).json({
        name: user.name,
        id: user.username,
        level: user.level || (user.role === 'admin' ? 'مدير' : 'N/A'),
        group: user.group || 'N/A',
        role: user.role,
        department: 'نظم معلومات الأعمال (BIS)'
      });
    } else {
      res.status(404).json({ success: false, message: 'الطالب غير موجود بالنظام (404)' });
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في جلب البيانات الشخصية' });
  }
};

// 4. Update Student Details
exports.updateStudent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
    }

    const studentId = req.params.id;
    const { name, level, group, password } = req.body;

    // Check if the student exists first
    const student = await User.findOne({ username: studentId, role: 'student' });
    if (!student) {
      return res.status(404).json({ success: false, message: 'عذراً، لم يتم العثور على الطالب المطلوب لتعديله (404)' });
    }

    // Update fields
    if (name) student.name = name;
    if (level) student.level = level;
    if (group) student.group = group;
    if (password) {
      student.password = await bcrypt.hash(password, 10);
    }

    await student.save();

    res.status(200).json({
      success: true,
      message: 'تم تحديث بيانات الطالب بنجاح',
      student: {
        username: student.username,
        name: student.name,
        level: student.level,
        group: student.group
      }
    });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء تحديث بيانات الطالب' });
  }
};

// 5. Delete Student (With cascade deletion of Grades, Attendance, and Requests)
exports.deleteStudent = async (req, res) => {
  try {
    const studentId = req.params.id;

    // Check if the student exists first
    const student = await User.findOne({ username: studentId, role: 'student' });
    if (!student) {
      return res.status(404).json({ success: false, message: 'عذراً، لم يتم العثور على الطالب المطلوب لحذفه (404)' });
    }

    // Cascade delete related records
    await User.deleteOne({ username: studentId });
    await Grade.deleteMany({ studentId });
    await Attendance.deleteMany({ studentId });
    await Request.deleteMany({ studentId });

    res.status(200).json({
      success: true,
      message: 'تم حذف الطالب وجميع السجلات المتعلقة به (درجات، غياب، طلبات) بنجاح'
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء حذف الطالب' });
  }
};
