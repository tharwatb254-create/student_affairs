import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import '../services/api_service.dart';
import '../services/language_service.dart';
import 'welcome_screen.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 4,
      child: Scaffold(
        appBar: AppBar(
          title: Text(
            LanguageService.get('لوحة تحكم الإدارة', 'Admin Dashboard'),
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          backgroundColor: const Color(0xFF004AAD),
          foregroundColor: Colors.white,
          actions: [
            IconButton(
              icon: const Icon(Icons.language_rounded),
              tooltip: LanguageService.get('تغيير اللغة', 'Change Language'),
              onPressed: () {
                LanguageService.toggleLanguage();
              },
            ),
            IconButton(
              icon: const Icon(Icons.logout),
              onPressed: () {
                ApiService.currentUser = null;
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (context) => const WelcomeScreen()),
                  (route) => false,
                );
              },
            )
          ],
          bottom: TabBar(
            labelColor: Colors.white,
            unselectedLabelColor: Colors.white70,
            indicatorColor: const Color(0xFF00B14F),
            tabs: [
              Tab(text: LanguageService.get('الطلبات', 'Requests'), icon: const Icon(Icons.assignment)),
              Tab(text: LanguageService.get('الجداول', 'Schedules'), icon: const Icon(Icons.calendar_month)),
              Tab(text: LanguageService.get('التنبيهات', 'Announcements'), icon: const Icon(Icons.campaign)),
              Tab(text: LanguageService.get('الغياب', 'Attendance'), icon: const Icon(Icons.rule)),
            ],
          ),
        ),
        body: const TabBarView(
          children: [
            AdminRequestsTab(),
            AdminScheduleTab(),
            AdminAnnouncementsTab(),
            AdminAttendanceTab(),
          ],
        ),
      ),
    );
  }
}

// ---------------------- REQUESTS TAB ----------------------
class AdminRequestsTab extends StatefulWidget {
  const AdminRequestsTab({super.key});

  @override
  State<AdminRequestsTab> createState() => _AdminRequestsTabState();
}

class _AdminRequestsTabState extends State<AdminRequestsTab> {
  late Future<List<dynamic>> _adminRequestsFuture;

  @override
  void initState() {
    super.initState();
    _fetchAdminRequests();
  }

  void _fetchAdminRequests() {
    setState(() {
      _adminRequestsFuture = ApiService.getAdminRequests();
    });
  }

