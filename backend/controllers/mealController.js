const { dbGet, dbAll, dbRun } = require('../config/database');

exports.recordMeal = async (req, res) => {
  try {
    const { memberId, mealDate, mealType, quantity = 1 } = req.body;

    if (!memberId || !mealDate || !mealType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await dbRun(
      `INSERT INTO meals (member_id, meal_date, meal_type, quantity)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = ?`,
      [memberId, mealDate, mealType, quantity, quantity]
    );

    res.json({ message: 'Meal recorded successfully', id: result.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMealHistory = async (req, res) => {
  try {
    const { memberId, month } = req.query;

    let query = `SELECT m.id, m.member_id, m.meal_date, m.meal_type, m.quantity,
                        mb.full_name
                 FROM meals m
                 JOIN members mb ON m.member_id = mb.id
                 WHERE 1=1`;
    const params = [];

    if (memberId) {
      query += ` AND m.member_id = ?`;
      params.push(memberId);
    }

    if (month) {
      query += ` AND DATE_FORMAT(m.meal_date, '%Y-%m') = ?`;
      params.push(month);
    }

    query += ` ORDER BY m.meal_date DESC`;

    const meals = await dbAll(query, params);
    res.json(meals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMonthlySummary = async (req, res) => {
  try {
    const { memberId, month } = req.query;

    if (!memberId || !month) {
      return res.status(400).json({ error: 'memberId and month required' });
    }

    const summary = await dbGet(
      `SELECT COUNT(*) as total_meals,
              SUM(CASE WHEN meal_type = 'breakfast' THEN 1 ELSE 0 END) as breakfast_count,
              SUM(CASE WHEN meal_type = 'lunch' THEN 1 ELSE 0 END) as lunch_count,
              SUM(CASE WHEN meal_type = 'dinner' THEN 1 ELSE 0 END) as dinner_count
       FROM meals
       WHERE member_id = ? AND DATE_FORMAT(meal_date, '%Y-%m') = ?`,
      [memberId, month]
    );

    res.json(summary || { total_meals: 0, breakfast_count: 0, lunch_count: 0, dinner_count: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMemberMeals = async (req, res) => {
  try {
    const { memberId } = req.params;
    const { month } = req.query;

    let query = `SELECT id, meal_date, meal_type, quantity
                 FROM meals
                 WHERE member_id = ?`;
    const params = [memberId];

    if (month) {
      query += ` AND DATE_FORMAT(meal_date, '%Y-%m') = ?`;
      params.push(month);
    }

    query += ` ORDER BY meal_date DESC`;

    const meals = await dbAll(query, params);
    res.json(meals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
