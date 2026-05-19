const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { body, validationResult } = require('express-validator');

// Import Mongoose Models
const User = require('../models/User');
const Grade = require('../models/Grade');
const Attendance = require('../models/Attendance');
const Request = require('../models/Request');
const Schedule = require('../models/Schedule');
const Announcement = require('../models/Announcement');

// Configure Multer for File Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Routes

/**
 * @swagger
 * /:
 *   get:
 *     summary: Welcome message
 *     responses:
 *       200:
 *         description: Welcome string
 */
router.get('/', (req, res) => {
  res.send('Welcome to the Student Affairs API');
});

// Get all students
/**
 * @swagger
 * /api/students:
 *   get:
 *     summary: Get all students (with optional filters)
 *     tags: [Students]
 *     parameters:
 *       - in: query
 *         name: name
 *         schema: { type: string }
 *         description: Filter by name
 *       - in: query
 *         name: level
 *         schema: { type: string }
 *         description: Filter by level
 *       - in: query
 *         name: group
 *         schema: { type: string }
 *         description: Filter by group
 *     responses:
 *       200:
 *         description: List of filtered students
 */
router.get('/api/students', async (req, res) => {
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
});

// Get grades by studentId
/**
 * @swagger
 * /api/grades:
 *   get:
 *     summary: Get grades for a student
 *     tags: [Grades]
 *     parameters:
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student grades
 */
router.get('/api/grades', async (req, res) => {
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
});

// Get attendance by studentId
/**
 * @swagger
 * /api/attendance:
 *   get:
 *     summary: Get attendance for a student
 *     tags: [Attendance]
 *     parameters:
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: string
 *         description: The ID of the student
 *     responses:
 *       200:
 *         description: List of attendance records
 */
router.get('/api/attendance', async (req, res) => {
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
});

// Admin: Set grades for a student
/**
 * @swagger
 * /api/admin/grades:
 *   post:
 *     summary: Set grades for a student (Admin)
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Success message
 */
router.post('/api/admin/grades', async (req, res) => {
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
});

// Get profile by studentId
/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Get student profile
 *     tags: [Students]
 *     parameters:
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student profile
 */
router.get('/api/profile', async (req, res) => {
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
});

// Get student requests (filtered by studentId)
/**
 * @swagger
 * /api/requests:
 *   get:
 *     summary: Get requests (with optional filters)
 *     tags: [Requests]
 *     parameters:
 *       - in: query
 *         name: studentId
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: title
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of filtered requests
 */
router.get('/api/requests', async (req, res) => {
  try {
    const { studentId, status, title } = req.query;
    let query = {};

    if (studentId) {
      query.studentId = studentId;
    }
    if (status) {
      query.status = status;
    }
    if (title) {
      query.title = { $regex: title, $options: 'i' };
    }

    const requests = await Request.find(query).sort({ createdAt: -1 });
    const mappedRequests = requests.map(r => ({
      id: r._id.toString(),
      title: r.title,
      reason: r.reason,
      studentId: r.studentId,
      studentName: r.studentName,
      status: r.status,
      date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('ar-EG') : new Date().toLocaleDateString('ar-EG')
    }));

    res.status(200).json(mappedRequests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في جلب الطلبات' });
  }
});

/**
 * @swagger
 * /api/requests:
 *   post:
 *     summary: Submit a new request
 *     tags: [Requests]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Success message
 */
router.post('/api/requests', async (req, res) => {
  try {
    const { title, reason, studentId } = req.body;
    if (!title || !studentId) {
      return res.status(400).json({ success: false, message: 'العنوان ومعرف الطالب مطلوبان' });
    }

    const user = await User.findOne({ username: studentId });
    const studentName = user ? user.name : 'طالب';

    const newRequest = await Request.create({
      title,
      reason,
      studentId,
      studentName,
      status: 'قيد المراجعة'
    });

    const responseRequest = {
      id: newRequest._id.toString(),
      title: newRequest.title,
      reason: newRequest.reason,
      studentId: newRequest.studentId,
      studentName: newRequest.studentName,
      status: newRequest.status,
      date: new Date(newRequest.createdAt).toLocaleDateString('ar-EG')
    };

    res.status(201).json({ message: 'تم إرسال الطلب بنجاح', request: responseRequest });
  } catch (error) {
    console.error('Error submitting request:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء إرسال الطلب' });
  }
});

