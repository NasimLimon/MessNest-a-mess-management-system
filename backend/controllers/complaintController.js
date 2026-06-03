const { dbGet, dbAll, dbRun } = require('../config/database');

exports.submitComplaint = async (req, res) => {
  try {
    const { title, description, complaintType } = req.body;

    if (!title || !description || !complaintType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get member_id from user
    const member = await dbGet('SELECT id FROM members WHERE user_id = ?', [req.user.id]);
    if (!member) {
      return res.status(404).json({ error: 'Member profile not found' });
    }

    const result = await dbRun(
      `INSERT INTO complaints (member_id, title, description, complaint_type, status)
       VALUES (?, ?, ?, ?, ?)`,
      [member.id, title, description, complaintType, 'open']
    );

    res.json({ message: 'Complaint submitted successfully', id: result.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getComplaints = async (req, res) => {
  try {
    const { status, complaintType } = req.query;

    let query = `SELECT c.*, m.full_name as member_name, u.username as resolved_by_name
                 FROM complaints c
                 JOIN members m ON c.member_id = m.id
                 LEFT JOIN users u ON c.resolved_by = u.id
                 WHERE 1=1`;
    const params = [];

    if (status) {
      query += ` AND c.status = ?`;
      params.push(status);
    }

    if (complaintType) {
      query += ` AND c.complaint_type = ?`;
      params.push(complaintType);
    }

    query += ` ORDER BY c.created_at DESC`;

    const complaints = await dbAll(query, params);
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;

    const complaint = await dbGet(
      `SELECT c.*, m.full_name as member_name, u.username as resolved_by_name
       FROM complaints c
       JOIN members m ON c.member_id = m.id
       LEFT JOIN users u ON c.resolved_by = u.id
       WHERE c.id = ?`,
      [id]
    );

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    res.json(complaint);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, response } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status required' });
    }

    const updates = ['status = ?'];
    const values = [status];

    if (response) {
      updates.push('response = ?');
      values.push(response);
    }

    if (status === 'resolved' || status === 'closed') {
      updates.push('resolved_at = CURRENT_TIMESTAMP');
      updates.push('resolved_by = ?');
      values.push(req.user.id);
    }

    values.push(id);

    await dbRun(
      `UPDATE complaints SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.json({ message: 'Complaint status updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMemberComplaints = async (req, res) => {
  try {
    const { memberId } = req.params;

    const complaints = await dbAll(
      `SELECT id, title, complaint_type, status, created_at, resolved_at
       FROM complaints
       WHERE member_id = ?
       ORDER BY created_at DESC`,
      [memberId]
    );

    res.json(complaints);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
