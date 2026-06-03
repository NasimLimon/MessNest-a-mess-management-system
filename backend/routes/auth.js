const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', (req, res, next) => {
  const { authMiddleware } = require('../middleware/auth');
  authMiddleware(req, res, () => {
    authController.getCurrentUser(req, res);
  });
});

module.exports = router;
