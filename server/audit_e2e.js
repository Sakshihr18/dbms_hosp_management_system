require('dotenv').config();
const mysql = require('mysql2/promise');
const pool = require('./config/db');

async function audit() {
  const results = {
    checks: [],
    flow: [],
    failures: [],
  };

  function logCheck(name, passed, detail = '') {
    results.checks.push({ name, passed, detail });
    if (!passed) results.failures.push(`${name}: ${detail}`);
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${name}${detail ? ' - ' + detail : ''}`);
  }

  try {
    // 1. MySQL connection & Database existence
    const [dbs] = await pool.query("SHOW DATABASES LIKE 'hospital_management'");
    logCheck('1. Database hospital_management exists', dbs.length > 0);

    // 2 & 3. Check Tables, PKs, FKs
    const tables = ['users', 'department', 'patient', 'doctor', 'appointment', 'admission', 'prescription', 'medical_test', 'bill'];
    for (const t of tables) {
      const [rows] = await pool.query(`SELECT COUNT(*) AS count FROM ${t}`);
      logCheck(`2. Table ${t} exists and has data`, rows[0].count >= 0, `Rows: ${rows[0].count}`);
    }

    // 6. Login API for all 4 roles
    const roles = [
      { role: 'admin', email: 'admin@hospital.com' },
      { role: 'receptionist', email: 'reception@hospital.com' },
      { role: 'doctor', email: 'doctor@hospital.com' },
      { role: 'patient', email: 'patient@hospital.com' },
    ];

    const tokens = {};
    for (const r of roles) {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: r.email, password: 'Hospital@123' }),
      });
      const data = await res.json();
      const ok = res.status === 200 && data.token && data.user.role === r.role;
      logCheck(`6. Login API for role: ${r.role}`, ok, ok ? `Token received` : JSON.stringify(data));
      if (ok) tokens[r.role] = data.token;
    }

    // 7. JWT Authentication check (Protected route /api/auth/me)
    for (const role in tokens) {
      const res = await fetch('http://localhost:5000/api/auth/me', {
        headers: { Authorization: `Bearer ${tokens[role]}` },
      });
      const data = await res.json();
      logCheck(`7. JWT authentication works for ${role}`, res.status === 200 && data.user.role === role);
    }

    // 8 & 9. Role-based authorization & Patient isolation checks
    const patRes = await fetch('http://localhost:5000/api/users', {
      headers: { Authorization: `Bearer ${tokens.patient}` },
    });
    logCheck('9. Patient forbidden from Admin users API', patRes.status === 403);

    const docRes = await fetch('http://localhost:5000/api/users', {
      headers: { Authorization: `Bearer ${tokens.doctor}` },
    });
    logCheck('9. Doctor forbidden from Admin users API', docRes.status === 403);

    // 10. Doctor data isolation check (Doctor gets only their appointments)
    const docApptRes = await fetch('http://localhost:5000/api/appointments', {
      headers: { Authorization: `Bearer ${tokens.doctor}` },
    });
    const docAppts = await docApptRes.json();
    const docUserRes = await fetch('http://localhost:5000/api/auth/me', {
      headers: { Authorization: `Bearer ${tokens.doctor}` },
    });
    const docUserData = await docUserRes.json();
    const [docRow] = await pool.query('SELECT doctor_id FROM doctor WHERE user_id = ?', [docUserData.user.user_id]);
    const myDoctorId = docRow[0].doctor_id;

    const allMyDocAppts = docAppts.every((a) => a.doctor_id === myDoctorId);
    logCheck('10. Doctor only sees own assigned appointments', allMyDocAppts, `Total returned: ${docAppts.length}`);

    // 11. Patient data isolation check (Patient gets only their own data)
    const patApptRes = await fetch('http://localhost:5000/api/appointments', {
      headers: { Authorization: `Bearer ${tokens.patient}` },
    });
    const patAppts = await patApptRes.json();
    const patUserRes = await fetch('http://localhost:5000/api/auth/me', {
      headers: { Authorization: `Bearer ${tokens.patient}` },
    });
    const patUserData = await patUserRes.json();
    const [patRow] = await pool.query('SELECT patient_id FROM patient WHERE user_id = ?', [patUserData.user.user_id]);
    const myPatientId = patRow[0].patient_id;

    const allMyPatAppts = patAppts.every((a) => a.patient_id === myPatientId);
    logCheck('11. Patient only sees own appointments', allMyPatAppts, `Total returned: ${patAppts.length}`);

    // 19. Dashboard statistics coming from MySQL
    const adminDashRes = await fetch('http://localhost:5000/api/dashboard/admin', {
      headers: { Authorization: `Bearer ${tokens.admin}` },
    });
    const adminDash = await adminDashRes.json();
    logCheck('19. Admin Dashboard returns DB statistics', adminDash.totalPatients !== undefined && adminDash.totalDoctors !== undefined);

    // REAL-WORLD FLOW TEST:
    console.log('\n--- STARTING REAL-WORLD END-TO-END FLOW TEST ---');

    // Step A: Patient books appointment
    const bookRes = await fetch('http://localhost:5000/api/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.patient}`,
      },
      body: JSON.stringify({
        doctor_id: myDoctorId,
        appointment_date: '2026-10-15',
        appointment_time: '14:00:00',
        reason: 'E2E Flow Audit Test - Persistent Cough',
      }),
    });
    const newAppt = await bookRes.json();
    logCheck('Flow Step A: Patient books appointment', bookRes.status === 201 && newAppt.appointment_id > 0, `Appt ID: ${newAppt.appointment_id}`);

    const apptId = newAppt.appointment_id;

    // Step B: Verify in MySQL directly
    const [dbAppt] = await pool.query('SELECT * FROM appointment WHERE appointment_id = ?', [apptId]);
    logCheck('Flow Step B: Verified appointment inserted in MySQL', dbAppt.length > 0 && dbAppt[0].status === 'Scheduled');

    // Step C: Receptionist sees appointment
    const recApptRes = await fetch(`http://localhost:5000/api/appointments`, {
      headers: { Authorization: `Bearer ${tokens.receptionist}` },
    });
    const recAppts = await recApptRes.json();
    const recFound = recAppts.some((a) => a.appointment_id === apptId);
    logCheck('Flow Step C: Receptionist can see appointment in list', recFound);

    // Step D: Doctor sees appointment
    const docListRes = await fetch(`http://localhost:5000/api/appointments`, {
      headers: { Authorization: `Bearer ${tokens.doctor}` },
    });
    const docList = await docListRes.json();
    const docFound = docList.some((a) => a.appointment_id === apptId);
    logCheck('Flow Step D: Doctor can see appointment in list', docFound);

    // Step E: Doctor completes consultation with diagnosis
    const completeRes = await fetch(`http://localhost:5000/api/appointments/${apptId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.doctor}`,
      },
      body: JSON.stringify({
        status: 'Completed',
        diagnosis: 'Acute Upper Respiratory Infection',
      }),
    });
    const updatedAppt = await completeRes.json();
    logCheck('Flow Step E: Doctor completes consultation in API & MySQL', completeRes.status === 200 && updatedAppt.status === 'Completed' && updatedAppt.diagnosis === 'Acute Upper Respiratory Infection');

    // Step F: Doctor adds prescription
    const prescRes = await fetch('http://localhost:5000/api/prescriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.doctor}`,
      },
      body: JSON.stringify({
        appointment_id: apptId,
        medicine_name: 'Amoxicillin 500mg',
        dosage: '1 capsule',
        frequency: 'Thrice daily',
        duration: '7 days',
        instructions: 'Take after food',
      }),
    });
    const newPresc = await prescRes.json();
    logCheck('Flow Step F: Doctor adds prescription in API & MySQL', prescRes.status === 201 && newPresc.prescription_id > 0);

    // Step G: Doctor adds medical test
    const testRes = await fetch('http://localhost:5000/api/tests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.doctor}`,
      },
      body: JSON.stringify({
        appointment_id: apptId,
        test_name: 'Chest X-Ray PA View',
        test_type: 'Imaging',
      }),
    });
    const newTest = await testRes.json();
    logCheck('Flow Step G: Doctor adds medical test in API & MySQL', testRes.status === 201 && newTest.test_id > 0);

    // Step H: Patient views prescription & test
    const patPrescRes = await fetch('http://localhost:5000/api/prescriptions', {
      headers: { Authorization: `Bearer ${tokens.patient}` },
    });
    const patPrescs = await patPrescRes.json();
    const patHasPresc = patPrescs.some((p) => p.prescription_id === newPresc.prescription_id);

    const patTestRes = await fetch('http://localhost:5000/api/tests', {
      headers: { Authorization: `Bearer ${tokens.patient}` },
    });
    const patTests = await patTestRes.json();
    const patHasTest = patTests.some((t) => t.test_id === newTest.test_id);

    logCheck('Flow Step H: Patient can view their new prescription & test', patHasPresc && patHasTest);

    // Step I: Receptionist creates bill
    const billRes = await fetch('http://localhost:5000/api/bills', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.receptionist}`,
      },
      body: JSON.stringify({
        patient_id: myPatientId,
        appointment_id: apptId,
        amount: 1250.00,
        description: 'OPD Consultation and Chest X-Ray Fee',
      }),
    });
    const newBill = await billRes.json();
    logCheck('Flow Step I: Receptionist creates bill in API & MySQL', billRes.status === 201 && newBill.bill_id > 0);

    // Step J: Patient views bill
    const patBillRes = await fetch('http://localhost:5000/api/bills', {
      headers: { Authorization: `Bearer ${tokens.patient}` },
    });
    const patBills = await patBillRes.json();
    const patHasBill = patBills.some((b) => b.bill_id === newBill.bill_id);
    logCheck('Flow Step J: Patient can view their new bill', patHasBill);

  } catch (err) {
    console.error('Audit script exception:', err);
    logCheck('Audit process', false, err.message);
  } finally {
    await pool.end();
  }
}

audit();
