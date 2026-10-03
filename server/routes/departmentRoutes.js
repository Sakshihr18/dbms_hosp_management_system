const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const controller = require('../controllers/departmentController');

const router = express.Router();
router.use(authenticate);

router.get('/', controller.list);
router.post('/', authorize('admin'), controller.create);
router.put('/:id', authorize('admin'), controller.update);

module.exports = router;
