# CareHub — Hospital Management System

A full-stack, role-based Hospital Management System designed to digitize and streamline hospital operations across clinical, administrative, inpatient, and financial workflows.

---

## 📌 Overview

**CareHub** is a web-based Hospital Management System that provides a centralized platform for managing patients, doctors, appointments, admissions, medical records, prescriptions, diagnostic tests, billing, and hospital administration.

The system follows a **role-based architecture**, providing dedicated portals and permissions for:

- Admin
- Receptionist
- Doctor
- Patient

CareHub is built using a modern full-stack architecture with **React.js, Node.js, Express.js, and MySQL**. Authentication and authorization are handled using **JWT-based authentication**, secure password hashing with **bcryptjs**, and middleware-based role-based access control.

---

## 🔑 Demo Login Credentials

All demonstration accounts use the default password: **`Hospital@123`**

| Role | Email | Password | Default Portal |
|---|---|---|---|
| **Admin** | `admin@hospital.com` | `Hospital@123` | `/admin/dashboard` |
| **Doctor** | `doctor@hospital.com` | `Hospital@123` | `/doctor/dashboard` |
| **Receptionist** | `reception@hospital.com` | `Hospital@123` | `/receptionist/dashboard` |
| **Patient** | `patient@hospital.com` | `Hospital@123` | `/patient/dashboard` |

<details>
<summary><b>View Additional Seeded Accounts</b></summary>

- **Other Doctors:**
  - `priya.nair@hospital.com` (Neurology)
  - `rohan.sharma@hospital.com` (Orthopedics)
  - `ananya.iyer@hospital.com` (Internal Medicine)
  - `vikram.reddy@hospital.com` (Pediatrics)
- **Other Receptionists:**
  - `reception2@hospital.com`
- **Other Patients:**
  - `sanjay.patel@hospital.com`
  - `neha.gupta@hospital.com`
  - `amit.kulkarni@hospital.com`
  - `pooja.singh@hospital.com`

</details>

> 💡 **Tip:** New patients can also self-register via the `/register` page.

---

## 🎯 Objectives

The main objectives of CareHub are to:

- Digitize hospital management processes.
- Centralize patient and medical information.
- Simplify appointment and admission management.
- Provide secure role-based access to hospital resources.
- Maintain electronic health records.
- Streamline prescription and diagnostic workflows.
- Automate billing and payment management.
- Provide dashboards and analytics for different hospital roles.
- Maintain data consistency using a relational database.

---

## ✨ Key Features

### 🔐 Authentication & Authorization

- JWT-based authentication
- Secure password hashing using bcryptjs
- Role-based access control
- Protected routes and APIs
- Separate portals for different user roles

### 👨‍💼 Admin Portal

Administrators can:

- Manage users
- Manage departments
- Manage doctors
- Manage patients
- Manage appointments
- Manage admissions
- Manage billing
- Monitor hospital activities
- View dashboards and analytics

### 🧑‍💻 Receptionist Portal

Receptionists can:

- Register patients
- Manage patient information
- Schedule appointments
- Manage admissions
- Manage billing
- View appointment schedules

### 👨‍⚕️ Doctor Portal

Doctors can:

- View assigned appointments
- Manage consultations
- Access patient medical history
- Create medical records
- Issue e-prescriptions
- Order diagnostic tests
- View test results
- Manage patient treatment information

### 🧑‍🤝‍🧑 Patient Portal

Patients can:

- View their profile
- Book appointments
- View appointments
- View prescriptions
- View medical records
- View diagnostic test results
- View billing information
- Track their hospital-related information

---

## 🏥 Core Modules

| Module | Description |
|---|---|
| Authentication | Login, registration and authorization |
| User Management | Manage hospital system users |
| Department Management | Manage hospital departments |
| Doctor Management | Manage doctors and their details |
| Patient Management | Register and manage patients |
| Appointment Management | Schedule and manage appointments |
| Admission Management | Manage inpatient admissions |
| EHR / Medical History | Maintain electronic medical records |
| E-Prescription | Create and manage prescriptions |
| Diagnostic Tests | Order and manage medical tests |
| Billing | Generate and manage patient bills |
| Payments | Track payment information |
| Dashboard | Display role-specific statistics and analytics |

---

## 🛠️ Tech Stack

### Frontend

- React 18
- Vite
- Tailwind CSS
- React Router
- Axios
- Recharts

### Backend

- Node.js
- Express.js
- REST API
- JWT
- bcryptjs

