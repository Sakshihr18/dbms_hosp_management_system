const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const controller = require('../controllers/patientController');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize('admin', 'receptionist', 'doctor'), controller.list);
router.post('/', authorize('receptionist'), controller.create);
router.get('/:id/history', authorize('admin', 'receptionist', 'doctor', 'patient'), controller.history);
router.get('/:id', authorize('admin', 'receptionist', 'doctor', 'patient'), controller.getOne);
router.put('/:id', authorize('receptionist', 'patient'), controller.update);

module.exports = router;
