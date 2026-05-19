const jwt = require('jsonwebtoken');

// Define secret key (fallback to default string for dev)
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_student_affairs_key_2026';

// Middleware to authenticate any logged in user
exports.requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'تسجيل الدخول مطلوب للوصول إلى هذا الرابط'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach decoded user info to the request object
    req.user = decoded;
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'جلسة العمل منتهية أو التوكن غير صالح، يرجى تسجيل الدخول مرة أخرى'
    });
  }
};

// Middleware to enforce Admin role
exports.requireAdmin = (req, res, next) => {
  // First ensure user is authenticated
  exports.requireAuth(req, res, () => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: 'غير مسموح! هذه الصلاحية للمدراء فقط'
      });
    }
  });
};

// Middleware to enforce Student role
exports.requireStudent = (req, res, next) => {
  exports.requireAuth(req, res, () => {
    if (req.user && req.user.role === 'student') {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: 'غير مسموح! هذه الصلاحية للطلاب فقط'
      });
    }
  });
};

// Export JWT secret for controllers to sign tokens
exports.JWT_SECRET = JWT_SECRET;
