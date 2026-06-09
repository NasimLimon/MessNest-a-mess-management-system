const { query } = require('../config/database');

const validCategories = [
  'seat_rent',
  'electricity_bill',
  'khala_salary',
  'gas_bill',
  'wifi_bill',
  'market_cost',
  'maintenance_cost',
  'extra_expenses',
  'groceries',
  'market',
  'utilities',
  'rent',
  'salary',
  'maintenance',
  'other'
];

const getBillingSettings = async () => {
  const settings = await query('SELECT * FROM settings LIMIT 1');
  if (settings.length === 0) {
    return { meal_rate: 100, monthly_fixed_cost: 0 };
  }
  return settings[0];
};

const getActiveMembers = async () => {
  return await query('SELECT id FROM members WHERE status = "active"');
};

const recalculateMonthlyBills = async (month) => {
  if (!month) return;
  const settings = await getBillingSettings();
  const mealRate = Number(settings.meal_rate || 100);
  const monthlyFixedCost = Number(settings.monthly_fixed_cost || 0);

  const fixedExpenseRow = await query(
    `SELECT COALESCE(SUM(amount), 0) as total_fixed FROM expenses WHERE DATE_FORMAT(expense_date, '%Y-%m') = ?`,
    [month]
  );
  const totalFixedExpense = monthlyFixedCost + Number(fixedExpenseRow[0]?.total_fixed || 0);

  const activeMembers = await getActiveMembers();
  const activeCount = activeMembers.length;
  const fixedShare = activeCount > 0 ? Number((totalFixedExpense / activeCount).toFixed(2)) : 0;

  for (const member of activeMembers) {
    const mealData = await query(
      `SELECT COALESCE(SUM(quantity), 0) as total_meals FROM meals WHERE member_id = ? AND DATE_FORMAT(meal_date, '%Y-%m') = ?`,
      [member.id, month]
    );
    const mealCount = mealData[0]?.total_meals || 0;
    const existingBill = await query('SELECT extra_charges FROM bills WHERE member_id = ? AND month = ?', [member.id, month]);
    const extraCharges = Number(existingBill[0]?.extra_charges || 0);
    const totalAmount = (mealCount * mealRate) + fixedShare + extraCharges;

    await query(
      `INSERT INTO bills (member_id, month, meal_count, meal_rate, fixed_cost, extra_charges, total_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE meal_count = VALUES(meal_count), meal_rate = VALUES(meal_rate), fixed_cost = VALUES(fixed_cost), extra_charges = VALUES(extra_charges), total_amount = VALUES(total_amount)`,
      [member.id, month, mealCount, mealRate, fixedShare, extraCharges, totalAmount]
    );
  }
};

exports.addExpense = async (req, res) => {
  try {
    const { category, amount, description, expenseDate } = req.body;

    if (!category || !amount) {
      return res.status(400).json({ success: false, error: 'Category and amount are required' });
    }

    if (!validCategories.includes(category)) {
      return res.status(400).json({ success: false, error: 'Invalid expense category' });
    }

    const expense_date = expenseDate || new Date().toISOString().split('T')[0];
    const result = await query(
      'INSERT INTO expenses (category, amount, description, expense_date, created_by) VALUES (?, ?, ?, ?, ?)',
      [category, amount, description || '', expense_date, req.user.id]
    );

    const month = expense_date.substring(0, 7);
    await recalculateMonthlyBills(month);

    res.status(201).json({ success: true, message: 'Expense added successfully', data: { id: result.insertId } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getExpenses = async (req, res) => {
  try {
    const { month, category } = req.query;
    const where = [];
    const params = [];

    if (month) {
      where.push("DATE_FORMAT(expense_date, '%Y-%m') = ?");
      params.push(month);
    }
    if (category) {
      where.push('category = ?');
      params.push(category);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const expenses = await query(
      `SELECT e.*, u.username as entered_by FROM expenses e JOIN users u ON e.created_by = u.id ${whereClause} ORDER BY expense_date DESC, created_at DESC`,
      params
    );

    res.json({ success: true, data: expenses });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
exports.getExpenseSummary = async (req, res) => {
  try {
    const { month } = req.query;
    const params = [];
    let whereClause = '';

    if (month) {
      whereClause = "WHERE DATE_FORMAT(expense_date, '%Y-%m') = ?";
      params.push(month);
    }

    const totals = await query(
      `SELECT category, SUM(amount) as total_amount FROM expenses ${whereClause} GROUP BY category ORDER BY total_amount DESC`,
      params
    );

    const overall = await query(
      `SELECT COALESCE(SUM(amount), 0) as total_expenses FROM expenses ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: {
        categories: totals,
        total_expenses: overall[0]?.total_expenses || 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const expenseRow = await query('SELECT expense_date FROM expenses WHERE id = ?', [id]);
    const month = expenseRow[0]?.expense_date ? expenseRow[0].expense_date.substring(0, 7) : null;
    await query('DELETE FROM expenses WHERE id = ?', [id]);
    if (month) await recalculateMonthlyBills(month);
    res.json({ success: true, message: 'Expense removed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, amount, description, expenseDate } = req.body;

    const originalExpense = await query('SELECT expense_date FROM expenses WHERE id = ?', [id]);
    const originalMonth = originalExpense[0]?.expense_date ? originalExpense[0].expense_date.substring(0, 7) : null;

    const updates = [];
    const params = [];

    if (category) {
      if (!validCategories.includes(category)) {
        return res.status(400).json({ success: false, error: 'Invalid expense category' });
      }
      updates.push('category = ?');
      params.push(category);
    }
    if (amount !== undefined) {
      updates.push('amount = ?');
      params.push(amount);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (expenseDate) {
      updates.push('expense_date = ?');
      params.push(expenseDate);
    }

    if (!updates.length) {
      return res.status(400).json({ success: false, error: 'No expense changes provided' });
    }

    params.push(id);
    await query(`UPDATE expenses SET ${updates.join(', ')} WHERE id = ?`, params);

    const updatedMonth = expenseDate ? expenseDate.substring(0, 7) : originalMonth;
    if (originalMonth) await recalculateMonthlyBills(originalMonth);
    if (updatedMonth && updatedMonth !== originalMonth) await recalculateMonthlyBills(updatedMonth);

    res.json({ success: true, message: 'Expense updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};