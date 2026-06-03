const { dbGet, dbAll, dbRun } = require('../config/database');

exports.getMembers = async (req, res) => {
  try {
    const members = await dbAll(
      `SELECT m.id, m.user_id, m.full_name, m.phone, m.join_date, m.status, u.email
       FROM members m
       JOIN users u ON m.user_id = u.id
       ORDER BY m.join_date DESC`
    );
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMember = async (req, res) => {
  try {
    const { id } = req.params;
    const member = await dbGet(
      `SELECT m.id, m.user_id, m.full_name, m.phone, m.join_date, m.status, u.email
       FROM members m
       JOIN users u ON m.user_id = u.id
       WHERE m.id = ?`,
      [id]
    );
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json(member);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addMember = async (req, res) => {
  try {
    const { username, email, password, fullName, phone } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existing = await dbGet(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    if (existing) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync(password, 10);

    const userResult = await dbRun(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, 'member']
    );

    const memberResult = await dbRun(
      'INSERT INTO members (user_id, full_name, phone) VALUES (?, ?, ?)',
      [userResult.id, fullName || username, phone || '']
    );

    res.json({
      message: 'Member added successfully',
      member: { id: memberResult.id, username, email, fullName }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, phone, status } = req.body;

    const updates = [];
    const values = [];

    if (fullName) {
      updates.push('full_name = ?');
      values.push(fullName);
    }
    if (phone) {
      updates.push('phone = ?');
      values.push(phone);
    }
    if (status) {
      updates.push('status = ?');
      values.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    await dbRun(
      `UPDATE members SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.json({ message: 'Member updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const { id } = req.params;

    const member = await dbGet('SELECT user_id FROM members WHERE id = ?', [id]);
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    await dbRun('DELETE FROM users WHERE id = ?', [member.user_id]);

    res.json({ message: 'Member removed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
