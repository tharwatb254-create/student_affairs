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

// Import JWT Middleware
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

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

// ==========================================
// 1. General & Welcome Routes
// ==========================================

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

// ==========================================
// 2. Authentication Flow (Public)
// ==========================================

// Student self-signup
router.post(
  '/api/register',
  [
    body('username').notEmpty().withMessage('اسم المستخدم / رقم القيد مطلوب'),
    body('password').isLength({ min: 6 }).withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
    body('name').notEmpty().withMessage('الاسم بالكامل مطلوب')
  ],
  authController.register
);

// Login
router.post(
  '/api/login',
  [
    body('username').notEmpty().withMessage('اسم المستخدم مطلوب'),
    body('password').notEmpty().withMessage('كلمة المرور مطلوبة')
  ],
  authController.login
);

// ==========================================
// 3. Students CRUD Operations
// ==========================================

// Get all students (Filtration by query parameters name/level/group supported)
router.get('/api/students', studentController.getStudents);

// Get student profile (by studentId query param)
router.get('/api/profile', studentController.getProfile);

// Get single student profile by path ID (Requires Authentication)
router.get('/api/students/:id', requireAuth, studentController.getProfile);

// Admin: Add a new student securely
router.post(
  '/api/admin/students',
  requireAdmin,
  [
    body('username').notEmpty().withMessage('رقم القيد / اسم المستخدم مطلوب'),
    body('password').isLength({ min: 6 }).withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
    body('name').notEmpty().withMessage('الاسم بالكامل مطلوب'),
    body('level').notEmpty().withMessage('الفرقة الدراسية مطلوبة'),
    body('group').notEmpty().withMessage('الجروب مطلوب')
  ],
  studentController.createStudent
);

// Admin/Student: Update student details
router.put(
  '/api/students/:id',
  requireAuth,
  [
    body('name').optional().notEmpty().withMessage('الاسم لا يمكن أن يكون فارغاً'),
    body('password').optional().isLength({ min: 6 }).withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
  ],
  studentController.updateStudent
);

// Admin: Delete student (Cascade deletes Grades, Attendance, and Requests)
router.delete('/api/students/:id', requireAdmin, studentController.deleteStudent);

// ==========================================
// 4. Requests CRUD Operations
// ==========================================

// Create request (Student action - protected)
router.post(
  '/api/requests',
  requireAuth,
  [
    body('title').notEmpty().withMessage('عنوان الطلب مطلوب'),
    body('studentId').notEmpty().withMessage('معرف الطالب مطلوب')
  ],
  requestController.createRequest
);

// Get requests filtered by studentId, status, title (Student action)
router.get('/api/requests', requireAuth, requestController.getRequests);

// Get single request by ID (Protected)
router.get('/api/requests/:id', requireAuth, requestController.getRequestById);

// Admin: Get all requests with optional status/studentId filters
router.get('/api/admin/requests', requireAdmin, requestController.getAdminRequests);

// Admin/Student: Update request (Student can edit details if pending, Admin updates status)
router.put(
  '/api/requests/:id',
  requireAuth,
  [
    body('status').optional().isIn(['تمت الموافقة', 'قيد المراجعة', 'مرفوض']).withMessage('حالة الطلب غير صالحة'),
    body('title').optional().notEmpty().withMessage('عنوان الطلب لا يمكن أن يكون فارغاً'),
    body('reason').optional().notEmpty().withMessage('السبب لا يمكن أن يكون فارغاً')
  ],
  requestController.updateRequestStatus
);

// Admin: Update request status directly via standard admin endpoint (for compatibility)
router.put(
  '/api/admin/requests/:id',
  requireAdmin,
  [
    body('status').notEmpty().isIn(['تمت الموافقة', 'قيد المراجعة', 'مرفوض']).withMessage('حالة الطلب غير صالحة')
  ],
  requestController.updateRequestStatus
);

// Admin/Student: Delete request
router.delete('/api/requests/:id', requireAuth, requestController.deleteRequest);

// ==========================================
// 5. Announcements CRUD Operations
// ==========================================

// Get announcements target level/group (Public / Student view)
router.get('/api/announcements', announcementController.getAnnouncements);

// Get single announcement by ID
router.get('/api/announcements/:id', announcementController.getAnnouncementById);

// Admin: Create a new announcement
router.post(
  '/api/admin/announcements',
  requireAdmin,
  [
    body('message').notEmpty().withMessage('محتوى التنبيه مطلوب')
  ],
  announcementController.addAnnouncement
);

// Admin: Update an announcement
router.put(
  '/api/admin/announcements/:id',
  requireAdmin,
  [
    body('message').optional().notEmpty().withMessage('محتوى التنبيه لا يمكن أن يكون فارغاً')
  ],
  announcementController.updateAnnouncement
);

// Admin: Delete an announcement
router.delete('/api/admin/announcements/:id', requireAdmin, announcementController.deleteAnnouncement);

// ==========================================
// 6. Grades, Attendance, Schedule (Backward Compatibility)
// ==========================================

// Get grades by studentId query param
router.get('/api/grades', gradeController.getGrades);

// Admin: Set grades for a student
router.post('/api/admin/grades', requireAdmin, gradeController.setGrades);

// Get attendance by studentId query param
router.get('/api/attendance', attendanceController.getAttendance);

// Get schedule (filtered by level and group)
router.get('/api/schedule', scheduleController.getSchedule);

// Admin: Add Schedule details
router.post('/api/admin/schedule', requireAdmin, scheduleController.addSchedule);

// Admin: Add Attendance record
router.post('/api/admin/attendance', requireAdmin, attendanceController.addAttendance);

// Admin: Upload Attendance CSV
router.post('/api/admin/upload-attendance', requireAdmin, upload.single('file'), attendanceController.uploadAttendance);

// Admin: Upload Schedule File (Image/PDF)
router.post('/api/admin/upload-schedule', requireAdmin, upload.single('file'), scheduleController.uploadSchedule);

module.exports = router;
