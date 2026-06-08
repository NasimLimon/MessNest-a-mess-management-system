const { query } = require('../config/database');

const getMemberIdByUserId = async (userId) => {
  const rows = await query('SELECT id FROM members WHERE user_id = ?', [userId]);
  return rows[0]?.id || null;
};

exports.submitComplaint = async (req, res) => {
  try {
    let { memberId, title, description, complaintType } = req.body;
    if (!title || !description || !complaintType) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    if (req.user.role === 'member') {
      memberId = await getMemberIdByUserId(req.user.id);
      if (!memberId) {
        return res.status(404).json({ success: false, error: 'Member profile not found' });
      }
    }

    if (!memberId) {
      return res.status(400).json({ success: false, error: 'Member ID required' });
    }

    const result = await query(
      'INSERT INTO complaints (member_id, title, description, complaint_type, status) VALUES (?, ?, ?, ?, ?)',
      [memberId, title, description, complaintType, 'open']
    );
    res.status(201).json({ success: true, message: 'Complaint submitted successfully', data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getComplaints = async (req, res) => {
  try {
    const { status, complaintType } = req.query;
    const conditions = [];
    const params = [];

    if (req.user.role === 'member') {
      const memberId = await getMemberIdByUserId(req.user.id);
      if (!memberId) {
        return res.status(404).json({ success: false, error: 'Member profile not found' });
      }
      conditions.push('c.member_id = ?');
      params.push(memberId);
    }
    if (status) {
      conditions.push('c.status = ?');
      params.push(status);
    }
    if (complaintType) {
      conditions.push('c.complaint_type = ?');
      params.push(complaintType);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const complaints = await query(
      `SELECT c.*, m.full_name as member_name FROM complaints c JOIN members m ON c.member_id = m.id ${where} ORDER BY c.status ASC, c.created_at DESC`,
      params
    );
    res.json({ success: true, data: complaints });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getComplaintById = async (req, res) => {
  try {
    const complaints = await query(
      `SELECT c.*, m.full_name as member_name FROM complaints c JOIN members m ON c.member_id = m.id WHERE c.id = ?`,
      [req.params.id]
    );
    if (complaints.length === 0) {
      return res.status(404).json({ success: false, error: 'Complaint not found' });
    }

    if (req.user.role === 'member') {
      const memberId = await getMemberIdByUserId(req.user.id);
      if (complaints[0].member_id !== memberId) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
    }

    res.json({ success: true, data: complaints[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateComplaint = async (req, res) => {
  try {
    const { status, response } = req.body;
    const resolvedBy = req.user?.id || 1;
    const resolvedAt = status === 'resolved' || status === 'closed' ? new Date() : null;
    await query(
      'UPDATE complaints SET status = ?, response = ?, resolved_by = ?, resolved_at = ? WHERE id = ?',
      [status, response || null, resolvedBy, resolvedAt, req.params.id]
    );
    res.json({ success: true, message: 'Complaint updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getMemberComplaints = async (req, res) => {
  try {
    const { memberId } = req.params;
    if (req.user.role === 'member') {
      const currentMemberId = await getMemberIdByUserId(req.user.id);
      if (parseInt(memberId, 10) !== currentMemberId) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
    }
    const complaints = await query(
      'SELECT * FROM complaints WHERE member_id = ? ORDER BY created_at DESC',
      [memberId]
    );
    res.json({ success: true, data: complaints });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
