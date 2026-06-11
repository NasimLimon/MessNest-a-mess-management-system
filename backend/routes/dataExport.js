const express = require('express');
const router = express.Router();
const dataExportController = require('../controllers/dataExportController');
const { authMiddleware } = require('../middleware/auth');

router.post('/request', authMiddleware, dataExportController.requestExport);
router.get('/', authMiddleware, dataExportController.getExports);
router.get('/:id/status', authMiddleware, dataExportController.getStatus);
router.get('/:id/download', authMiddleware, dataExportController.download);

module.exports = router;
