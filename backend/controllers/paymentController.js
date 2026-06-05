const { query } = require('../config/database');

exports.recordPayment = async (req, res) => {
  try {
    const { memberId, billId, amount, paymentMethod = 'cash' } = req.body;
    if (!memberId || !billId || !amount) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    const result = await query(
      'INSERT INTO payments (member_id, bill_id, amount, payment_method, status) VALUES (?, ?, ?, ?, ?)',
      [memberId, billId, amount, paymentMethod, 'completed']
    );
    res.status(201).json({ success: true, message: 'Payment recorded successfully', data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getAllPayments = async (req, res) => {
  try {
    const payments = await query(
      `SELECT p.*, m.full_name, b.month FROM payments p JOIN members m ON p.member_id = m.id JOIN bills b ON p.bill_id = b.id ORDER BY p.payment_date DESC`
    );
    res.json({ success: true, data: payments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getMemberPaymentHistory = async (req, res) => {
  try {
    const payments = await query(
      `SELECT p.*, b.month, b.total_amount FROM payments p JOIN bills b ON p.bill_id = b.id WHERE p.member_id = ? ORDER BY p.payment_date DESC`,
      [req.params.memberId]
    );
    res.json({ success: true, data: payments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getMemberBillStatus = async (req, res) => {
  try {
    const bills = await query(
      `SELECT b.*, COALESCE(SUM(p.amount), 0) as paid_amount, (b.total_amount - COALESCE(SUM(p.amount), 0)) as pending_amount FROM bills b LEFT JOIN payments p ON b.id = p.bill_id WHERE b.member_id = ? GROUP BY b.id ORDER BY b.month DESC`,
      [req.params.memberId]
    );
    res.json({ success: true, data: bills });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
