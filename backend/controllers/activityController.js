const { query } = require('../config/database');

exports.getActivityLogs = async (req, res) => {
  try {
    const { userId, action, limit = 100 } = req.query;
    let sql = `SELECT al.id, al.user_id, al.username, al.action, al.details, al.ip_address, al.user_agent, al.created_at
      FROM activity_logs al`;
    const params = [];
    const filters = [];

    if (userId) {
      filters.push('al.user_id = ?');
      params.push(userId);
    }
    if (action) {
      filters.push('al.action LIKE ?');
      params.push(`%${action}%`);
    }
    if (filters.length) {
      sql += ` WHERE ${filters.join(' AND ')}`;
    }
    const maxRows = parseInt(limit, 10) || 100;
    sql += ` ORDER BY al.created_at DESC LIMIT ${maxRows}`;

    const logs = await query(sql, params);
    res.json({ success: true, data: logs });
  } catch (err) {
    console.error('Activity log retrieval error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
