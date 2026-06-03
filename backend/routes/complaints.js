const express = require('express');
const complaintController = require('../controllers/complaintController');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.post('/', authMiddleware, complaintController.submitComplaint);
router.get('/', authMiddleware, adminOnly, complaintController.getComplaints);
router.get('/:id', authMiddleware, complaintController.getComplaintById);
router.put('/:id', authMiddleware, adminOnly, complaintController.updateComplaintStatus);
router.get('/member/:memberId', authMiddleware, complaintController.getMemberComplaints);

module.exports = router;
