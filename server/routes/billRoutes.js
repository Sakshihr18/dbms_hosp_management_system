const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const controller = require('../controllers/billController');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize('admin', 'receptionist', 'patient'), controller.list);
router.post('/', authorize('receptionist'), controller.create);
router.put('/:id', authorize('receptionist'), controller.update);

module.exports = router;