  void _updateStatus(String id, String currentStatus) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('تحديث حالة الطلب'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildStatusOption(id, 'تمت الموافقة', Colors.green),
              _buildStatusOption(id, 'مرفوض', Colors.red),
              _buildStatusOption(id, 'قيد المراجعة', Colors.orange),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('إلغاء')),
          ],
        );
      },
    );
  }

  Widget _buildStatusOption(String id, String status, Color color) {
    return ListTile(
      title: Text(status, style: TextStyle(color: color, fontWeight: FontWeight.bold)),
      onTap: () async {
        Navigator.pop(context);
        final success = await ApiService.updateRequestStatus(id, status);
        if (success) {
          if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('تم التحديث'), backgroundColor: Colors.green));
          _fetchAdminRequests();
        }
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<dynamic>>(
      future: _adminRequestsFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
          return const Center(child: Text('لا توجد طلبات حالياً'));
        }

        final requests = snapshot.data!;
        return RefreshIndicator(
          onRefresh: () async { _fetchAdminRequests(); await _adminRequestsFuture; },
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: requests.length,
            itemBuilder: (context, index) {
              final req = requests[index];
              final status = req['status'] ?? 'غير معروف';
              Color statusColor = status == 'تمت الموافقة' ? Colors.green : (status == 'مرفوض' ? Colors.red : Colors.orange);

              return Card(
                margin: const EdgeInsets.only(bottom: 16),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(req['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Color(0xFF004AAD))),
                          Text(status, style: TextStyle(color: statusColor, fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const Divider(),
                      Text('الطالب: ${req['studentName']} (${req['studentId']})'),
                      Text('التاريخ: ${req['date']}'),
                      if (req['reason'] != null) Text('السبب: ${req['reason']}'),
                      ElevatedButton(onPressed: () => _updateStatus(req['id'], status), child: const Text('تحديث الحالة')),
                    ],
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }
}

// ---------------------- SCHEDULE TAB ----------------------
class AdminScheduleTab extends StatefulWidget {
  const AdminScheduleTab({super.key});
  @override
  State<AdminScheduleTab> createState() => _AdminScheduleTabState();
}

class _AdminScheduleTabState extends State<AdminScheduleTab> {
  final _formKey = GlobalKey<FormState>();
  String _level = 'الفرقة الأولى';
  String _group = 'جروب 1';
  final _dayController = TextEditingController();
  final _timeController = TextEditingController();
  final _subjectController = TextEditingController();
  final _hallController = TextEditingController();
  bool _isLoading = false;

  void _submitSchedule() async {
    if (_formKey.currentState!.validate()) {
      setState(() => _isLoading = true);
      final success = await ApiService.addSchedule({
        'level': _level, 'group': _group,
        'day': _dayController.text, 'time': _timeController.text,
        'subject': _subjectController.text, 'hall': _hallController.text,
      });
      setState(() => _isLoading = false);
      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('تمت الإضافة بنجاح'), backgroundColor: Colors.green));
        _formKey.currentState!.reset();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Form(
        key: _formKey,
        child: Column(
          children: [
            const Text('إضافة محاضرة للجدول', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _level,
              decoration: const InputDecoration(labelText: 'الفرقة', border: OutlineInputBorder()),
              items: ['الفرقة الأولى', 'الفرقة الثانية', 'الفرقة الثالثة', 'الفرقة الرابعة'].map((l) => DropdownMenuItem(value: l, child: Text(l))).toList(),
              onChanged: (val) => setState(() => _level = val!),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _group,
              decoration: const InputDecoration(labelText: 'الجروب', border: OutlineInputBorder()),
              items: ['جروب 1', 'جروب 2', 'جروب 3', 'جروب 4', 'جروب 5'].map((g) => DropdownMenuItem(value: g, child: Text(g))).toList(),
              onChanged: (val) => setState(() => _group = val!),
            ),
            const SizedBox(height: 16),
            TextFormField(controller: _dayController, decoration: const InputDecoration(labelText: 'اليوم (مثال: الأحد)', border: OutlineInputBorder()), validator: (v) => v!.isEmpty ? '*' : null),
            const SizedBox(height: 16),
            TextFormField(controller: _timeController, decoration: const InputDecoration(labelText: 'الموعد (مثال: 09:00 - 11:00)', border: OutlineInputBorder()), validator: (v) => v!.isEmpty ? '*' : null),
            const SizedBox(height: 16),
            TextFormField(controller: _subjectController, decoration: const InputDecoration(labelText: 'المادة', border: OutlineInputBorder()), validator: (v) => v!.isEmpty ? '*' : null),
            const SizedBox(height: 16),
            TextFormField(controller: _hallController, decoration: const InputDecoration(labelText: 'المكان', border: OutlineInputBorder()), validator: (v) => v!.isEmpty ? '*' : null),
            const SizedBox(height: 24),
            ElevatedButton(onPressed: _isLoading ? null : _submitSchedule, child: const Text('إضافة المحاضرة')),
            const SizedBox(height: 24),
            const Divider(),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _isLoading ? null : () async {
                FilePickerResult? result = await FilePicker.pickFiles(type: FileType.custom, allowedExtensions: ['jpg', 'png', 'pdf']);
                if (result != null) {
                  setState(() => _isLoading = true);
                  final bytes = result.files.first.bytes;
                  final name = result.files.first.name;
                  if (bytes != null) {
                    final success = await ApiService.uploadScheduleFile(bytes, name, _level, _group);
                    if (success && mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('تم رفع ملف الجدول بنجاح'), backgroundColor: Colors.green));
                  }
                  setState(() => _isLoading = false);
                }
              },
              icon: const Icon(Icons.upload_file),
              label: const Text('رفع ملف جدول (صورة أو PDF) للفرقة المحددة'),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.orange, foregroundColor: Colors.white),
            )
          ],
        ),
      ),
    );
  }
}

// ---------------------- ANNOUNCEMENTS TAB ----------------------
class AdminAnnouncementsTab extends StatefulWidget {
  const AdminAnnouncementsTab({super.key});
  @override
  State<AdminAnnouncementsTab> createState() => _AdminAnnouncementsTabState();
}

class _AdminAnnouncementsTabState extends State<AdminAnnouncementsTab> {
  final _formKey = GlobalKey<FormState>();
  String _level = 'الفرقة الأولى';
  String _group = 'جروب 1';
  final _messageController = TextEditingController();
  bool _isLoading = false;

