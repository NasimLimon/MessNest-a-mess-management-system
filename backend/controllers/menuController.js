const { query } = require('../config/database');

exports.addMenuItem = async (req, res) => {
  try {
    const { menuDate, mealType, items } = req.body;
    const createdBy = req.user?.id || 1;
    if (!menuDate || !mealType || !items) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    const result = await query(
      'INSERT INTO menu (menu_date, meal_type, items, created_by) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE items = VALUES(items)',
      [menuDate, mealType, items, createdBy]
    );
    res.status(201).json({ success: true, message: 'Menu item added successfully', data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getAllMenuItems = async (req, res) => {
  try {
    const menuItems = await query(
      `SELECT m.*, u.username FROM menu m JOIN users u ON m.created_by = u.id ORDER BY m.menu_date DESC`
    );
    res.json({ success: true, data: menuItems });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getTodayMenu = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const menuItems = await query(
      'SELECT * FROM menu WHERE menu_date = ? ORDER BY meal_type ASC',
      [today]
    );
    res.json({ success: true, data: menuItems });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
