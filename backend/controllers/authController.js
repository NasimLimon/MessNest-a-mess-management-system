const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

exports.register = async (req, res) => {
  try {
    const { username, email, password, role = 'member', fullName } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existing = await query('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const result = await query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, role]
    );

    if (role === 'member') {
      await query(
        'INSERT INTO members (user_id, full_name) VALUES (?, ?)',
        [result.insertId, fullName || username]
      );
    }

    const token = jwt.sign(
      { id: result.insertId, username, email, role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: { id: result.insertId, username, email, role }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const users = await query('SELECT * FROM users WHERE (username = ? OR email = ?) AND deleted_at IS NULL', [username, username]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const users = await query('SELECT id, username, email, role FROM users WHERE id = ? AND deleted_at IS NULL', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, data: users[0] });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    // Soft-delete user
    await query('UPDATE users SET deleted_at = NOW() WHERE id = ?', [userId]);

    // Soft-delete member profile and mark inactive
    await query('UPDATE members SET deleted_at = NOW(), status = ? WHERE user_id = ?', ['inactive', userId]);

    // If member exists, soft-delete related member records
    const members = await query('SELECT id FROM members WHERE user_id = ?', [userId]);
    if (members.length > 0) {
      const memberId = members[0].id;
      await query('UPDATE meals SET deleted_at = NOW() WHERE member_id = ?', [memberId]);
      await query('UPDATE bills SET deleted_at = NOW() WHERE member_id = ?', [memberId]);
      await query('UPDATE payments SET deleted_at = NOW() WHERE member_id = ?', [memberId]);
      await query('UPDATE complaints SET deleted_at = NOW() WHERE member_id = ?', [memberId]);
    }

    // Soft-delete other user-created content
    await query('UPDATE activity_logs SET deleted_at = NOW() WHERE user_id = ?', [userId]);
    await query('UPDATE notices SET deleted_at = NOW() WHERE created_by = ?', [userId]);
    await query('UPDATE expenses SET deleted_at = NOW() WHERE created_by = ?', [userId]);

    res.json({ success: true, message: 'Account scheduled for deletion (soft deleted)' });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
