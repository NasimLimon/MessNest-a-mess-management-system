const express = require('express');
const activityController = require('../controllers/activityController');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.get('/', authMiddleware, adminOnly, activityController.getActivityLogs);

module.exports = router;
