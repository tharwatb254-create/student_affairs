require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');

// Import Models
const User = require('./models/User');
const Grade = require('./models/Grade');
const Attendance = require('./models/Attendance');
const Request = require('./models/Request');
const Schedule = require('./models/Schedule');
const Announcement = require('./models/Announcement');

const seedData = async () => {
  try {
    await connectDB();

    // 1. Clear Existing Data
    console.log('Clearing old database records...');
    await User.deleteMany({});
    await Grade.deleteMany({});
    await Attendance.deleteMany({});
    await Request.deleteMany({});
    await Schedule.deleteMany({});
    await Announcement.deleteMany({});

    console.log('Seeding new data...');

    // 2. Seed Users (Admin & Students)
    const admin = await User.create({
      username: 'admin',
      password: 'admin123',
      name: 'مدير النظام',
      role: 'admin'
    });

    const student1 = await User.create({
      username: '20230145',
      password: 'student123',
      name: 'أحمد محمود',
      role: 'student',
      level: 'الفرقة الثالثة',
      group: 'جروب 1'
    });

    const student2 = await User.create({
      username: '20230146',
      password: 'student123',
      name: 'محمد علي',
      role: 'student',
      level: 'الفرقة الثانية',
      group: 'جروب 1'
    });

    const student3 = await User.create({
      username: '20230147',
      password: 'student123',
      name: 'سارة أحمد',
      role: 'student',
      level: 'الفرقة الأولى',
      group: 'جروب 2'
    });

    console.log('✓ Users seeded.');

    // 3. Seed Grades (linked to studentId)
    await Grade.create({
      studentId: '20230145',
      cgpa: '3.45',
      semesterGpa: '3.60',
      semester: 'الفصل الدراسي الأول - 2025/2026',
      courses: [
        { subject: 'نظم التشغيل', grade: 'A-', marks: '88' },
        { subject: 'قواعد البيانات', grade: 'A', marks: '95' },
        { subject: 'هيكلة البيانات', grade: 'B+', marks: '82' },
        { subject: 'مبادئ الإدارة', grade: 'A', marks: '91' },
        { subject: 'الرياضيات المتقطعة', grade: 'B', marks: '75' }
      ]
    });

    await Grade.create({
      studentId: '20230146',
      cgpa: '2.80',
      semesterGpa: '3.00',
      semester: 'الفصل الدراسي الأول - 2025/2026',
      courses: [
        { subject: 'نظم التشغيل', grade: 'B', marks: '78' },
        { subject: 'قواعد البيانات', grade: 'C+', marks: '68' },
        { subject: 'مبادئ الإدارة', grade: 'B+', marks: '83' }
      ]
    });

    console.log('✓ Grades seeded.');

    // 4. Seed Attendance (linked to studentId)
    await Attendance.create([
      { studentId: '20230145', subject: 'نظم التشغيل', absences: 2, totalLectures: 10 },
      { studentId: '20230145', subject: 'قواعد البيانات', absences: 1, totalLectures: 10 },
      { studentId: '20230146', subject: 'نظم التشغيل', absences: 4, totalLectures: 10 }
    ]);

    console.log('✓ Attendance seeded.');

    // 5. Seed Schedule
    await Schedule.create([
      { level: 'الفرقة الأولى', group: 'جروب 1', day: 'الأحد', time: '09:00 ص - 11:00 ص', subject: 'مقدمة حاسبات', hall: 'مدرج أ', isFile: false },
      { level: 'الفرقة الثالثة', group: 'جروب 1', day: 'الأحد', time: '09:00 ص - 11:00 ص', subject: 'نظم التشغيل', hall: 'مدرج أ', isFile: false },
      { level: 'الفرقة الثالثة', group: 'جروب 1', day: 'الإثنين', time: '11:00 ص - 01:00 م', subject: 'قواعد البيانات', hall: 'معمل 3', isFile: false }
    ]);

    console.log('✓ Schedule seeded.');

    // 6. Seed Announcements
    await Announcement.create([
      { level: 'الفرقة الثالثة', group: 'جروب 1', message: 'تم تغيير ميعاد محاضرة قواعد البيانات لتكون يوم الثلاثاء' }
    ]);

    console.log('✓ Announcements seeded.');

    // 7. Seed Requests
    await Request.create([
      { title: 'إفادة قيد', reason: 'تقديم للتدريب الصيفي', studentId: '20230145', studentName: 'أحمد محمود', status: 'تمت الموافقة' },
      { title: 'تخفيض رسوم دراسية', reason: 'ظروف اجتماعية والمساعدة الاجتماعية', studentId: '20230145', studentName: 'أحمد محمود', status: 'قيد المراجعة' }
    ]);

    console.log('✓ Requests seeded.');
    console.log('Database Seeding Completed Successfully! 🎉');
    
    // Close the connection
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
