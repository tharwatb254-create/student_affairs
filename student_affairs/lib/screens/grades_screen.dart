import 'package:flutter/material.dart';
import '../services/api_service.dart';

class GradesScreen extends StatefulWidget {
  const GradesScreen({super.key});

  @override
  State<GradesScreen> createState() => _GradesScreenState();
}

class _GradesScreenState extends State<GradesScreen> {
  late Future<Map<String, dynamic>?> _gradesFuture;

  @override
  void initState() {
    super.initState();
    _gradesFuture = ApiService.getGrades();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('الدرجات والنتائج', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF004AAD),
        elevation: 0,
      ),
      body: FutureBuilder<Map<String, dynamic>?>(
        future: _gradesFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          } else if (snapshot.hasError) {
            return Center(child: Text('حدث خطأ: ${snapshot.error}', style: const TextStyle(color: Colors.red)));
          } else if (!snapshot.hasData || snapshot.data == null) {
            return const Center(child: Text('لا توجد بيانات للدرجات', style: TextStyle(fontSize: 18)));
          }

          final gradesData = snapshot.data!;
          final courses = gradesData['courses'] as List<dynamic>;

          return Container(
            color: const Color(0xFFF8F9FA),
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.02),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildGPACard('المعدل التراكمي (CGPA)', gradesData['cgpa'], const Color(0xFF004AAD), Icons.workspace_premium_rounded),
                      Container(width: 1, height: 60, color: Colors.grey.shade200),
                      _buildGPACard('معدل الفصل الدراسي', gradesData['semesterGpa'], const Color(0xFF00B14F), Icons.trending_up_rounded),
                    ],
                  ),
                ),
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.all(20),
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.school_rounded, color: Color(0xFF004AAD)),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              gradesData['semester'],
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF004AAD)),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      ...courses.map((course) {
                        return _buildGradeTile(course['subject'], course['grade'], course['marks']);
                      }).toList(),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildGPACard(String label, String value, Color color, IconData icon) {
    return Column(
      children: [
        Icon(icon, color: color, size: 28),
        const SizedBox(height: 8),
        Text(
          value,
          style: TextStyle(
            fontSize: 32,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          label,
          style: TextStyle(
            fontSize: 13,
            color: Colors.grey.shade600,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget _buildGradeTile(String subject, String grade, String marks) {
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
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFF004AAD).withOpacity(0.05),
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Icon(Icons.menu_book_rounded, color: Color(0xFF004AAD)),
        ),
        title: Text(subject, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                const Text('الدرجة', style: TextStyle(fontSize: 11, color: Colors.grey)),
                Text(
                  marks,
                  style: const TextStyle(color: Colors.black87, fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(width: 16),
            Container(
              width: 50,
              height: 50,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: _getGradeColor(grade).withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: _getGradeColor(grade).withOpacity(0.3)),
              ),
              child: Text(
                grade,
                style: TextStyle(
                  color: _getGradeColor(grade),
                  fontWeight: FontWeight.w900,
                  fontSize: 20,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _getGradeColor(String grade) {
    if (grade.startsWith('A')) return const Color(0xFF00B14F); // Green
    if (grade.startsWith('B')) return const Color(0xFF004AAD); // Blue
    if (grade.startsWith('C')) return Colors.orange;
    if (grade.startsWith('D')) return Colors.deepOrange;
    return Colors.red;
  }
}
