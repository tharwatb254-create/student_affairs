import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart' show kIsWeb;
import 'dart:io' show Platform;

class ApiService {
  // ----------------------------------------------------
  // Configurations for backend URL:
  // - Emulator: Use 'http://10.0.2.2:3000/api'
  // - Physical Device: Use your computer's local IP 'http://172.20.10.4:3000/api'
  // ----------------------------------------------------
  static const String _localComputerIp = '172.20.10.4'; 
  static const bool _useEmulator = false; // Set to true if you switch back to the Android Emulator

  static String get baseUrl {
    if (kIsWeb) {
      return 'http://localhost:3000/api';
    } else if (Platform.isAndroid) {
      return _useEmulator ? 'http://10.0.2.2:3000/api' : 'http://$_localComputerIp:3000/api';
    } else {
      return 'http://localhost:3000/api';
    }
  }

  // Get all students
  static Future<List<dynamic>> getStudents() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/students'));
      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to load students');
      }
    } catch (e) {
      print('Error fetching students: $e');
      return [];
    }
  }

  // Get grades
  static Future<Map<String, dynamic>?> getGrades() async {
    try {
      final studentId = currentUser?['username'] ?? '';
      final response = await http.get(Uri.parse('$baseUrl/grades?studentId=$studentId'));
      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to load grades');
      }
    } catch (e) {
      print('Error fetching grades: $e');
      return null;
    }
  }

  // Get attendance
  static Future<List<dynamic>> getAttendance() async {
    try {
      final studentId = currentUser?['username'] ?? ''; // Using username as studentId
      final response = await http.get(Uri.parse('$baseUrl/attendance?studentId=$studentId'));
      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to load attendance');
      }
    } catch (e) {
      print('Error fetching attendance: $e');
      return [];
    }
  }

  // Get profile
  static Future<Map<String, dynamic>?> getProfile() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/profile'));
      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
    } catch (e) {
      print('Error fetching profile: $e');
    }
    return null;
  }

  // Get requests for current student
  static Future<List<dynamic>> getRequests() async {
    try {
      final studentId = currentUser?['username'] ?? '';
      final response = await http.get(Uri.parse('$baseUrl/requests?studentId=$studentId'));
      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to load requests');
      }
    } catch (e) {
      print('Error fetching requests: $e');
      return [];
    }
  }

  // Submit request
  static Future<bool> submitRequest(Map<String, dynamic> requestData) async {
    try {
      requestData['studentId'] = currentUser?['username'] ?? '';
      final response = await http.post(
        Uri.parse('$baseUrl/requests'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(requestData),
      );
      return response.statusCode == 201;
    } catch (e) {
      print('Error submitting request: $e');
      return false;
    }
  }

  // Get schedule
  static Future<List<dynamic>> getSchedule() async {
    try {
      final level = currentUser?['level'] ?? '';
      final group = currentUser?['group'] ?? '';
      final response = await http.get(Uri.parse('$baseUrl/schedule?level=$level&group=$group'));
      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
    } catch (e) {
      print('Error fetching schedule: $e');
    }
    return [];
  }

  // Get announcements
  static Future<List<dynamic>> getAnnouncements() async {
    try {
      final level = currentUser?['level'] ?? '';
      final group = currentUser?['group'] ?? '';
      final response = await http.get(Uri.parse('$baseUrl/announcements?level=$level&group=$group'));
      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
    } catch (e) {
      print('Error fetching announcements: $e');
    }
    return [];
  }

  // Admin: Add Schedule
  static Future<bool> addSchedule(Map<String, dynamic> scheduleData) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/admin/schedule'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(scheduleData),
      );
      return response.statusCode == 201;
    } catch (e) {
      print('Error adding schedule: $e');
      return false;
    }
  }

  // admin: Add Announcement
  static Future<bool> addAnnouncement(Map<String, dynamic> announcementData) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/admin/announcements'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(announcementData),
      );
      return response.statusCode == 201;
    } catch (e) {
      print('Error adding announcement: $e');
      return false;
    }
  }

  // Admin: Add Attendance
  static Future<bool> addAttendance(Map<String, dynamic> attendanceData) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/admin/attendance'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(attendanceData),
      );
      return response.statusCode == 201;
    } catch (e) {
      print('Error adding attendance: $e');
      return false;
    }
  }

  // Admin: Upload Attendance CSV
  static Future<bool> uploadAttendanceCsv(List<int> fileBytes, String fileName) async {
    try {
      var request = http.MultipartRequest('POST', Uri.parse('$baseUrl/admin/upload-attendance'));
      request.files.add(http.MultipartFile.fromBytes('file', fileBytes, filename: fileName));
      var response = await request.send();
      return response.statusCode == 200;
    } catch (e) {
      print('Error uploading attendance CSV: $e');
      return false;
    }
  }

  // Admin: Upload Schedule File
  static Future<bool> uploadScheduleFile(List<int> fileBytes, String fileName, String level, String group) async {
    try {
      var request = http.MultipartRequest('POST', Uri.parse('$baseUrl/admin/upload-schedule'));
      request.fields['level'] = level;
      request.fields['group'] = group;
      request.files.add(http.MultipartFile.fromBytes('file', fileBytes, filename: fileName));
      var response = await request.send();
      return response.statusCode == 201;
    } catch (e) {
      print('Error uploading schedule file: $e');
      return false;
    }
  }

  static Map<String, dynamic>? currentUser;

  // Login
  static Future<Map<String, dynamic>?> login(String username, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/login'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'username': username, 'password': password}),
      );
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        currentUser = data['user'];
        return data;
      } else if (response.statusCode == 401) {
        return json.decode(response.body);
      }
    } catch (e) {
      print('Error logging in: $e');
    }
    return null;
  }

  // Register
  static Future<Map<String, dynamic>?> register(Map<String, dynamic> userData) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/register'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(userData),
      );
      if (response.statusCode == 201 || response.statusCode == 400) {
        return json.decode(response.body);
      }
    } catch (e) {
      print('Error registering: $e');
    }
    return null;
  }

  // Admin: Get all requests
  static Future<List<dynamic>> getAdminRequests() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/admin/requests'));
      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
    } catch (e) {
      print('Error fetching admin requests: $e');
    }
    return [];
  }

  // Admin: Update request status
  static Future<bool> updateRequestStatus(String requestId, String status) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/admin/requests/$requestId'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'status': status}),
      );
      return response.statusCode == 200;
    } catch (e) {
      print('Error updating request status: $e');
      return false;
    }
  }
}
