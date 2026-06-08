const { query } = require('../config/database');

const getBillingSettings = async () => {
  const settings = await query('SELECT * FROM settings LIMIT 1');
  if (settings.length === 0) {
    return { meal_rate: 100, monthly_fixed_cost: 500 };
  }
  return settings[0];
};

exports.generateBills = async (req, res) => {
  try {
    const { month, mealRate, fixedCost } = req.body;
    if (!month) {
      return res.status(400).json({ success: false, error: 'Month required' });
    }

    const settings = await getBillingSettings();
    const appliedMealRate = mealRate || settings.meal_rate || 100;
    const appliedFixedCost = fixedCost || settings.monthly_fixed_cost || 500;

    const members = await query('SELECT id FROM members WHERE status = "active"');

    for (const member of members) {
      const mealData = await query(
        `SELECT COALESCE(SUM(quantity), 0) as total_meals FROM meals WHERE member_id = ? AND DATE_FORMAT(meal_date, '%Y-%m') = ?`,
        [member.id, month]
      );
      const mealCount = mealData[0]?.total_meals || 0;
      const totalAmount = (mealCount * appliedMealRate) + appliedFixedCost;
      await query(
        `INSERT INTO bills (member_id, month, meal_count, meal_rate, fixed_cost, total_amount) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE meal_count = VALUES(meal_count), meal_rate = VALUES(meal_rate), fixed_cost = VALUES(fixed_cost), total_amount = VALUES(total_amount)`,
        [member.id, month, mealCount, appliedMealRate, appliedFixedCost, totalAmount]
      );
    }

    res.json({ success: true, message: `Bills generated for ${month}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getAllBills = async (req, res) => {
  try {
    const { memberId, month } = req.query;
    const conditions = [];
    const params = [];

    if (memberId) {
      conditions.push('b.member_id = ?');
      params.push(memberId);
    }
    if (month) {
      conditions.push('b.month = ?');
      params.push(month);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const bills = await query(
      `SELECT b.*, m.full_name, COALESCE(SUM(p.amount), 0) as paid_amount, (b.total_amount - COALESCE(SUM(p.amount), 0)) as due_amount, CASE WHEN COALESCE(SUM(p.amount),0) >= b.total_amount THEN 'paid' WHEN COALESCE(SUM(p.amount),0) > 0 THEN 'partial' ELSE 'unpaid' END as status FROM bills b JOIN members m ON b.member_id = m.id LEFT JOIN payments p ON b.id = p.bill_id ${where} GROUP BY b.id ORDER BY b.month DESC`,
      params
    );
    res.json({ success: true, data: bills });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getBillDetails = async (req, res) => {
  try {
    const bills = await query(
      `SELECT b.*, m.full_name, COALESCE(SUM(p.amount), 0) as paid_amount, (b.total_amount - COALESCE(SUM(p.amount), 0)) as due_amount FROM bills b JOIN members m ON b.member_id = m.id LEFT JOIN payments p ON b.id = p.bill_id WHERE b.id = ? GROUP BY b.id`,
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
    const bills = await query('SELECT total_amount, extra_charges FROM bills WHERE id = ?', [req.params.billId]);
    if (bills.length === 0) {
      return res.status(404).json({ success: false, error: 'Bill not found' });
    }
    const currentBill = bills[0];
    const newExtra = extraCharges || 0;
    const newTotal = Number(currentBill.total_amount) - Number(currentBill.extra_charges || 0) + Number(newExtra);
    await query(
      'UPDATE bills SET extra_charges = ?, total_amount = ? WHERE id = ?',
      [newExtra, newTotal, req.params.billId]
    );
    res.json({ success: true, message: 'Bill updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getMessStats = async (req, res) => {
  try {
    const { month } = req.query;
    const monthWhere = month ? `WHERE DATE_FORMAT(meal_date, '%Y-%m') = ?` : '';
    const monthParams = month ? [month] : [];

    const totalMembersResult = await query('SELECT COUNT(*) as total_members FROM members WHERE status = "active"');
    const totalMealsResult = await query(`SELECT COALESCE(SUM(quantity), 0) as total_meals FROM meals ${monthWhere}`, monthParams);
    const totalRevenueResult = await query(`SELECT COALESCE(SUM(p.amount), 0) as total_collected FROM payments p JOIN bills b ON p.bill_id = b.id ${month ? 'WHERE b.month = ?' : ''}`, monthParams);
    const totalDueResult = await query(`SELECT COALESCE(SUM(b.total_amount - IFNULL(payed.paid_amount, 0)), 0) as total_due FROM bills b LEFT JOIN (SELECT bill_id, SUM(amount) as paid_amount FROM payments GROUP BY bill_id) payed ON b.id = payed.bill_id ${month ? 'WHERE b.month = ?' : ''}`, monthParams);
    const totalExpensesResult = await query(`SELECT COALESCE(SUM(amount), 0) as total_expenses FROM expenses ${month ? 'WHERE DATE_FORMAT(expense_date, \'%Y-%m\') = ?' : ''}`, monthParams);

    const totalExpenses = totalExpensesResult[0]?.total_expenses || 0;
    const totalMeals = totalMealsResult[0]?.total_meals || 0;
    const mealRate = totalMeals > 0 ? Number((totalExpenses / totalMeals).toFixed(2)) : 0;

    res.json({ success: true, data: {
      total_members: totalMembersResult[0]?.total_members || 0,
      total_meals: totalMeals,
      total_collected: totalRevenueResult[0]?.total_collected || 0,
      total_due: totalDueResult[0]?.total_due || 0,
      total_expenses: totalExpenses,
      meal_rate: mealRate
    }});
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
