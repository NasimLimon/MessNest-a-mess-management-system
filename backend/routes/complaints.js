const express = require('express');
const complaintController = require('../controllers/complaintController');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.post('/', authMiddleware, complaintController.submitComplaint);
router.get('/member/:memberId', authMiddleware, complaintController.getMemberComplaints);
router.get('/:id', authMiddleware, complaintController.getComplaintById);
router.get('/', authMiddleware, complaintController.getComplaints);
router.put('/:id', authMiddleware, adminOnly, complaintController.updateComplaint);

module.exports = router;
