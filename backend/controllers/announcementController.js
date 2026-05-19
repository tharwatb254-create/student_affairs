const Announcement = require('../models/Announcement');
const { validationResult } = require('express-validator');

// 1. Create Announcement (Admin action)
exports.addAnnouncement = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
    }

    const { level, group, message } = req.body;

    const newAnnouncement = await Announcement.create({
      level,
      group,
      message
    });

    const responseAnn = {
      id: newAnnouncement._id.toString(),
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

// 2. Read Announcements (With filtration by level & group query params)
exports.getAnnouncements = async (req, res) => {
  try {
    const { level, group } = req.query;
    let query = {};
    if (level) query.level = level;
    if (group) query.group = group;

    const list = await Announcement.find(query).sort({ createdAt: -1 });
    const mapped = list.map(a => ({
      id: a._id.toString(),
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

// 3. Read Single Announcement by ID
exports.getAnnouncementById = async (req, res) => {
  try {
    const announcementId = req.params.id;

    if (!announcementId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'معرف التنبيه غير صحيح كصيغة' });
    }

    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'عذراً، التنبيه المطلوب غير موجود (404)' });
    }

    res.status(200).json({
      id: announcement._id.toString(),
      level: announcement.level,
      group: announcement.group,
      message: announcement.message,
      date: new Date(announcement.createdAt).toLocaleDateString('ar-EG')
    });
  } catch (error) {
    console.error('Error fetching announcement by ID:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في جلب بيانات التنبيه' });
  }
};

// 4. Update Announcement (Admin action)
exports.updateAnnouncement = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
    }

    const announcementId = req.params.id;
    const { level, group, message } = req.body;

    if (!announcementId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'معرف التنبيه غير صحيح كصيغة' });
    }

    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'عذراً، التنبيه المطلوب تعديله غير موجود بالنظام (404)' });
    }

    // Update fields
    if (level !== undefined) announcement.level = level;
    if (group !== undefined) announcement.group = group;
    if (message !== undefined) announcement.message = message;

    await announcement.save();

    res.status(200).json({
      success: true,
      message: 'تم تحديث التنبيه بنجاح',
      announcement: {
        id: announcement._id.toString(),
        level: announcement.level,
        group: announcement.group,
        message: announcement.message,
        date: new Date(announcement.createdAt).toLocaleDateString('ar-EG')
      }
    });
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء تعديل التنبيه' });
  }
};

// 5. Delete Announcement (Admin action)
exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcementId = req.params.id;

    if (!announcementId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'معرف التنبيه غير صحيح كصيغة' });
    }

    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'عذراً، التنبيه المطلوب حذفه غير موجود بالنظام (404)' });
    }

    await Announcement.deleteOne({ _id: announcementId });

    res.status(200).json({
      success: true,
      message: 'تم حذف التنبيه بنجاح'
    });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء حذف التنبيه' });
  }
};
