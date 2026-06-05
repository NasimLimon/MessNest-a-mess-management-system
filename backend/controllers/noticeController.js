const { query } = require('../config/database');

exports.postNotice = async (req, res) => {
  try {
    const { title, content, priority = 'medium', expiresAt } = req.body;
    const createdBy = req.user?.id || 1;
    if (!title || !content) {
      return res.status(400).json({ success: false, error: 'Title and content required' });
    }
    const result = await query(
      'INSERT INTO notices (title, content, created_by, priority, expires_at) VALUES (?, ?, ?, ?, ?)',
      [title, content, createdBy, priority, expiresAt || null]
    );
    res.status(201).json({ success: true, message: 'Notice posted successfully', data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getAllNotices = async (req, res) => {
  try {
    const notices = await query(
      `SELECT n.*, u.username FROM notices n JOIN users u ON n.created_by = u.id WHERE n.expires_at IS NULL OR n.expires_at > NOW() ORDER BY n.priority DESC, n.created_at DESC`
    );
    res.json({ success: true, data: notices });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getNoticeById = async (req, res) => {
  try {
    const notices = await query(
      'SELECT * FROM notices WHERE id = ?',
      [req.params.id]
    );
    if (notices.length === 0) {
      return res.status(404).json({ success: false, error: 'Notice not found' });
    }
    res.json({ success: true, data: notices[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteNotice = async (req, res) => {
  try {
    await query('DELETE FROM notices WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Notice deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
