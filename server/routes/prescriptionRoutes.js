const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const controller = require('../controllers/prescriptionController');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize('doctor', 'patient'), controller.list);
router.post('/', authorize('doctor'), controller.create);

module.exports = router;
