const Request = require('../models/Request');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// 1. Create a request (Student action)
exports.createRequest = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
    }

    const { title, reason, studentId } = req.body;

    const user = await User.findOne({ username: studentId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'عذراً، الطالب صاحب هذا الطلب غير مسجل بالنظام' });
    }
    
    const studentName = user.name;

    const newRequest = await Request.create({
      title,
      reason,
      studentId,
      studentName,
      status: 'قيد المراجعة'
    });

    const responseRequest = {
      id: newRequest._id.toString(),
      title: newRequest.title,
      reason: newRequest.reason,
      studentId: newRequest.studentId,
      studentName: newRequest.studentName,
      status: newRequest.status,
      date: new Date(newRequest.createdAt).toLocaleDateString('ar-EG')
    };

    res.status(201).json({ success: true, message: 'تم إرسال الطلب بنجاح', request: responseRequest });
  } catch (error) {
    console.error('Error submitting request:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء إرسال الطلب' });
  }
};

// 2. Read Requests (For student / general filters)
exports.getRequests = async (req, res) => {
  try {
    const { studentId, status, title } = req.query;
    let query = {};

    if (studentId) {
      query.studentId = studentId;
    }
    if (status) {
      query.status = status;
    }
    if (title) {
      query.title = { $regex: title, $options: 'i' };
    }

    const requests = await Request.find(query).sort({ createdAt: -1 });
    const mappedRequests = requests.map(r => ({
      id: r._id.toString(),
      title: r.title,
      reason: r.reason,
      studentId: r.studentId,
      studentName: r.studentName,
      status: r.status,
      date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('ar-EG') : new Date().toLocaleDateString('ar-EG')
    }));

    res.status(200).json(mappedRequests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في جلب الطلبات' });
  }
};

// 3. Read All Requests (Admin view)
exports.getAdminRequests = async (req, res) => {
  try {
    const { status, studentId } = req.query;
    let query = {};

    if (status) {
      query.status = status;
    }
    if (studentId) {
      query.studentId = studentId;
    }

    const requests = await Request.find(query).sort({ createdAt: -1 });
    const mappedRequests = requests.map(r => ({
      id: r._id.toString(),
      title: r.title,
      reason: r.reason,
      studentId: r.studentId,
      studentName: r.studentName,
      status: r.status,
      date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('ar-EG') : new Date().toLocaleDateString('ar-EG')
    }));

    res.status(200).json(mappedRequests);
  } catch (error) {
    console.error('Error fetching admin requests:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء جلب طلبات المدير' });
  }
};

// 4. Read Single Request by ID
exports.getRequestById = async (req, res) => {
  try {
    const requestId = req.params.id;
    
    // Check if valid Mongo ID structure first to avoid crash
    if (!requestId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'معرف الطلب غير صحيح كصيغة' });
    }

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'عذراً، الطلب المطلوب غير موجود بالنظام (404)' });
    }

    res.status(200).json({
      id: request._id.toString(),
      title: request.title,
      reason: request.reason,
      studentId: request.studentId,
      studentName: request.studentName,
      status: request.status,
      date: new Date(request.createdAt).toLocaleDateString('ar-EG')
    });
  } catch (error) {
    console.error('Error fetching request by ID:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في جلب بيانات الطلب' });
  }
};

// 5. Update Request (PUT /api/requests/:id or PUT /api/admin/requests/:id)
exports.updateRequestStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
    }

    const requestId = req.params.id;
    const { status, title, reason } = req.body;

    if (!requestId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'معرف الطلب غير صحيح كصيغة' });
    }

    const existingRequest = await Request.findById(requestId);
    if (!existingRequest) {
      return res.status(404).json({ success: false, message: 'عذراً، الطلب المطلوب تعديله غير موجود بالنظام (404)' });
    }

    // Update logic
    if (status) {
      existingRequest.status = status;
    }
    if (title) {
      // If student updates title, ensure it's still pending
      if (existingRequest.status !== 'قيد المراجعة' && !status) {
        return res.status(400).json({ success: false, message: 'لا يمكن تعديل الطلب بعد مراجعته من قبل الإدارة' });
      }
      existingRequest.title = title;
    }
    if (reason) {
      if (existingRequest.status !== 'قيد المراجعة' && !status) {
        return res.status(400).json({ success: false, message: 'لا يمكن تعديل الطلب بعد مراجعته من قبل الإدارة' });
      }
      existingRequest.reason = reason;
    }

    await existingRequest.save();

    const responseRequest = {
      id: existingRequest._id.toString(),
      title: existingRequest.title,
      reason: existingRequest.reason,
      studentId: existingRequest.studentId,
      studentName: existingRequest.studentName,
      status: existingRequest.status,
      date: new Date(existingRequest.createdAt).toLocaleDateString('ar-EG')
    };

    res.json({ success: true, message: 'تم تحديث الطلب بنجاح', request: responseRequest });
  } catch (error) {
    console.error('Error updating request status:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء تحديث الطلب' });
  }
};

// 6. Delete Request
exports.deleteRequest = async (req, res) => {
  try {
    const requestId = req.params.id;

    if (!requestId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'معرف الطلب غير صحيح كصيغة' });
    }

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'عذراً، الطلب المطلوب حذفه غير موجود بالنظام (404)' });
    }

    await Request.deleteOne({ _id: requestId });

    res.status(200).json({
      success: true,
      message: 'تم حذف الطلب بنجاح'
    });
  } catch (error) {
    console.error('Error deleting request:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء حذف الطلب' });
  }
};
