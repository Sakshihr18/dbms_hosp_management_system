const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const controller = require('../controllers/paymentController');

const router = express.Router();
router.use(authenticate);

// Patient routes
router.post('/submit', authorize('patient'), controller.submitPayment);
router.get('/my-payments', authorize('patient'), controller.getMyPayments);
router.get('/bill/:billId', authorize('patient', 'admin', 'receptionist'), controller.getPaymentByBill);
router.get('/receipt/:paymentId', authorize('patient', 'admin', 'receptionist'), controller.getReceipt);

// Staff management & verification routes (admin & receptionist)
router.get('/pending', authorize('admin', 'receptionist'), controller.getPendingSubmissions);
router.get('/history', authorize('admin', 'receptionist'), controller.getAllPayments);
router.post('/:id/verify', authorize('admin', 'receptionist'), controller.verifyPayment);
router.post('/:id/reject', authorize('admin', 'receptionist'), controller.rejectPayment);

module.exports = router;
