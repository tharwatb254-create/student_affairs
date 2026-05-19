const User = require('../models/User');

// Get all students (with optional filters)
exports.getStudents = async (req, res) => {
  try {
    const { name, level, group } = req.query;
    let query = { role: 'student' };

    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }
    if (level) {
      query.level = level;
    }
    if (group) {
      query.group = group;
    }

    const students = await User.find(query);
    const mappedStudents = students.map(s => ({
      id: s.username,
      name: s.name,
      level: s.level,
      group: s.group
    }));

    res.status(200).json(mappedStudents);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في جلب بيانات الطلاب' });
  }
};

// Get profile by studentId
exports.getProfile = async (req, res) => {
  try {
    const { studentId } = req.query;
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
      res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في جلب البيانات الشخصية' });
  }
};
