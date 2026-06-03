const express = require('express');
const menuController = require('../controllers/menuController');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.post('/', authMiddleware, adminOnly, menuController.addMenuItem);
router.get('/', authMiddleware, menuController.getMenu);
router.get('/today', authMiddleware, menuController.getTodayMenu);

module.exports = router;
