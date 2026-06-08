const express = require('express');
const paymentController = require('../controllers/paymentController');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.post('/', authMiddleware, paymentController.recordPayment);
router.get('/', authMiddleware, paymentController.getAllPayments);
router.get('/history/:memberId', authMiddleware, paymentController.getMemberPaymentHistory);
router.get('/status/:memberId', authMiddleware, paymentController.getMemberBillStatus);

module.exports = router;
