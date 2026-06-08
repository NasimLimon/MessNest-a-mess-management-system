const { query } = require('../config/database');

exports.getSettings = async (req, res) => {
  try {
    const settings = await query('SELECT * FROM settings LIMIT 1');
    res.json({ success: true, data: settings[0] || null });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { messName, mealRate, monthlyFixedCost } = req.body;
    const existing = await query('SELECT * FROM settings LIMIT 1');

    if (existing.length === 0) {
      await query(
        'INSERT INTO settings (mess_name, meal_rate, monthly_fixed_cost, admin_id) VALUES (?, ?, ?, ?)',
        [messName || 'MealNest Mess', mealRate || 100, monthlyFixedCost || 500, req.user.id]
      );
    } else {
      await query(
        'UPDATE settings SET mess_name = ?, meal_rate = ?, monthly_fixed_cost = ?, admin_id = ? WHERE id = ?',
        [messName || existing[0].mess_name, mealRate || existing[0].meal_rate, monthlyFixedCost || existing[0].monthly_fixed_cost, req.user.id, existing[0].id]
      );
    }

    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
