require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./config/db');

const BASE_URL = 'http://localhost:5000/api';

async function runE2ETests() {
  console.log('====================================================');
  console.log('  CareHub Mobile App & UPI QR Payment E2E Test Suite');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, detail = '') {
    if (condition) {
      console.log(`[PASS] ${testName}${detail ? ' -> ' + detail : ''}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}${detail ? ' -> ' + detail : ''}`);
      failed++;
    }
  }

  try {
    // 1. Verify Central Bank of India UPI QR Asset exists
    const qrPath = path.join(__dirname, '../mobile/assets/hospital-upi-qr.png');
    const qrExists = fs.existsSync(qrPath);
    const qrStats = qrExists ? fs.statSync(qrPath) : null;
    assert(
      qrExists && qrStats.size === 323911,
      '1. Central Bank of India UPI QR asset exists in mobile/assets',
      `Size: ${qrStats?.size} bytes`
    );

    // 2. Authentication: Login as Patient and Receptionist
    const patLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'patient@hospital.com', password: 'Hospital@123' }),
    }).then((r) => r.json());

    assert(
      patLogin.token && patLogin.user?.role === 'patient',
      '2. Patient login successful and role verified',
      `User: ${patLogin.user?.name}`
    );
    const patientToken = patLogin.token;

    const recepLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'reception@hospital.com', password: 'Hospital@123' }),
    }).then((r) => r.json());

    assert(
      recepLogin.token && recepLogin.user?.role === 'receptionist',
      '3. Receptionist login successful and role verified',
      `User: ${recepLogin.user?.name}`
    );
    const receptionistToken = recepLogin.token;

    // 3. Browse Doctors and check consultation fee
    const doctorsRes = await fetch(`${BASE_URL}/doctors`, {
      headers: { Authorization: `Bearer ${patientToken}` },
    }).then((r) => r.json());

    const hasFees = doctorsRes.length > 0 && doctorsRes.every((d) => Number(d.consultation_fee) > 0);
    assert(
      hasFees,
      '4. Doctors retrieved with authoritative consultation fees',
      `Found ${doctorsRes.length} doctors, fee range: ₹${doctorsRes[0]?.consultation_fee}`
    );
    const selectedDoctor = doctorsRes[0];

    // 4. Check available slots
    const testDate = new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 10);
    const slotsRes = await fetch(
      `${BASE_URL}/appointments/slots?doctor_id=${selectedDoctor.doctor_id}&date=${testDate}`,
      { headers: { Authorization: `Bearer ${patientToken}` } }
    ).then((r) => r.json());

    assert(Array.isArray(slotsRes) && slotsRes.length > 0, '5. Available appointment slots retrieved', `Slots count: ${slotsRes.length}`);
    const selectedSlot = slotsRes[0];

    // 5. Book Appointment - Verify transactional creation of Appointment, Bill & Payment
    const bookRes = await fetch(`${BASE_URL}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patientToken}`,
      },
      body: JSON.stringify({
        doctor_id: selectedDoctor.doctor_id,
        appointment_date: testDate,
        appointment_time: selectedSlot,
        reason: 'E2E automated mobile test consultation',
      }),
    });

    const bookData = await bookRes.json();
    assert(
      bookRes.status === 201 &&
        bookData.appointment_id &&
        bookData.bill_id &&
        Number(bookData.bill_amount) === Number(selectedDoctor.consultation_fee) &&
        bookData.payment_status === 'Awaiting Payment',
      '6. Appointment booked with atomic Bill & Payment creation',
      `Appt #${bookData.appointment_id}, Bill #${bookData.bill_id}, Amount: ₹${bookData.bill_amount}, Status: ${bookData.payment_status}`
    );

    const testBillId = bookData.bill_id;
    const testApptId = bookData.appointment_id;

    // 6. Test Patient Security Isolation: Patient cannot verify payments
    const illegalVerify = await fetch(`${BASE_URL}/payments/${bookData.payment_id}/verify`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${patientToken}` },
    });
    assert(illegalVerify.status === 403, '7. Patient forbidden from unauthorized payment verification endpoint (403)');

    // 7. Patient submits UPI payment transaction reference (UTR)
    const testUtr = 'UPI-E2E-' + Date.now();
    const submitRes = await fetch(`${BASE_URL}/payments/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patientToken}`,
      },
      body: JSON.stringify({
        bill_id: testBillId,
        transaction_ref: testUtr,
        notes: 'Paid via Central Bank of India QR via Google Pay',
      }),
    });

    const submitData = await submitRes.json();
    assert(
      submitRes.status === 200 &&
        submitData.payment?.payment_status === 'Pending Verification' &&
        submitData.payment?.transaction_ref === testUtr,
      '8. Payment submitted: state transitioned to "Pending Verification"',
      `UTR: ${submitData.payment?.transaction_ref}`
    );

    const paymentId = submitData.payment.payment_id;

    // 8. Receipt must NOT be issued while status is Pending Verification
    const prematureReceipt = await fetch(`${BASE_URL}/payments/receipt/${paymentId}`, {
      headers: { Authorization: `Bearer ${patientToken}` },
    });
    assert(
      prematureReceipt.status === 400,
      '9. Premature receipt strictly prevented for Pending Verification payments (400)'
    );

    // 9. Receptionist reviews Pending Submissions Queue
    const pendingQueue = await fetch(`${BASE_URL}/payments/pending`, {
      headers: { Authorization: `Bearer ${receptionistToken}` },
    }).then((r) => r.json());

    const inQueue = pendingQueue.some((p) => p.payment_id === paymentId && p.transaction_ref === testUtr);
    assert(inQueue, '10. Submitted payment visible in Receptionist Pending Verification Queue');

    // 10. Receptionist Verifies and Confirms Payment
    const verifyRes = await fetch(`${BASE_URL}/payments/${paymentId}/verify`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${receptionistToken}` },
    });
    const verifyData = await verifyRes.json();

    assert(
      verifyRes.status === 200 &&
        verifyData.payment?.payment_status === 'Paid' &&
        verifyData.payment?.verified_at,
      '11. Receptionist verified payment: state transitioned to "Paid" with verifier audit timestamp'
    );

    // 11. Verify underlying bill is marked Paid
    const [billCheck] = await pool.query('SELECT status FROM bill WHERE bill_id = ?', [testBillId]);
    assert(billCheck[0]?.status === 'Paid', '12. Underlying bill status updated atomically to "Paid"');

    // 12. Retrieve Official Verified Receipt
    const receiptRes = await fetch(`${BASE_URL}/payments/receipt/${paymentId}`, {
      headers: { Authorization: `Bearer ${patientToken}` },
    });
    const receiptData = await receiptRes.json();

    assert(
      receiptRes.status === 200 &&
        receiptData.receipt_number &&
        receiptData.receipt_number.startsWith('CH-REC-') &&
        receiptData.financials?.payment_status === 'Paid' &&
        receiptData.financials?.bank_channel.includes('Central Bank of India'),
      '13. Official verified receipt generated with Central Bank of India channel details',
      `Receipt No: ${receiptData.receipt_number}`
    );

    // 13. Rejection Workflow Test
    // Create another appointment and submit payment, then reject
    const bookRes2 = await fetch(`${BASE_URL}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patientToken}`,
      },
      body: JSON.stringify({
        doctor_id: selectedDoctor.doctor_id,
        appointment_date: testDate,
        appointment_time: slotsRes[1],
        reason: 'Rejection lifecycle verification test',
      }),
    }).then((r) => r.json());

    const submitRes2 = await fetch(`${BASE_URL}/payments/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patientToken}`,
      },
      body: JSON.stringify({
        bill_id: bookRes2.bill_id,
        transaction_ref: 'INVALID-UTR-000',
        notes: 'Testing rejection scenario',
      }),
    }).then((r) => r.json());

    const rejectRes = await fetch(`${BASE_URL}/payments/${submitRes2.payment.payment_id}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${receptionistToken}`,
      },
      body: JSON.stringify({
        reason: 'Transaction reference not found in Central Bank of India hospital statement.',
      }),
    });
    const rejectData = await rejectRes.json();

    assert(
      rejectRes.status === 200 &&
        rejectData.payment?.payment_status === 'Rejected' &&
        rejectData.payment?.rejection_reason.includes('Central Bank of India'),
      '14. Receptionist rejected payment with mandatory audit reason',
      `Reason: ${rejectData.payment?.rejection_reason}`
    );

    console.log('\n====================================================');
    console.log(`  Tests Passed: ${passed} | Tests Failed: ${failed}`);
    console.log('====================================================\n');

    process.exit(failed === 0 ? 0 : 1);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runE2ETests();
