const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const controller = require('../controllers/userController');

const router = express.Router();
router.use(authenticate, authorize('admin'));

router.get('/', controller.list);
router.post('/', controller.createReceptionist);

module.exports = router;
