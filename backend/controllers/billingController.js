const { dbGet, dbAll, dbRun } = require('../config/database');

exports.generateMonthlyBills = async (req, res) => {
  try {
    const { month } = req.body;

    if (!month) {
      return res.status(400).json({ error: 'Month required (YYYY-MM)' });
    }

    const settings = await dbGet('SELECT meal_rate, monthly_fixed_cost FROM settings LIMIT 1');
    const mealRate = settings?.meal_rate || 100;
    const fixedCost = settings?.monthly_fixed_cost || 500;

    const members = await dbAll('SELECT id FROM members WHERE status = "active"');

    let billsCreated = 0;

    for (const member of members) {
      const mealCount = await dbGet(
        `SELECT COUNT(*) as count FROM meals
         WHERE member_id = ? AND strftime('%Y-%m', meal_date) = ?`,
        [member.id, month]
      );

      const existingBill = await dbGet(
        'SELECT id FROM bills WHERE member_id = ? AND month = ?',
        [member.id, month]
      );

      const totalMealCost = (mealCount?.count || 0) * mealRate;
      const totalAmount = totalMealCost + fixedCost;

      if (existingBill) {
        await dbRun(
          `UPDATE bills SET meal_count = ?, meal_rate = ?, total_amount = ?
           WHERE member_id = ? AND month = ?`,
          [(mealCount?.count || 0), mealRate, totalAmount, member.id, month]
        );
      } else {
        await dbRun(
          `INSERT INTO bills (member_id, month, meal_count, meal_rate, fixed_cost, total_amount)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [member.id, month, (mealCount?.count || 0), mealRate, fixedCost, totalAmount]
        );
      }

      billsCreated++;
    }

    res.json({
      message: `Bills generated for ${billsCreated} members`,
      month,
      billsCreated
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getBills = async (req, res) => {
  try {
    const { memberId, month } = req.query;

    let query = `SELECT b.id, b.member_id, b.month, b.meal_count, b.meal_rate,
                        b.fixed_cost, b.extra_charges, b.total_amount, b.generated_at,
                        m.full_name
                 FROM bills b
                 JOIN members m ON b.member_id = m.id
                 WHERE 1=1`;
    const params = [];

    if (memberId) {
      query += ` AND b.member_id = ?`;
      params.push(memberId);
    }

    if (month) {
      query += ` AND b.month = ?`;
      params.push(month);
    }

    query += ` ORDER BY b.month DESC, m.full_name`;

    const bills = await dbAll(query, params);
    res.json(bills);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getBillDetails = async (req, res) => {
  try {
    const { billId } = req.params;

    const bill = await dbGet(
      `SELECT b.*, m.full_name, m.phone
       FROM bills b
       JOIN members m ON b.member_id = m.id
       WHERE b.id = ?`,
      [billId]
    );

    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    const paid = await dbGet(
      `SELECT SUM(amount) as paid_amount FROM payments
       WHERE bill_id = ? AND status = 'completed'`,
      [billId]
    );

    bill.paid_amount = paid?.paid_amount || 0;
    bill.due_amount = Math.max(0, bill.total_amount - bill.paid_amount);

    res.json(bill);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateBillCharges = async (req, res) => {
  try {
    const { billId } = req.params;
    const { extraCharges } = req.body;

    const bill = await dbGet('SELECT total_amount FROM bills WHERE id = ?', [billId]);
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    const newTotal = bill.total_amount + (extraCharges || 0);

    await dbRun(
      `UPDATE bills SET extra_charges = ?, total_amount = ? WHERE id = ?`,
      [extraCharges || 0, newTotal, billId]
    );

    res.json({ message: 'Bill updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMessStatistics = async (req, res) => {
  try {
    const { month } = req.query;

    const totalMembers = await dbGet(
      'SELECT COUNT(*) as count FROM members WHERE status = "active"'
    );

    const totalMeals = await dbGet(
      month
        ? `SELECT COUNT(*) as count FROM meals
           WHERE strftime('%Y-%m', meal_date) = ?`
        : 'SELECT COUNT(*) as count FROM meals',
      month ? [month] : []
    );

    const totalCollected = await dbGet(
      month
        ? `SELECT SUM(amount) as total FROM payments
           WHERE status = 'completed' AND strftime('%Y-%m', payment_date) = ?`
        : 'SELECT SUM(amount) as total FROM payments WHERE status = "completed"',
      month ? [month] : []
    );

    const totalDue = await dbGet(
      month
        ? `SELECT SUM(b.total_amount - COALESCE(p.paid, 0)) as total
           FROM bills b
           LEFT JOIN (SELECT bill_id, SUM(amount) as paid FROM payments WHERE status = 'completed' GROUP BY bill_id) p ON b.id = p.bill_id
           WHERE b.month = ?`
        : `SELECT SUM(b.total_amount - COALESCE(p.paid, 0)) as total
           FROM bills b
           LEFT JOIN (SELECT bill_id, SUM(amount) as paid FROM payments WHERE status = 'completed' GROUP BY bill_id) p ON b.id = p.bill_id`,
      month ? [month] : []
    );

    res.json({
      total_members: totalMembers?.count || 0,
      total_meals: totalMeals?.count || 0,
      total_collected: totalCollected?.total || 0,
      total_due: totalDue?.total || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
