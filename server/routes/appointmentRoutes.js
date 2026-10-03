const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const controller = require('../controllers/appointmentController');

const router = express.Router();
router.use(authenticate);

router.get('/slots', authorize('receptionist', 'patient'), controller.slots);
router.get('/', controller.list);
router.post('/', authorize('receptionist', 'patient'), controller.create);
router.put('/:id', authorize('admin', 'receptionist', 'doctor', 'patient'), controller.update);
router.delete('/:id', authorize('receptionist', 'patient'), controller.remove);

module.exports = router;
