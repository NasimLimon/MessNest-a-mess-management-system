const { query } = require('../config/database');

const getMemberIdByUserId = async (userId) => {
  const rows = await query('SELECT id FROM members WHERE user_id = ?', [userId]);
  return rows[0]?.id || null;
};

const getBillingSettings = async () => {
  const settings = await query('SELECT * FROM settings LIMIT 1');
  if (settings.length === 0) {
    return { meal_rate: 100, monthly_fixed_cost: 500 };
  }
  return settings[0];
};

exports.generateBills = async (req, res) => {
  try {
    const { month, mealRate: overrideMealRate, fixedCost: overrideFixedShare } = req.body;
    if (!month) {
      return res.status(400).json({ success: false, error: 'Month required' });
    }

    const activeMembers = await query('SELECT id FROM members WHERE status = "active"');
    const activeCount = activeMembers.length;

    const settings = await getBillingSettings();
    const defaultMealRate = Number(settings.meal_rate || 0);
    const defaultFixedCost = Number(settings.monthly_fixed_cost || 0);

    const fixedExpenseRow = await query(
      `SELECT COALESCE(SUM(amount), 0) as total_fixed FROM expenses WHERE DATE_FORMAT(expense_date, '%Y-%m') = ?`,
      [month]
    );
    const totalFixedExpense = Number(fixedExpenseRow[0]?.total_fixed || 0) + defaultFixedCost;

    const mealRate = overrideMealRate !== undefined
      ? Number(overrideMealRate)
      : defaultMealRate;

    const fixedShare = overrideFixedShare !== undefined
      ? Number(overrideFixedShare)
      : activeCount > 0 ? Number((totalFixedExpense / activeCount).toFixed(2)) : 0;

    for (const member of activeMembers) {
      const mealData = await query(
        `SELECT COALESCE(SUM(quantity), 0) as total_meals FROM meals WHERE member_id = ? AND DATE_FORMAT(meal_date, '%Y-%m') = ?`,
        [member.id, month]
      );
      const mealCount = mealData[0]?.total_meals || 0;
      const totalAmount = (mealCount * mealRate) + fixedShare;
      await query(
        `INSERT INTO bills (member_id, month, meal_count, meal_rate, fixed_cost, total_amount) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE meal_count = VALUES(meal_count), meal_rate = VALUES(meal_rate), fixed_cost = VALUES(fixed_cost), total_amount = VALUES(total_amount)`,
        [member.id, month, mealCount, mealRate, fixedShare, totalAmount]
      );
    }

    res.json({ success: true, message: `Bills generated for ${month}`, data: { mealRate, fixedShare, activeMembers: activeCount } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getAllBills = async (req, res) => {
  try {
    let { memberId, month } = req.query;
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
      conditions.push('b.member_id = ?');
      params.push(memberId);
    }
    if (month) {
      conditions.push('b.month = ?');
      params.push(month);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const bills = await query(
      `SELECT b.*, m.full_name, COALESCE(SUM(p.amount), 0) as paid_amount, (b.total_amount - COALESCE(SUM(p.amount), 0)) as due_amount, CASE WHEN COALESCE(SUM(p.amount),0) >= b.total_amount THEN 'paid' WHEN COALESCE(SUM(p.amount),0) > 0 THEN 'partial' ELSE 'unpaid' END as status FROM bills b JOIN members m ON b.member_id = m.id LEFT JOIN payments p ON b.id = p.bill_id AND p.status = 'completed' ${where} GROUP BY b.id ORDER BY b.month DESC`,
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
      `SELECT b.*, m.full_name, COALESCE(SUM(p.amount), 0) as paid_amount, (b.total_amount - COALESCE(SUM(p.amount), 0)) as due_amount FROM bills b JOIN members m ON b.member_id = m.id LEFT JOIN payments p ON b.id = p.bill_id AND p.status = 'completed' WHERE b.id = ? GROUP BY b.id`,
      [req.params.billId]
    );
    if (bills.length === 0) {
      return res.status(404).json({ success: false, error: 'Bill not found' });
    }

    if (req.user.role === 'member') {
      const currentMemberId = await getMemberIdByUserId(req.user.id);
      if (!currentMemberId) {
        return res.status(404).json({ success: false, error: 'Member profile not found' });
      }
      if (bills[0].member_id !== currentMemberId) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
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

exports.updateBill = async (req, res) => {
  try {
    const { mealCount, mealRate, fixedCost, extraCharges } = req.body;
    const bills = await query('SELECT * FROM bills WHERE id = ?', [req.params.billId]);
    if (bills.length === 0) {
      return res.status(404).json({ success: false, error: 'Bill not found' });
    }

    const bill = bills[0];
    const updatedMealCount = mealCount !== undefined ? Number(mealCount) : bill.meal_count;
    const updatedMealRate = mealRate !== undefined ? Number(mealRate) : Number(bill.meal_rate);
    const updatedFixedCost = fixedCost !== undefined ? Number(fixedCost) : Number(bill.fixed_cost);
    const updatedExtraCharges = extraCharges !== undefined ? Number(extraCharges) : Number(bill.extra_charges || 0);
    const updatedTotal = (updatedMealCount * updatedMealRate) + updatedFixedCost + updatedExtraCharges;

    await query(
      'UPDATE bills SET meal_count = ?, meal_rate = ?, fixed_cost = ?, extra_charges = ?, total_amount = ? WHERE id = ?',
      [updatedMealCount, updatedMealRate, updatedFixedCost, updatedExtraCharges, updatedTotal, req.params.billId]
    );

    res.json({ success: true, message: 'Bill updated successfully', data: { billId: req.params.billId } });
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
    const totalRevenueResult = await query(`SELECT COALESCE(SUM(p.amount), 0) as total_collected FROM payments p JOIN bills b ON p.bill_id = b.id AND p.status = 'completed' ${month ? 'WHERE b.month = ?' : ''}`, monthParams);
    const totalDueResult = await query(`SELECT COALESCE(SUM(b.total_amount - IFNULL(payed.paid_amount, 0)), 0) as total_due FROM bills b LEFT JOIN (SELECT bill_id, SUM(amount) as paid_amount FROM payments WHERE status = 'completed' GROUP BY bill_id) payed ON b.id = payed.bill_id ${month ? 'WHERE b.month = ?' : ''}`, monthParams);
    const totalExpensesResult = await query(`SELECT COALESCE(SUM(amount), 0) as total_expenses FROM expenses ${month ? 'WHERE DATE_FORMAT(expense_date, \'%Y-%m\') = ?' : ''}`, monthParams);

    const totalExpenses = totalExpensesResult[0]?.total_expenses || 0;
    const totalMeals = totalMealsResult[0]?.total_meals || 0;
    const settings = await getBillingSettings();
    const mealRate = Number(settings.meal_rate || 0);

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

exports.markBillPaid = async (req, res) => {
  try {
    const billId = req.params.billId;
    const bills = await query('SELECT * FROM bills WHERE id = ?', [billId]);
    if (bills.length === 0) return res.status(404).json({ success: false, error: 'Bill not found' });

    const bill = bills[0];
    const paidRow = await query('SELECT COALESCE(SUM(amount),0) as paid_amount FROM payments WHERE bill_id = ? AND status = ?', [billId, 'completed']);
    const paidAmount = Number(paidRow[0]?.paid_amount || 0);
    const due = Number(bill.total_amount || 0) - paidAmount;

    if (due <= 0) return res.json({ success: true, message: 'Bill already fully paid' });

    // Insert a payment record as admin action
    await query('INSERT INTO payments (member_id, bill_id, amount, payment_method, status) VALUES (?, ?, ?, ?, ?)', [bill.member_id, billId, due, 'admin', 'completed']);

    res.json({ success: true, message: `Marked bill ${billId} as paid`, data: { billId, paid: due } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
