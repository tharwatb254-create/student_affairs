const Schedule = require('../models/Schedule');

// Get schedule (filtered by level and group)
exports.getSchedule = async (req, res) => {
  try {
    const { level, group } = req.query;
    let query = {};
    if (level) query.level = level;
    if (group) query.group = group;

    const schedules = await Schedule.find(query);
    res.status(200).json(schedules);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في جلب الجدول' });
  }
};

// Admin: Add Schedule
exports.addSchedule = async (req, res) => {
  try {
    const { level, group, day, time, subject, hall, fileUrl, isFile } = req.body;
    const newSchedule = await Schedule.create({
      level,
      group,
      day,
      time,
      subject,
      hall,
      fileUrl,
      isFile: isFile || false
    });
    res.status(201).json({ success: true, message: 'تم إضافة المحاضرة للجدول', schedule: newSchedule });
  } catch (error) {
    console.error('Error adding schedule:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء إضافة الجدول' });
  }
};

// Admin: Upload Schedule File (Image/PDF)
exports.uploadSchedule = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'يرجى إرفاق ملف' });
    }
    const { level, group } = req.body;
    const fileUrl = `/uploads/${req.file.filename}`;

    const newSchedule = await Schedule.create({
      level,
      group,
      fileUrl,
      isFile: true
    });

    res.status(201).json({ success: true, message: 'تم رفع الجدول بنجاح', schedule: newSchedule });
  } catch (error) {
    console.error('Error uploading schedule file:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء رفع جدول المحاضرات' });
  }
};
