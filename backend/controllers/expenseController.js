const { query } = require('../config/database');

const validCategories = ['groceries', 'market', 'utilities', 'rent', 'salary', 'maintenance', 'other'];

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
    await query('DELETE FROM expenses WHERE id = ?', [id]);
    res.json({ success: true, message: 'Expense removed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, amount, description, expenseDate } = req.body;

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
    res.json({ success: true, message: 'Expense updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};