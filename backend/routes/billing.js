const express = require('express');
const billingController = require('../controllers/billingController');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.post('/generate', authMiddleware, adminOnly, billingController.generateBills);
router.get('/', authMiddleware, billingController.getAllBills);
router.get('/details/:billId', authMiddleware, billingController.getBillDetails);
router.put('/:billId/charges', authMiddleware, adminOnly, billingController.updateCharges);
router.put('/:billId', authMiddleware, adminOnly, billingController.updateBill);
router.post('/:billId/mark-paid', authMiddleware, adminOnly, billingController.markBillPaid);
router.get('/stats/mess', authMiddleware, adminOnly, billingController.getMessStats);

module.exports = router;
