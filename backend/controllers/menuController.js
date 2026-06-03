const { dbGet, dbAll, dbRun } = require('../config/database');

exports.addMenuItem = async (req, res) => {
  try {
    const { menuDate, mealType, items } = req.body;

    if (!menuDate || !mealType || !items) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await dbRun(
      `INSERT OR REPLACE INTO menu (menu_date, meal_type, items, created_by)
       VALUES (?, ?, ?, ?)`,
      [menuDate, mealType, items, req.user.id]
    );

    res.json({ message: 'Menu item added successfully', id: result.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMenu = async (req, res) => {
  try {
    const { startDate, endDate, mealType } = req.query;

    let query = `SELECT m.*, u.username as created_by_name
                 FROM menu m
                 JOIN users u ON m.created_by = u.id
                 WHERE 1=1`;
    const params = [];

    if (startDate && endDate) {
      query += ` AND menu_date BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }

    if (mealType) {
      query += ` AND meal_type = ?`;
      params.push(mealType);
    }

    query += ` ORDER BY menu_date ASC, meal_type ASC`;

    const menu = await dbAll(query, params);
    res.json(menu);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTodayMenu = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const menu = await dbAll(
      `SELECT meal_type, items FROM menu WHERE menu_date = ? ORDER BY meal_type ASC`,
      [today]
    );

    res.json(menu);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
