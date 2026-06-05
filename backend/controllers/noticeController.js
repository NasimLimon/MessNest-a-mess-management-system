const { dbGet, dbAll, dbRun } = require('../config/database');

exports.postNotice = async (req, res) => {
  try {
    const { title, content, priority = 'medium', expiresAt } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content required' });
    }

    const result = await dbRun(
      `INSERT INTO notices (title, content, created_by, priority, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
      [title, content, req.user.id, priority, expiresAt || null]
    );

    res.json({ message: 'Notice posted successfully', id: result.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getNotices = async (req, res) => {
  try {
    const notices = await dbAll(
      `SELECT n.*, u.username as posted_by
       FROM notices n
       JOIN users u ON n.created_by = u.id
       WHERE expires_at IS NULL OR expires_at > NOW()
       ORDER BY n.created_at DESC`
    );

    res.json(notices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getNoticeById = async (req, res) => {
  try {
    const { id } = req.params;

    const notice = await dbGet(
      `SELECT n.*, u.username as posted_by
       FROM notices n
       JOIN users u ON n.created_by = u.id
       WHERE n.id = ?`,
      [id]
    );

    if (!notice) {
      return res.status(404).json({ error: 'Notice not found' });
    }

    res.json(notice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;

    const notice = await dbGet('SELECT created_by FROM notices WHERE id = ?', [id]);
    if (!notice) {
      return res.status(404).json({ error: 'Notice not found' });
    }

    if (notice.created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await dbRun('DELETE FROM notices WHERE id = ?', [id]);
    res.json({ message: 'Notice deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
