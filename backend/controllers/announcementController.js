const Announcement = require('../models/Announcement');

// Get announcements
exports.getAnnouncements = async (req, res) => {
  try {
    const { level, group } = req.query;
    let query = {};
    if (level) query.level = level;
    if (group) query.group = group;

    const list = await Announcement.find(query).sort({ createdAt: -1 });
    const mapped = list.map(a => ({
      level: a.level,
      group: a.group,
      message: a.message,
      date: a.createdAt ? new Date(a.createdAt).toLocaleDateString('ar-EG') : new Date().toLocaleDateString('ar-EG')
    }));
    res.json(mapped);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في جلب التنبيهات' });
  }
};

// Admin: Add Announcement
exports.addAnnouncement = async (req, res) => {
  try {
    const { level, group, message } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: 'محتوى التنبيه مطلوب' });
    }

    const newAnnouncement = await Announcement.create({
      level,
      group,
      message
    });

    const responseAnn = {
      level: newAnnouncement.level,
      group: newAnnouncement.group,
      message: newAnnouncement.message,
      date: new Date(newAnnouncement.createdAt).toLocaleDateString('ar-EG')
    };

    res.status(201).json({ success: true, message: 'تم إضافة التنبيه بنجاح', announcement: responseAnn });
  } catch (error) {
    console.error('Error adding announcement:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء إضافة التنبيه' });
  }
};
