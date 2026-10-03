const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const controller = require('../controllers/testController');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize('doctor', 'patient'), controller.list);
router.post('/', authorize('doctor'), controller.create);
router.put('/:id', authorize('doctor'), controller.update);

module.exports = router;