### Mobile Application

- React Native 0.86
- Expo SDK 57 (Expo Go compatible)
- TypeScript
- React Navigation (Bottom Tabs + Native Stack)
- Axios with JWT Interceptors & AsyncStorage persistence
- Central Bank of India UPI QR display with Share & Download features

### Database

- MySQL 8
- Relational database design with Foreign Keys, CHECK constraints, and optimized indexes
- New `payment` table tracking UPI transaction references, verification timestamps, and staff audit trails
- Added `consultation_fee` in `doctor` table

---

## 🏗️ System Architecture

```text
       ┌──────────────────────┐             ┌───────────────────────────┐
       │   CareHub Web UI     │             │    CareHub Mobile App     │
       │   React 18 + Vite    │             │   React Native + Expo     │
       │   Tailwind CSS       │             │   TypeScript (Expo Go)    │
       └──────────┬───────────┘             └─────────────┬─────────────┘
                  │                                       │
                  │              HTTP / REST API          │
                  └───────────────────┬───────────────────┘
                                      │
                                      ▼
                           ┌──────────────────────┐
                           │    Express Server    │
                           │      Node.js         │
                           └──────────┬───────────┘
                                      │
                       ┌──────────────┼──────────────┐
                       │              │              │
                       ▼              ▼              ▼
                 ┌──────────┐   ┌───────────┐  ┌────────────┐
                 │   JWT    │   │Middleware │  │ Controllers│
                 │   Auth   │   │   RBAC    │  │  & Routes  │
                 └──────────┘   └───────────┘  └────────────┘
                                      │
                                      ▼
                           ┌──────────────────────┐
                           │       MySQL 8        │
                           │   Relational DB      │
                           └──────────────────────┘
```

---

## 📱 Patient Mobile App & UPI QR Payments

The mobile patient application (`mobile/`) connects directly to the CareHub backend and database:

1. **Authentication**: Patients sign in or register with their medical demographics. Only patient accounts are permitted; staff are guided to the web portal.
2. **Specialist Browsing & Booking**: Real-time department browsing, doctor selection with consultation fees, live slot availability, and atomic appointment & bill creation.
3. **Central Bank of India UPI QR Terminal**:
   - Displays the authentic **Central Bank of India - 5027 Primary** QR code (`mobile/assets/hospital-upi-qr.png`).
   - Clearly presents Booking ID, Bill Reference, Doctor, and server-calculated amount.
   - Built-in **Share QR** and **Download QR** actions.
4. **Payment Verification Lifecycle**:
   - `Appointment Booked → Bill Created → Awaiting Payment → Pending Verification → Paid (or Rejected)`
   - Patient clicks **"I Have Completed Payment"** and enters the 12-digit UPI UTR number.
   - Status transitions to **Pending Verification**. (A button click or screenshot is never accepted as automatic receipt of funds).
   - Authorized hospital receptionist or admin verifies the credit in the bank statement through the web dashboard.
5. **Official Digital Receipt**:
   - Generated strictly from verified backend records.
   - Includes receipt number (`CH-REC-xxxxxx`), patient details, doctor, verified amount, bank channel, UTR, and verifier audit timestamp.

---

## 🚀 Getting Started & Local Setup

### 1. Database Setup & Migration

```bash
cd server
node migrate.js
```
*(Or run `npm run seed` for a fresh database with all seed accounts).*

### 2. Start the Backend Server

```bash
cd server
npm start
```
The API runs on `http://localhost:5000` (or `http://YOUR_COMPUTER_LAN_IP:5000`).

### 3. Start the Web Frontend

```bash
cd client
npm run dev
```
Open `http://localhost:5173` to access the Admin, Receptionist, Doctor, or Patient web portals.

### 4. Start the Expo Mobile App (for Expo Go)

1. Open `mobile/.env` and verify `EXPO_PUBLIC_API_URL` uses your computer's local Wi-Fi IPv4 address (e.g. `http://192.168.1.44:5000/api`).
   *(Do NOT use `localhost` because on a physical phone, `localhost` refers to the phone itself).*
2. Ensure your mobile phone and computer are on the same Wi-Fi network.
3. Start the Expo development server:
   ```bash
   cd mobile
   npx expo start
   ```
4. Open **Expo Go** on your Android or iOS device:
   - On Android: Scan the QR code displayed in the terminal.
   - On iOS: Scan the QR code using the Camera app.
5. Sign in using `patient@hospital.com` / `Hospital@123` or register a new patient account.