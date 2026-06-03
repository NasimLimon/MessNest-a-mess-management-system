const express = require('express');
const memberController = require('../controllers/memberController');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.get('/', authMiddleware, memberController.getMembers);
router.get('/:id', authMiddleware, memberController.getMember);
router.post('/', authMiddleware, adminOnly, memberController.addMember);
router.put('/:id', authMiddleware, adminOnly, memberController.updateMember);
router.delete('/:id', authMiddleware, adminOnly, memberController.removeMember);

module.exports = router;
