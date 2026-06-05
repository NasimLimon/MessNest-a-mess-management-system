const express = require('express');
const billingController = require('../controllers/billingController');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.post('/generate', authMiddleware, adminOnly, billingController.generateBills);
router.get('/', authMiddleware, billingController.getAllBills);
router.get('/details/:billId', authMiddleware, billingController.getBillDetails);
router.put('/:billId/charges', authMiddleware, adminOnly, billingController.updateCharges);
router.get('/stats/mess', authMiddleware, billingController.getMessStats);

module.exports = router;
