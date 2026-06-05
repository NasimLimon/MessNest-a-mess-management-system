const { query } = require('../config/database');

exports.recordMeal = async (req, res) => {
  try {
    const { memberId, mealDate, mealType, quantity = 1 } = req.body;
    if (!memberId || !mealDate || !mealType) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    const result = await query(
      'INSERT INTO meals (member_id, meal_date, meal_type, quantity) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)',
      [memberId, mealDate, mealType, quantity]
    );
    res.status(201).json({ success: true, message: 'Meal recorded successfully', data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getAllMeals = async (req, res) => {
  try {
    const meals = await query(
      `SELECT m.*, mb.full_name FROM meals m JOIN members mb ON m.member_id = mb.id ORDER BY m.meal_date DESC LIMIT 100`
    );
    res.json({ success: true, data: meals });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getMemberMeals = async (req, res) => {
  try {
    const meals = await query(
      'SELECT * FROM meals WHERE member_id = ? ORDER BY meal_date DESC',
      [req.params.memberId]
    );
    res.json({ success: true, data: meals });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getMonthlySummary = async (req, res) => {
  try {
    const { month } = req.query;
    const summary = await query(
      `SELECT member_id, COUNT(*) as meal_count, SUM(quantity) as total_quantity FROM meals WHERE DATE_FORMAT(meal_date, '%Y-%m') = ? GROUP BY member_id`,
      [month]
    );
    res.json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
