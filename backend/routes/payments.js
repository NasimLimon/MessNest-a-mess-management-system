const express = require('express');
const paymentController = require('../controllers/paymentController');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.post('/', authMiddleware, paymentController.recordPayment);
router.put('/:paymentId', authMiddleware, adminOnly, paymentController.updatePayment);
router.get('/', authMiddleware, adminOnly, paymentController.getAllPayments);
router.get('/history/:memberId', authMiddleware, paymentController.getMemberPaymentHistory);
router.get('/status/:memberId', authMiddleware, paymentController.getMemberBillStatus);

module.exports = router;
