const { query } = require('../config/database');

const getMemberIdByUserId = async (userId) => {
  const rows = await query('SELECT id FROM members WHERE user_id = ?', [userId]);
  return rows[0]?.id || null;
};

exports.recordPayment = async (req, res) => {
  try {
    let { memberId, billId, amount, paymentMethod = 'cash' } = req.body;

    if (!billId || !amount) {
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

    const payment = await query(
      'INSERT INTO payments (member_id, bill_id, amount, payment_method, status) VALUES (?, ?, ?, ?, ?)',
      [memberId, billId, amount, paymentMethod, 'completed']
    );

    res.status(201).json({ success: true, message: 'Payment recorded successfully', data: payment });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getAllPayments = async (req, res) => {
  try {
    let { memberId, billId, month } = req.query;
    const conditions = [];
    const params = [];

    if (req.user.role === 'member') {
      const currentMemberId = await getMemberIdByUserId(req.user.id);
      if (!currentMemberId) {
        return res.status(404).json({ success: false, error: 'Member profile not found' });
      }
      memberId = currentMemberId;
    }

    if (memberId) {
      conditions.push('p.member_id = ?');
      params.push(memberId);
    }
    if (billId) {
      conditions.push('p.bill_id = ?');
      params.push(billId);
    }
    if (month) {
      conditions.push('b.month = ?');
      params.push(month);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const payments = await query(
      `SELECT p.*, m.full_name, b.month FROM payments p JOIN members m ON p.member_id = m.id JOIN bills b ON p.bill_id = b.id ${where} ORDER BY p.payment_date DESC`,
      params
    );
    res.json({ success: true, data: payments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getMemberPaymentHistory = async (req, res) => {
  try {
    let memberId = req.params.memberId;
    if (req.user.role === 'member') {
      const currentMemberId = await getMemberIdByUserId(req.user.id);
      if (!currentMemberId) {
        return res.status(404).json({ success: false, error: 'Member profile not found' });
      }
      if (memberId && parseInt(memberId, 10) !== currentMemberId) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
      memberId = currentMemberId;
    }

    const payments = await query(
      `SELECT p.*, b.month, b.total_amount FROM payments p JOIN bills b ON p.bill_id = b.id WHERE p.member_id = ? ORDER BY p.payment_date DESC`,
      [memberId]
    );
    res.json({ success: true, data: payments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updatePayment = async (req, res) => {
  try {
    const { amount, status } = req.body;
    if (amount === undefined && status === undefined) {
      return res.status(400).json({ success: false, error: 'Nothing to update' });
    }

    const payments = await query('SELECT * FROM payments WHERE id = ?', [req.params.paymentId]);
    if (payments.length === 0) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    const updates = [];
    const params = [];
    if (amount !== undefined) {
      updates.push('amount = ?');
      params.push(amount);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }

    params.push(req.params.paymentId);
    await query(`UPDATE payments SET ${updates.join(', ')} WHERE id = ?`, params);

    res.json({ success: true, message: 'Payment updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getMemberBillStatus = async (req, res) => {
  try {
    let memberId = req.params.memberId;
    if (req.user.role === 'member') {
      const currentMemberId = await getMemberIdByUserId(req.user.id);
      if (!currentMemberId) {
        return res.status(404).json({ success: false, error: 'Member profile not found' });
      }
      if (memberId && parseInt(memberId, 10) !== currentMemberId) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
      memberId = currentMemberId;
    }

    const bills = await query(
      `SELECT b.*, COALESCE(SUM(p.amount), 0) as paid_amount, (b.total_amount - COALESCE(SUM(p.amount), 0)) as due_amount, CASE WHEN COALESCE(SUM(p.amount),0) >= b.total_amount THEN 'paid' WHEN COALESCE(SUM(p.amount),0) > 0 THEN 'partial' ELSE 'unpaid' END as status FROM bills b LEFT JOIN payments p ON b.id = p.bill_id AND p.status = 'completed' WHERE b.member_id = ? GROUP BY b.id ORDER BY b.month DESC`,
      [memberId]
    );
    res.json({ success: true, data: bills });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
