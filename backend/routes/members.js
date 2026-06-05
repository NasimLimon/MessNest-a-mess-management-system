const express = require('express');
const memberController = require('../controllers/memberController');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.get('/', authMiddleware, memberController.getAllMembers);
router.get('/:id', authMiddleware, memberController.getMemberById);
router.post('/', authMiddleware, adminOnly, memberController.addMember);
router.put('/:id', authMiddleware, adminOnly, memberController.updateMember);
router.delete('/:id', authMiddleware, adminOnly, memberController.deleteMember);

module.exports = router;