// Get schedule (filtered by level and group)
/**
 * @swagger
 * /api/schedule:
 *   get:
 *     summary: Get schedule by level and group
 *     tags: [General]
 *     parameters:
 *       - in: query
 *         name: level
 *         schema: { type: string }
 *       - in: query
 *         name: group
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Schedule data
 */
router.get('/api/schedule', async (req, res) => {
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
});

// Get announcements
router.get('/api/announcements', async (req, res) => {
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
});

// Admin: Add Schedule
router.post('/api/admin/schedule', async (req, res) => {
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
});

// Admin: Add Announcement
router.post('/api/admin/announcements', async (req, res) => {
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
});

// Admin: Add Attendance
router.post('/api/admin/attendance', async (req, res) => {
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
});

// Admin: Upload Attendance CSV
router.post('/api/admin/upload-attendance', upload.single('file'), async (req, res) => {
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
});

// Admin: Upload Schedule File (Image/PDF)
router.post('/api/admin/upload-schedule', upload.single('file'), async (req, res) => {
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
});

// Register endpoint
router.post(
  '/api/register',
  [
    body('username').notEmpty().withMessage('اسم المستخدم / رقم القيد مطلوب'),
    body('password').isLength({ min: 6 }).withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
    body('name').notEmpty().withMessage('الاسم بالكامل مطلوب')
  ],
  async (req, res) => {
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
  }
);

// Login endpoint
/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: User login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login success
 */
router.post(
  '/api/login',
  [
    body('username').notEmpty().withMessage('اسم المستخدم مطلوب'),
    body('password').notEmpty().withMessage('كلمة المرور مطلوبة')
  ],
  async (req, res) => {
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
  }
);

/**
 * @swagger
 * /api/admin/requests:
 *   get:
 *     summary: Get all requests for admin (with optional filters)
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: studentId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of filtered requests
 */
router.get('/api/admin/requests', async (req, res) => {
  try {
    const { status, studentId } = req.query;
    let query = {};

    if (status) {
      query.status = status;
    }
    if (studentId) {
      query.studentId = studentId;
    }

    const requests = await Request.find(query).sort({ createdAt: -1 });
    const mappedRequests = requests.map(r => ({
      id: r._id.toString(),
      title: r.title,
      reason: r.reason,
      studentId: r.studentId,
      studentName: r.studentName,
      status: r.status,
      date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('ar-EG') : new Date().toLocaleDateString('ar-EG')
    }));

    res.status(200).json(mappedRequests);
  } catch (error) {
    console.error('Error fetching admin requests:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء جلب طلبات المدير' });
  }
});

// Admin: Update request status
router.put('/api/admin/requests/:id', async (req, res) => {
  try {
    const requestId = req.params.id;
    const { status } = req.body;

    const updatedRequest = await Request.findByIdAndUpdate(
      requestId,
      { status },
      { new: true }
    );

    if (updatedRequest) {
      const responseRequest = {
        id: updatedRequest._id.toString(),
        title: updatedRequest.title,
        reason: updatedRequest.reason,
        studentId: updatedRequest.studentId,
        studentName: updatedRequest.studentName,
        status: updatedRequest.status,
        date: new Date(updatedRequest.createdAt).toLocaleDateString('ar-EG')
      };
      res.json({ success: true, message: 'تم تحديث حالة الطلب', request: responseRequest });
    } else {
      res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    }
  } catch (error) {
    console.error('Error updating request status:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء تحديث الطلب' });
  }
});

module.exports = router;
