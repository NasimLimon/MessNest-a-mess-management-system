const express = require('express');
const noticeController = require('../controllers/noticeController');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.post('/', authMiddleware, adminOnly, noticeController.postNotice);
router.get('/', authMiddleware, noticeController.getNotices);
router.get('/:id', authMiddleware, noticeController.getNoticeById);
router.delete('/:id', authMiddleware, adminOnly, noticeController.deleteNotice);

module.exports = router;
