const { query } = require('../config/database');

exports.generateBills = async (req, res) => {
  try {
    const { month } = req.body;
    if (!month) {
      return res.status(400).json({ success: false, error: 'Month required' });
    }
    const members = await query('SELECT id FROM members WHERE status = "active"');
    const settings = await query('SELECT * FROM settings LIMIT 1');
    const mealRate = settings[0]?.meal_rate || 100;
    const fixedCost = settings[0]?.monthly_fixed_cost || 500;

    for (const member of members) {
      const mealData = await query(
        `SELECT COUNT(*) as meal_count FROM meals WHERE member_id = ? AND DATE_FORMAT(meal_date, '%Y-%m') = ?`,
        [member.id, month]
      );
      const mealCount = mealData[0]?.meal_count || 0;
      const totalAmount = (mealCount * mealRate) + fixedCost;
      await query(
        `INSERT INTO bills (member_id, month, meal_count, meal_rate, fixed_cost, total_amount) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE meal_count = VALUES(meal_count), total_amount = VALUES(total_amount)`,
        [member.id, month, mealCount, mealRate, fixedCost, totalAmount]
      );
    }
    res.json({ success: true, message: `Bills generated for ${month}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getAllBills = async (req, res) => {
  try {
    const bills = await query(
      `SELECT b.*, m.full_name FROM bills b JOIN members m ON b.member_id = m.id ORDER BY b.month DESC`
    );
    res.json({ success: true, data: bills });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getBillDetails = async (req, res) => {
  try {
    const bills = await query(
      `SELECT b.*, m.full_name FROM bills b JOIN members m ON b.member_id = m.id WHERE b.id = ?`,
      [req.params.billId]
    );
    if (bills.length === 0) {
      return res.status(404).json({ success: false, error: 'Bill not found' });
    }
    res.json({ success: true, data: bills[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateCharges = async (req, res) => {
  try {
    const { extraCharges } = req.body;
    const bills = await query('SELECT total_amount FROM bills WHERE id = ?', [req.params.billId]);
    if (bills.length === 0) {
      return res.status(404).json({ success: false, error: 'Bill not found' });
    }
    const newTotal = bills[0].total_amount + (extraCharges || 0);
    await query(
      'UPDATE bills SET extra_charges = ?, total_amount = ? WHERE id = ?',
      [extraCharges || 0, newTotal, req.params.billId]
    );
    res.json({ success: true, message: 'Bill updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getMessStats = async (req, res) => {
  try {
    const stats = await query(
      `SELECT COUNT(DISTINCT m.id) as total_members, COUNT(DISTINCT b.id) as total_bills, SUM(b.total_amount) as total_revenue, AVG(b.total_amount) as avg_bill_amount FROM members m LEFT JOIN bills b ON m.id = b.member_id`
    );
    res.json({ success: true, data: stats[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
