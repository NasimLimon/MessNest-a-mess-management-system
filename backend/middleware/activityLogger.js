const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const sanitizeBody = (body) => {
  const sanitized = { ...body };
  if ('password' in sanitized) sanitized.password = '***';
  if ('newPassword' in sanitized) sanitized.newPassword = '***';
  if ('confirmPassword' in sanitized) sanitized.confirmPassword = '***';
  return sanitized;
};

const activityLogger = async (req, res, next) => {
  let userId = null;
  let username = null;
  const token = req.headers.authorization?.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      userId = decoded.id;
      username = decoded.username;
    } catch (err) {
     
    }
  }

  const action = `${req.method} ${req.originalUrl}`;
  const details = JSON.stringify(sanitizeBody(req.body || {}));
  const ipAddress = req.ip || req.connection?.remoteAddress || null;
  const userAgent = req.headers['user-agent'] || null;

  try {
    await query(
      'INSERT INTO activity_logs (user_id, username, action, details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, username, action, details, ipAddress, userAgent]
    );
  } catch (err) {
    console.error('Failed to record activity log:', err.message);
  }

  next();
};

module.exports = activityLogger;
