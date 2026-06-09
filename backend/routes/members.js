const express = require('express');
const memberController = require('../controllers/memberController');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.get('/me', authMiddleware, memberController.getCurrentMember);
router.put('/me', authMiddleware, memberController.updateCurrentMember);
router.get('/', authMiddleware, adminOnly, memberController.getAllMembers);
router.get('/:id', authMiddleware, adminOnly, memberController.getMemberById);
router.post('/', authMiddleware, adminOnly, memberController.addMember);
router.put('/:id', authMiddleware, adminOnly, memberController.updateMember);
router.delete('/:id', authMiddleware, adminOnly, memberController.deleteMember);

module.exports = router;
