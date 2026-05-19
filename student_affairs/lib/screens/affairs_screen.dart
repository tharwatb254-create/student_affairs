import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'request_form_screen.dart';

class AffairsScreen extends StatefulWidget {
  const AffairsScreen({super.key});

  @override
  State<AffairsScreen> createState() => _AffairsScreenState();
}

class _AffairsScreenState extends State<AffairsScreen> {
  late Future<List<dynamic>> _requestsFuture;

  @override
  void initState() {
    super.initState();
    _fetchRequests();
  }

  void _fetchRequests() {
    setState(() {
      _requestsFuture = ApiService.getRequests();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('الشؤون الداخلية والطلبات', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF004AAD),
        elevation: 0,
      ),
      body: Container(
        color: const Color(0xFFF8F9FA),
        child: RefreshIndicator(
          onRefresh: () async {
            _fetchRequests();
            await _requestsFuture;
          },
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              const Text(
                'تقديم طلب جديد',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF004AAD)),
              ),
              const SizedBox(height: 20),
              _buildRequestActionCard(
                context,
                title: 'إفادة قيد (إثبات قيد)',
                icon: Icons.description_rounded,
                color: const Color(0xFF004AAD),
              ),
              _buildRequestActionCard(
                context,
                title: 'طلب تأجيل الخدمة العسكرية',
                icon: Icons.military_tech_rounded,
                color: const Color(0xFF00B14F),
              ),
              _buildRequestActionCard(
                context,
                title: 'طلب تخفيض رسوم دراسية',
                icon: Icons.savings_rounded,
                color: const Color(0xFF004AAD),
              ),
              _buildRequestActionCard(
                context,
                title: 'استخراج كارنيه بدل فاقد',
                icon: Icons.badge_rounded,
                color: const Color(0xFF00B14F),
              ),
              
              const SizedBox(height: 32),
              const Text(
                'طلباتي السابقة',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF004AAD)),
              ),
              const SizedBox(height: 20),
              FutureBuilder<List<dynamic>>(
                future: _requestsFuture,
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const Center(child: CircularProgressIndicator());
                  } else if (snapshot.hasError) {
                    return const Center(child: Text('خطأ في تحميل الطلبات', style: TextStyle(color: Colors.red)));
                  } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
                    return const Center(child: Text('لا توجد طلبات سابقة'));
                  }

                  final requests = snapshot.data!;
                  return Column(
                    children: requests.map((req) {
                      return _buildRequestHistoryTile(
                        req['title'] ?? 'طلب',
                        req['status'] ?? 'غير معروف',
                        req['date'] ?? '',
                        req['status'] == 'تمت الموافقة' ? const Color(0xFF00B14F) : Colors.orange,
                      );
                    }).toList(),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRequestActionCard(BuildContext context, {required String title, required IconData icon, required Color color}) {
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
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () async {
            await Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => RequestFormScreen(requestTitle: title)),
            );
            // Refresh list after returning from form
            _fetchRequests();
          },
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(icon, color: color, size: 28),
                ),
                const SizedBox(width: 20),
                Expanded(
                  child: Text(
                    title,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.black87),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(Icons.arrow_forward_ios_rounded, size: 16, color: Colors.grey.shade600),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildRequestHistoryTile(String title, String status, String date, Color statusColor) {
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
        leading: const Icon(Icons.history_rounded, color: Colors.grey, size: 30),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 8.0),
          child: Row(
            children: [
              const Icon(Icons.calendar_today_rounded, size: 14, color: Colors.grey),
              const SizedBox(width: 6),
              Text(date, style: TextStyle(color: Colors.grey.shade600, fontWeight: FontWeight.w500)),
            ],
          ),
        ),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: statusColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: statusColor.withOpacity(0.5)),
          ),
          child: Text(
            status,
            style: TextStyle(color: statusColor, fontWeight: FontWeight.bold, fontSize: 12),
          ),
        ),
      ),
    );
  }
}
