import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/api_service.dart';

class ScheduleScreen extends StatefulWidget {
  const ScheduleScreen({super.key});

  @override
  State<ScheduleScreen> createState() => _ScheduleScreenState();
}

class _ScheduleScreenState extends State<ScheduleScreen> {
  late Future<List<dynamic>> _scheduleFuture;

  @override
  void initState() {
    super.initState();
    _scheduleFuture = ApiService.getSchedule();
  }

  void _openFile(String path) async {
    String url = ApiService.baseUrl.replaceAll('/api', '') + path;
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('تعذر فتح الملف')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('الجدول الدراسي', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF004AAD),
        elevation: 0,
      ),
      body: FutureBuilder<List<dynamic>>(
        future: _scheduleFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          } else if (snapshot.hasError) {
            return const Center(child: Text('خطأ في تحميل الجدول'));
          } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return const Center(child: Text('لا يوجد جدول متاح حالياً'));
          }

          final schedule = snapshot.data!;

          return Container(
            color: const Color(0xFFF8F9FA),
            child: ListView.builder(
              padding: const EdgeInsets.all(20),
              itemCount: schedule.length,
              itemBuilder: (context, index) {
                final session = schedule[index];

                if (session['isFile'] == true) {
                  return InkWell(
                    onTap: () => _openFile(session['fileUrl']),
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 16),
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.orange.shade300),
                        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
                      ),
                      child: const Column(
                        children: [
                          Icon(Icons.insert_photo_rounded, size: 48, color: Colors.orange),
                          SizedBox(height: 16),
                          Text('تم رفع ملف للجدول الدراسي', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                          Text('اضغط هنا لعرض الجدول', style: TextStyle(color: Colors.grey)),
                        ],
                      ),
                    ),
                  );
                }

                return _buildScheduleTile(
                  day: session['day'] ?? '',
                  time: session['time'] ?? '',
                  subject: session['subject'] ?? '',
                  hall: session['hall'] ?? '',
                );
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildScheduleTile({required String day, required String time, required String subject, required String hall}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(color: const Color(0xFF004AAD).withOpacity(0.1)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: const Color(0xFF004AAD).withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                day,
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF004AAD)),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    subject,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.black87),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.access_time_rounded, size: 14, color: Colors.grey),
                      const SizedBox(width: 4),
                      Text(time, style: TextStyle(fontSize: 13, color: Colors.grey.shade700)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.location_on_rounded, size: 14, color: Colors.grey),
                      const SizedBox(width: 4),
                      Text(hall, style: TextStyle(fontSize: 13, color: Colors.grey.shade700)),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
