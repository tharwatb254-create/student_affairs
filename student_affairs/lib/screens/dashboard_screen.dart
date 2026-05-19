import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../services/language_service.dart';
import 'attendance_screen.dart';
import 'grades_screen.dart';
import 'affairs_screen.dart';
import 'profile_screen.dart';
import 'schedule_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  late Future<List<dynamic>> _announcementsFuture;
  final currentUser = ApiService.currentUser;

  @override
  void initState() {
    super.initState();
    _announcementsFuture = ApiService.getAnnouncements();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: Text(
          LanguageService.get('نظام شؤون الطلاب (BIS)', 'BIS Student Affairs'),
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF004AAD),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.language_rounded),
            tooltip: LanguageService.get('تغيير اللغة', 'Change Language'),
            onPressed: () {
              LanguageService.toggleLanguage();
            },
          ),
          IconButton(
            icon: const Icon(Icons.notifications_active_rounded),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text(LanguageService.get('لا توجد إشعارات جديدة', 'No new notifications'))),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.account_circle_rounded),
            onPressed: () {
              Navigator.push(context, MaterialPageRoute(builder: (context) => const ProfileScreen()));
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          setState(() {
            _announcementsFuture = ApiService.getAnnouncements();
          });
          await _announcementsFuture;
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Padding(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // User Greeting Card
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [
                        Color(0xFF004AAD), // Blue
                        Color(0xFF00B14F), // Green
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF004AAD).withOpacity(0.3),
                        blurRadius: 15,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                        ),
                        child: const CircleAvatar(
                          radius: 35,
                          backgroundColor: Color(0xFFF8F9FA),
                          child: Icon(Icons.person_rounded, size: 45, color: Color(0xFF004AAD)),
                        ),
                      ),
                      const SizedBox(width: 20),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              LanguageService.get('مرحباً، ${currentUser?['name'] ?? 'طالب'}', 'Welcome, ${currentUser?['name'] ?? 'Student'}'),
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                '${currentUser?['level'] ?? ''} - ${currentUser?['group'] ?? ''}',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),
                Text(
                  LanguageService.get('الخدمات الأكاديمية', 'Academic Services'),
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF004AAD),
                  ),
                ),
                const SizedBox(height: 20),
                // Grid of Services
                GridView.count(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisCount: 2,
                  crossAxisSpacing: 20,
                  mainAxisSpacing: 20,
                  children: [
                    _buildServiceCard(
                      context,
                      title: LanguageService.get('الغياب والحضور', 'Attendance'),
                      icon: Icons.event_note_rounded,
                      color: const Color(0xFF004AAD), // Blue
                      onTap: () {
                        Navigator.push(context, MaterialPageRoute(builder: (context) => const AttendanceScreen()));
                      },
                    ),
                    _buildServiceCard(
                      context,
                      title: LanguageService.get('الدرجات والنتائج', 'Grades & Results'),
                      icon: Icons.insights_rounded,
                      color: const Color(0xFF00B14F), // Green
                      onTap: () {
                        Navigator.push(context, MaterialPageRoute(builder: (context) => const GradesScreen()));
                      },
                    ),
                    _buildServiceCard(
                      context,
                      title: LanguageService.get('الشؤون الداخلية', 'Student Affairs'),
                      icon: Icons.assured_workload_rounded,
                      color: const Color(0xFF00B14F), // Green
                      onTap: () {
                        Navigator.push(context, MaterialPageRoute(builder: (context) => const AffairsScreen()));
                      },
                    ),
                    _buildServiceCard(
                      context,
                      title: LanguageService.get('الجدول الدراسي', 'Schedule'),
                      icon: Icons.calendar_month_rounded,
                      color: const Color(0xFF004AAD), // Blue
                      onTap: () {
                        Navigator.push(context, MaterialPageRoute(builder: (context) => const ScheduleScreen()));
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 32),
                Text(
                  LanguageService.get('آخر الأخبار والإعلانات لجروبك', 'Latest Announcements'),
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF004AAD),
                  ),
                ),
                const SizedBox(height: 16),
                FutureBuilder<List<dynamic>>(
                  future: _announcementsFuture,
                  builder: (context, snapshot) {
                    if (snapshot.connectionState == ConnectionState.waiting) {
                      return const Center(child: CircularProgressIndicator());
                    } else if (snapshot.hasError) {
                      return Text(
                        LanguageService.get('خطأ في تحميل التنبيهات', 'Error loading announcements'),
                        style: const TextStyle(color: Colors.red),
                      );
                    } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
                      return Text(
                        LanguageService.get('لا توجد تنبيهات جديدة', 'No new announcements'),
                      );
                    }

                    return Column(
                      children: snapshot.data!.map((announcement) {
                        return _buildNewsCard(
                          title: announcement['message'],
                          date: announcement['date'],
                          icon: Icons.campaign_rounded,
                          color: const Color(0xFF004AAD),
                        );
                      }).toList(),
                    );
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildServiceCard(BuildContext context, {required String title, required IconData icon, required Color color, required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: color.withOpacity(0.08),
              spreadRadius: 2,
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
          border: Border.all(color: color.withOpacity(0.1), width: 1.5),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 36, color: color),
            ),
            const SizedBox(height: 16),
            Text(
              title,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: color.withOpacity(0.9),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNewsCard({required String title, required String date, required IconData icon, required Color color}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: color, size: 28),
        ),
        title: Text(
          title,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 8.0),
          child: Text(date, style: TextStyle(color: Colors.grey.shade600, fontWeight: FontWeight.w500)),
        ),
      ),
    );
  }
}
