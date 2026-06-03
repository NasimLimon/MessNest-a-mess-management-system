const express = require('express');
const paymentController = require('../controllers/paymentController');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.post('/', authMiddleware, adminOnly, paymentController.recordPayment);
router.get('/', authMiddleware, paymentController.getPayments);
router.get('/history/:memberId', authMiddleware, paymentController.getPaymentHistory);
router.get('/status/:memberId', authMiddleware, paymentController.getMemberBillStatus);
router.get('/summary/all', authMiddleware, paymentController.getPaymentSummary);

module.exports = router;
