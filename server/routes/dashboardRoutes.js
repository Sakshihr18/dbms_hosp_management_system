const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const controller = require('../controllers/dashboardController');

const router = express.Router();
router.use(authenticate);

router.get('/admin', authorize('admin'), controller.admin);
router.get('/receptionist', authorize('receptionist'), controller.receptionist);
router.get('/doctor', authorize('doctor'), controller.doctor);
router.get('/patient', authorize('patient'), controller.patient);

module.exports = router;
