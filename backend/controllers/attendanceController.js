const Attendance = require('../models/Attendance');
const fs = require('fs');
const csv = require('csv-parser');

// Get attendance by studentId or all attendance
exports.getAttendance = async (req, res) => {
  try {
    const { studentId } = req.query;
    if (studentId) {
      const records = await Attendance.find({ studentId });
      res.status(200).json(records);
    } else {
      const allRecords = await Attendance.find({});
      res.status(200).json(allRecords);
    }
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في جلب بيانات الغياب' });
  }
};

// Admin: Add Attendance
exports.addAttendance = async (req, res) => {
  try {
    const { studentId, subject, absences, totalLectures } = req.body;
    if (!studentId || !subject) {
      return res.status(400).json({ success: false, message: 'معرف الطالب والمادة مطلوبان' });
    }

    await Attendance.findOneAndUpdate(
      { studentId, subject },
      { absences: absences || 0, totalLectures: totalLectures || 1 },
      { upsert: true, new: true }
    );

    res.status(201).json({ success: true, message: 'تم حفظ الغياب بنجاح' });
  } catch (error) {
    console.error('Error setting attendance:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء حفظ الغياب' });
  }
};

// Admin: Upload Attendance CSV
exports.uploadAttendance = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'يرجى إرفاق ملف' });
    }

    const results = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          for (const row of results) {
            if (row.studentId && row.subject) {
              await Attendance.findOneAndUpdate(
                { studentId: row.studentId, subject: row.subject },
                {
                  absences: parseInt(row.absences) || 0,
                  totalLectures: parseInt(row.totalLectures) || 1
                },
                { upsert: true }
              );
            }
          }
          // Clean up uploaded file
          fs.unlinkSync(req.file.path);
          res.json({ success: true, message: 'تم رفع الغياب وتحديثه بنجاح' });
        } catch (err) {
          console.error('Error processing CSV rows:', err);
          res.status(500).json({ success: false, message: 'حدث خطأ أثناء معالجة البيانات من الملف' });
        }
      });
  } catch (error) {
    console.error('Error uploading attendance:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء رفع ملف الغياب' });
  }
};
