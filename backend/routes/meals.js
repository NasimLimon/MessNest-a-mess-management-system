const express = require('express');
const mealController = require('../controllers/mealController');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.post('/', authMiddleware, adminOnly, mealController.recordMeal);
router.get('/', authMiddleware, mealController.getAllMeals);
router.get('/summary/monthly', authMiddleware, mealController.getMonthlySummary);
router.get('/member/:memberId', authMiddleware, mealController.getMemberMeals);

module.exports = router;
