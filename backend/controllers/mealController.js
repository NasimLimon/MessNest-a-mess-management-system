const { query } = require('../config/database');

const getMemberIdByUserId = async (userId) => {
  const rows = await query('SELECT id FROM members WHERE user_id = ?', [userId]);
  return rows[0]?.id || null;
};

exports.recordMeal = async (req, res) => {
  try {
    let { memberId, mealDate, mealType, quantity = 1 } = req.body;

    if (!mealDate || !mealType) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    if (req.user.role === 'member') {
      memberId = await getMemberIdByUserId(req.user.id);
      if (!memberId) {
        return res.status(404).json({ success: false, error: 'Member profile not found' });
      }
    }

    if (!memberId) {
      return res.status(400).json({ success: false, error: 'Member ID required' });
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
    const { memberId, month } = req.query;
    const whereClauses = [];
    const params = [];

    if (req.user.role === 'member') {
      const currentMemberId = await getMemberIdByUserId(req.user.id);
      whereClauses.push('m.member_id = ?');
      params.push(currentMemberId);
    } else if (memberId) {
      whereClauses.push('m.member_id = ?');
      params.push(memberId);
    }

    if (month) {
      whereClauses.push("DATE_FORMAT(m.meal_date, '%Y-%m') = ?");
      params.push(month);
    }

    const where = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const meals = await query(
      `SELECT m.*, mb.full_name FROM meals m JOIN members mb ON m.member_id = mb.id ${where} ORDER BY m.meal_date DESC LIMIT 200`,
      params
    );
    res.json({ success: true, data: meals });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getMemberMeals = async (req, res) => {
  try {
    const { month } = req.query;
    const { memberId } = req.params;
    const params = [memberId];
    let sql = 'SELECT * FROM meals WHERE member_id = ?';

    if (month) {
      sql += " AND DATE_FORMAT(meal_date, '%Y-%m') = ?";
      params.push(month);
    }

    sql += ' ORDER BY meal_date DESC';
    const meals = await query(sql, params);
    res.json({ success: true, data: meals });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getMonthlySummary = async (req, res) => {
  try {
    const { month } = req.query;
    const memberId = req.query.memberId || null;
    const params = [];
    let where = '';

    if (month) {
      where += " WHERE DATE_FORMAT(meal_date, '%Y-%m') = ?";
      params.push(month);
    }
    if (memberId) {
      where += where ? ' AND' : ' WHERE';
      where += ' member_id = ?';
      params.push(memberId);
    }

    const summary = await query(
      `SELECT member_id, COUNT(*) as meal_count, SUM(quantity) as total_meals FROM meals ${where} GROUP BY member_id`,
      params
    );
    res.json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
