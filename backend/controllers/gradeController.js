const Grade = require('../models/Grade');

// Get grades by studentId or all grades
exports.getGrades = async (req, res) => {
  try {
    const { studentId } = req.query;
    if (studentId) {
      const grade = await Grade.findOne({ studentId });
      if (grade) {
        res.status(200).json({
          cgpa: grade.cgpa || 'N/A',
          semesterGpa: grade.semesterGpa || 'N/A',
          semester: grade.semester || '',
          courses: grade.courses || []
        });
      } else {
        res.status(200).json({ cgpa: 'N/A', semesterGpa: 'N/A', semester: 'لا توجد درجات مسجلة بعد', courses: [] });
      }
    } else {
      const allGrades = await Grade.find({});
      const gradesMap = {};
      allGrades.forEach(g => {
        gradesMap[g.studentId] = {
          cgpa: g.cgpa,
          semesterGpa: g.semesterGpa,
          semester: g.semester,
          courses: g.courses
        };
      });
      res.status(200).json(gradesMap);
    }
  } catch (error) {
    console.error('Error fetching grades:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في جلب الدرجات' });
  }
};

// Admin: Set grades for a student
exports.setGrades = async (req, res) => {
  try {
    const { studentId, cgpa, semesterGpa, semester, courses } = req.body;
    if (!studentId) {
      return res.status(400).json({ success: false, message: 'معرف الطالب مطلوب' });
    }

    await Grade.findOneAndUpdate(
      { studentId },
      { cgpa, semesterGpa, semester, courses },
      { upsert: true, new: true }
    );

    res.status(201).json({ success: true, message: 'تم حفظ درجات الطالب بنجاح' });
  } catch (error) {
    console.error('Error setting grades:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء حفظ درجات الطالب' });
  }
};
