const { query } = require('../config/database');

exports.submitComplaint = async (req, res) => {
  try {
    const { memberId, title, description, complaintType } = req.body;
    if (!memberId || !title || !description || !complaintType) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
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

exports.getAllComplaints = async (req, res) => {
  try {
    const complaints = await query(
      `SELECT c.*, m.full_name FROM complaints c JOIN members m ON c.member_id = m.id ORDER BY c.status ASC, c.created_at DESC`
    );
    res.json({ success: true, data: complaints });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getComplaintById = async (req, res) => {
  try {
    const complaints = await query(
      `SELECT c.*, m.full_name FROM complaints c JOIN members m ON c.member_id = m.id WHERE c.id = ?`,
      [req.params.id]
    );
    if (complaints.length === 0) {
      return res.status(404).json({ success: false, error: 'Complaint not found' });
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
    const complaints = await query(
      'SELECT * FROM complaints WHERE member_id = ? ORDER BY created_at DESC',
      [req.params.memberId]
    );
    res.json({ success: true, data: complaints });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
