const express = require('express');
const expenseController = require('../controllers/expenseController');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.get('/', authMiddleware, adminOnly, expenseController.getExpenses);
router.get('/summary', authMiddleware, adminOnly, expenseController.getExpenseSummary);
router.post('/', authMiddleware, adminOnly, expenseController.addExpense);
router.put('/:id', authMiddleware, adminOnly, expenseController.updateExpense);
router.delete('/:id', authMiddleware, adminOnly, expenseController.deleteExpense);

module.exports = router;