  void _submitAnnouncement() async {
    if (_formKey.currentState!.validate()) {
      setState(() => _isLoading = true);
      final success = await ApiService.addAnnouncement({
        'level': _level, 'group': _group, 'message': _messageController.text,
      });
      setState(() => _isLoading = false);
      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('تم إرسال التنبيه'), backgroundColor: Colors.green));
        _messageController.clear();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Form(
        key: _formKey,
        child: Column(
          children: [
            const Text('إرسال تنبيه مخصص', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _level,
              decoration: const InputDecoration(labelText: 'الفرقة', border: OutlineInputBorder()),
              items: ['الفرقة الأولى', 'الفرقة الثانية', 'الفرقة الثالثة', 'الفرقة الرابعة'].map((l) => DropdownMenuItem(value: l, child: Text(l))).toList(),
              onChanged: (val) => setState(() => _level = val!),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _group,
              decoration: const InputDecoration(labelText: 'الجروب', border: OutlineInputBorder()),
              items: ['جروب 1', 'جروب 2', 'جروب 3', 'جروب 4', 'جروب 5'].map((g) => DropdownMenuItem(value: g, child: Text(g))).toList(),
              onChanged: (val) => setState(() => _group = val!),
            ),
            const SizedBox(height: 16),
            TextFormField(controller: _messageController, maxLines: 4, decoration: const InputDecoration(labelText: 'نص التنبيه', border: OutlineInputBorder()), validator: (v) => v!.isEmpty ? '*' : null),
            const SizedBox(height: 24),
            ElevatedButton(onPressed: _isLoading ? null : _submitAnnouncement, child: const Text('إرسال التنبيه')),
          ],
        ),
      ),
    );
  }
}

// ---------------------- ATTENDANCE TAB ----------------------
class AdminAttendanceTab extends StatefulWidget {
  const AdminAttendanceTab({super.key});
  @override
  State<AdminAttendanceTab> createState() => _AdminAttendanceTabState();
}

class _AdminAttendanceTabState extends State<AdminAttendanceTab> {
  final _formKey = GlobalKey<FormState>();
  final _studentIdController = TextEditingController();
  final _subjectController = TextEditingController();
  final _absencesController = TextEditingController();
  final _totalController = TextEditingController();
  bool _isLoading = false;

  void _submitAttendance() async {
    if (_formKey.currentState!.validate()) {
      setState(() => _isLoading = true);
      final success = await ApiService.addAttendance({
        'studentId': _studentIdController.text,
        'subject': _subjectController.text,
        'absences': int.tryParse(_absencesController.text) ?? 0,
        'totalLectures': int.tryParse(_totalController.text) ?? 1,
      });
      setState(() => _isLoading = false);
      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('تم تسجيل الغياب بنجاح'), backgroundColor: Colors.green));
        _formKey.currentState!.reset();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Form(
        key: _formKey,
        child: Column(
          children: [
            const Text('تسجيل غياب طالب', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            TextFormField(controller: _studentIdController, decoration: const InputDecoration(labelText: 'رقم قيد الطالب', border: OutlineInputBorder()), validator: (v) => v!.isEmpty ? '*' : null),
            const SizedBox(height: 16),
            TextFormField(controller: _subjectController, decoration: const InputDecoration(labelText: 'المادة', border: OutlineInputBorder()), validator: (v) => v!.isEmpty ? '*' : null),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(child: TextFormField(controller: _absencesController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'عدد الغياب', border: OutlineInputBorder()), validator: (v) => v!.isEmpty ? '*' : null)),
                const SizedBox(width: 16),
                Expanded(child: TextFormField(controller: _totalController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'إجمالي المحاضرات', border: OutlineInputBorder()), validator: (v) => v!.isEmpty ? '*' : null)),
              ],
            ),
            const SizedBox(height: 24),
            ElevatedButton(onPressed: _isLoading ? null : _submitAttendance, child: const Text('حفظ الغياب')),
            const SizedBox(height: 24),
            const Divider(),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _isLoading ? null : () async {
                FilePickerResult? result = await FilePicker.pickFiles(type: FileType.custom, allowedExtensions: ['csv']);
                if (result != null) {
                  setState(() => _isLoading = true);
                  final bytes = result.files.first.bytes;
                  final name = result.files.first.name;
                  if (bytes != null) {
                    final success = await ApiService.uploadAttendanceCsv(bytes, name);
                    if (success && mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('تم رفع وتحديث الغياب بنجاح'), backgroundColor: Colors.green));
                  }
                  setState(() => _isLoading = false);
                }
              },
              icon: const Icon(Icons.upload_file),
              label: const Text('رفع شيت غياب (CSV) للكل'),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.orange, foregroundColor: Colors.white),
            )
          ],
        ),
      ),
    );
  }
}
