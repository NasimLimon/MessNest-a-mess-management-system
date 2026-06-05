const { dbGet, dbAll, dbRun } = require('../config/database');

exports.recordPayment = async (req, res) => {
  try {
    const { memberId, billId, amount, paymentMethod = 'cash' } = req.body;

    if (!memberId || !billId || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const bill = await dbGet('SELECT total_amount FROM bills WHERE id = ?', [billId]);
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    const result = await dbRun(
      `INSERT INTO payments (member_id, bill_id, amount, payment_method, status)
       VALUES (?, ?, ?, ?, ?)`,
      [memberId, billId, amount, paymentMethod, 'completed']
    );

    res.json({ message: 'Payment recorded successfully', id: result.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPayments = async (req, res) => {
  try {
    const { memberId, billId, month } = req.query;

    let query = `SELECT p.id, p.member_id, p.bill_id, p.amount, p.payment_date,
                        p.payment_method, p.status, m.full_name, b.month, b.total_amount
                 FROM payments p
                 JOIN members m ON p.member_id = m.id
                 JOIN bills b ON p.bill_id = b.id
                 WHERE 1=1`;
    const params = [];

    if (memberId) {
      query += ` AND p.member_id = ?`;
      params.push(memberId);
    }

    if (billId) {
      query += ` AND p.bill_id = ?`;
      params.push(billId);
    }

    if (month) {
      query += ` AND b.month = ?`;
      params.push(month);
    }

    query += ` ORDER BY p.payment_date DESC`;

    const payments = await dbAll(query, params);
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPaymentHistory = async (req, res) => {
  try {
    const { memberId } = req.params;

    const history = await dbAll(
      `SELECT p.id, p.bill_id, p.amount, p.payment_date, p.payment_method, p.status,
              b.month, b.total_amount
       FROM payments p
       JOIN bills b ON p.bill_id = b.id
       WHERE p.member_id = ?
       ORDER BY p.payment_date DESC`,
      [memberId]
    );

    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMemberBillStatus = async (req, res) => {
  try {
    const { memberId } = req.params;

    const bills = await dbAll(
      `SELECT b.id, b.month, b.total_amount, COALESCE(SUM(p.amount), 0) as paid_amount
       FROM bills b
       LEFT JOIN payments p ON b.id = p.bill_id AND p.status = 'completed'
       WHERE b.member_id = ?
       GROUP BY b.id
       ORDER BY b.month DESC`,
      [memberId]
    );

    const processed = bills.map(bill => ({
      ...bill,
      due_amount: Math.max(0, bill.total_amount - bill.paid_amount),
      status: bill.paid_amount >= bill.total_amount ? 'paid' : 'pending'
    }));

    res.json(processed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPaymentSummary = async (req, res) => {
  try {
    const { month } = req.query;

    let query = `SELECT COUNT(*) as total_transactions,
                        SUM(amount) as total_collected,
                        COUNT(DISTINCT member_id) as members_paid
                 FROM payments
                 WHERE status = 'completed'`;
    const params = [];

    if (month) {
      query += ` AND DATE_FORMAT(payment_date, '%Y-%m') = ?`;
      params.push(month);
    }

    const summary = await dbGet(query, params);

    res.json({
      total_transactions: summary?.total_transactions || 0,
      total_collected: summary?.total_collected || 0,
      members_paid: summary?.members_paid || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
