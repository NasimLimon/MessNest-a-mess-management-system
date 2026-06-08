const { query } = require('../config/database');

const getMemberIdByUserId = async (userId) => {
  const rows = await query('SELECT id FROM members WHERE user_id = ?', [userId]);
  return rows[0]?.id || null;
};

exports.getCurrentMember = async (req, res) => {
  try {
    const memberId = await getMemberIdByUserId(req.user.id);
    if (!memberId) {
      return res.status(404).json({ success: false, error: 'Member profile not found' });
    }
    const members = await query(
      `SELECT m.*, u.username, u.email FROM members m JOIN users u ON m.user_id = u.id WHERE m.id = ?`,
      [memberId]
    );
    res.json({ success: true, data: members[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getAllMembers = async (req, res) => {
  try {
    const members = await query(
      `SELECT m.*, u.username, u.email FROM members m JOIN users u ON m.user_id = u.id WHERE m.status = 'active'`
    );
    res.json({ success: true, data: members });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getMemberById = async (req, res) => {
  try {
    const { id } = req.params;
    const members = await query(
      `SELECT m.*, u.username, u.email FROM members m JOIN users u ON m.user_id = u.id WHERE m.id = ?`,
      [id]
    );
    if (members.length === 0) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }

    if (req.user.role !== 'admin') {
      const currentMemberId = await getMemberIdByUserId(req.user.id);
      if (currentMemberId !== parseInt(id, 10)) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
    }

    res.json({ success: true, data: members[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.addMember = async (req, res) => {
  try {
    const { username, email, password, fullName, phone } = req.body;

    if (!username || !email || !password || !fullName) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const existing = await query('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, error: 'Username or email already exists' });
    }

    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync(password, 10);

    const userResult = await query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, 'member']
    );

    const memberResult = await query(
      'INSERT INTO members (user_id, full_name, phone, status) VALUES (?, ?, ?, ?)',
      [userResult.insertId, fullName, phone || null, 'active']
    );

    res.status(201).json({
      success: true,
      message: 'Member added successfully',
      data: { id: memberResult.insertId, user_id: userResult.insertId }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateMember = async (req, res) => {
  try {
    const { fullName, phone, status } = req.body;
    await query(
      'UPDATE members SET full_name = ?, phone = ?, status = ? WHERE id = ?',
      [fullName, phone, status || 'active', req.params.id]
    );

    res.json({ success: true, message: 'Member updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteMember = async (req, res) => {
  try {
    const members = await query('SELECT user_id FROM members WHERE id = ?', [req.params.id]);
    if (members.length === 0) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }

    await query('DELETE FROM users WHERE id = ?', [members[0].user_id]);
    res.json({ success: true, message: 'Member deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
