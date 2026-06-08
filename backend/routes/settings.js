const express = require('express');
const settingsController = require('../controllers/settingsController');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.get('/', authMiddleware, settingsController.getSettings);
router.put('/', authMiddleware, adminOnly, settingsController.updateSettings);

module.exports = router;
