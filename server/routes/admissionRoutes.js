const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const controller = require('../controllers/admissionController');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize('admin', 'receptionist', 'doctor'), controller.list);
router.post('/', authorize('receptionist'), controller.create);
router.put('/:id', authorize('receptionist'), controller.update);

module.exports = router;
