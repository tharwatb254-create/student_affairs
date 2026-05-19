import 'package:flutter/material.dart';
import '../services/api_service.dart';

class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({super.key});

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  late Future<List<dynamic>> _attendanceFuture;

  @override
  void initState() {
    super.initState();
    _attendanceFuture = ApiService.getAttendance();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('سجل الحضور والغياب', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF004AAD),
        elevation: 0,
      ),
      body: FutureBuilder<List<dynamic>>(
        future: _attendanceFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          } else if (snapshot.hasError) {
            return Center(child: Text('حدث خطأ: ${snapshot.error}', style: const TextStyle(color: Colors.red)));
          } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return const Center(child: Text('لا توجد بيانات للغياب', style: TextStyle(fontSize: 18)));
          }

          final attendanceData = snapshot.data!;

          return Container(
            color: const Color(0xFFF8F9FA),
            child: ListView.builder(
              padding: const EdgeInsets.all(20),
              itemCount: attendanceData.length,
              itemBuilder: (context, index) {
                final subject = attendanceData[index];
                return _buildSubjectAttendanceTile(
                  subject['subject'],
                  subject['absences'],
                  subject['totalLectures'],
                );
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildSubjectAttendanceTile(String subject, int absences, int totalLectures) {
    double attendanceRate = ((totalLectures - absences) / totalLectures) * 100;
    
    // Color logic based on attendance
    Color statusColor;
    if (attendanceRate >= 80) {
      statusColor = const Color(0xFF00B14F); // Green
    } else if (attendanceRate >= 60) {
      statusColor = const Color(0xFF004AAD); // Blue
    } else {
      statusColor = Colors.redAccent;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(Icons.menu_book_rounded, color: statusColor, size: 24),
                    const SizedBox(width: 12),
                    Text(
                      subject,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    '${attendanceRate.toStringAsFixed(1)}%',
                    style: TextStyle(color: statusColor, fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Divider(color: Colors.grey.shade200, height: 1),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildStatItem('المحاضرات', totalLectures.toString(), Icons.play_lesson_rounded),
                _buildStatItem('الحضور', (totalLectures - absences).toString(), Icons.how_to_reg_rounded),
                _buildStatItem('الغياب', absences.toString(), Icons.person_off_rounded),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(icon, color: Colors.grey.shade400, size: 20),
        const SizedBox(height: 8),
        Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20, color: Color(0xFF004AAD))),
        const SizedBox(height: 4),
        Text(label, style: TextStyle(color: Colors.grey.shade600, fontSize: 13, fontWeight: FontWeight.w500)),
      ],
    );
  }
}
