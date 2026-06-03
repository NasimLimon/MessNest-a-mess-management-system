const express = require('express');
const billingController = require('../controllers/billingController');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.post('/generate', authMiddleware, adminOnly, billingController.generateMonthlyBills);
router.get('/', authMiddleware, billingController.getBills);
router.get('/details/:billId', authMiddleware, billingController.getBillDetails);
router.put('/:billId/charges', authMiddleware, adminOnly, billingController.updateBillCharges);
router.get('/stats/mess', authMiddleware, billingController.getMessStatistics);

module.exports = router;
