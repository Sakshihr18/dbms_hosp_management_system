const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const controller = require('../controllers/doctorController');

const router = express.Router();
router.use(authenticate);

router.get('/', controller.list);
router.get('/:id', controller.getOne);
router.post('/', authorize('admin'), controller.create);
router.put('/:id', authorize('admin'), controller.update);
router.delete('/:id', authorize('admin'), controller.deactivate);

module.exports = router;
