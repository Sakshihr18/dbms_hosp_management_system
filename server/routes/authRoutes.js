const express = require('express');
const { authenticate } = require('../middleware/auth');
const auth = require('../controllers/authController');

const router = express.Router();

router.post('/register', auth.register);
router.post('/login', auth.login);
router.get('/me', authenticate, auth.me);

module.exports = router;
