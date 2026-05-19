const Request = require('../models/Request');
const User = require('../models/User');

// Get student requests (filtered by studentId, status, title)
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

// Submit a new request
exports.createRequest = async (req, res) => {
  try {
    const { title, reason, studentId } = req.body;
    if (!title || !studentId) {
      return res.status(400).json({ success: false, message: 'العنوان ومعرف الطالب مطلوبان' });
    }

    const user = await User.findOne({ username: studentId });
    const studentName = user ? user.name : 'طالب';

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

    res.status(201).json({ message: 'تم إرسال الطلب بنجاح', request: responseRequest });
  } catch (error) {
    console.error('Error submitting request:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء إرسال الطلب' });
  }
};

// Admin: Get all requests (with optional filters)
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

// Admin: Update request status
exports.updateRequestStatus = async (req, res) => {
  try {
    const requestId = req.params.id;
    const { status } = req.body;

    const updatedRequest = await Request.findByIdAndUpdate(
      requestId,
      { status },
      { new: true }
    );

    if (updatedRequest) {
      const responseRequest = {
        id: updatedRequest._id.toString(),
        title: updatedRequest.title,
        reason: updatedRequest.reason,
        studentId: updatedRequest.studentId,
        studentName: updatedRequest.studentName,
        status: updatedRequest.status,
        date: new Date(updatedRequest.createdAt).toLocaleDateString('ar-EG')
      };
      res.json({ success: true, message: 'تم تحديث حالة الطلب', request: responseRequest });
    } else {
      res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    }
  } catch (error) {
    console.error('Error updating request status:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء تحديث الطلب' });
  }
};
