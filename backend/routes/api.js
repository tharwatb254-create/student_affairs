const express = require('express');
const router = express.Router();
const multer = require('multer');
const { body } = require('express-validator');

// Import Controllers
const authController = require('../controllers/authController');
const studentController = require('../controllers/studentController');
const gradeController = require('../controllers/gradeController');
const attendanceController = require('../controllers/attendanceController');
const requestController = require('../controllers/requestController');
const scheduleController = require('../controllers/scheduleController');
const announcementController = require('../controllers/announcementController');

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
router.get('/api/students', studentController.getStudents);

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
router.get('/api/grades', gradeController.getGrades);

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
router.get('/api/attendance', attendanceController.getAttendance);

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
router.post('/api/admin/grades', gradeController.setGrades);

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
router.get('/api/profile', studentController.getProfile);

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
router.get('/api/requests', requestController.getRequests);

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
router.post('/api/requests', requestController.createRequest);

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
router.get('/api/schedule', scheduleController.getSchedule);

// Get announcements
router.get('/api/announcements', announcementController.getAnnouncements);

// Admin: Add Schedule
router.post('/api/admin/schedule', scheduleController.addSchedule);

// Admin: Add Announcement
router.post('/api/admin/announcements', announcementController.addAnnouncement);

// Admin: Add Attendance
router.post('/api/admin/attendance', attendanceController.addAttendance);

// Admin: Upload Attendance CSV
router.post('/api/admin/upload-attendance', upload.single('file'), attendanceController.uploadAttendance);

// Admin: Upload Schedule File (Image/PDF)
router.post('/api/admin/upload-schedule', upload.single('file'), scheduleController.uploadSchedule);

// Register endpoint
router.post(
  '/api/register',
  [
    body('username').notEmpty().withMessage('اسم المستخدم / رقم القيد مطلوب'),
    body('password').isLength({ min: 6 }).withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
    body('name').notEmpty().withMessage('الاسم بالكامل مطلوب')
  ],
  authController.register
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
  authController.login
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
router.get('/api/admin/requests', requestController.getAdminRequests);

// Admin: Update request status
router.put('/api/admin/requests/:id', requestController.updateRequestStatus);

module.exports = router;
