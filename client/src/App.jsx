import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Unauthorized from './pages/auth/Unauthorized';
import AdminDashboard from './pages/admin/Dashboard';
import AdminPatients from './pages/admin/Patients';
import AdminDoctors from './pages/admin/Doctors';
import AdminDepartments from './pages/admin/Departments';
import AdminAppointments from './pages/admin/Appointments';
import AdminAdmissions from './pages/admin/Admissions';
import AdminBills from './pages/admin/Bills';
import AdminUsers from './pages/admin/Users';
import ReceptionDashboard from './pages/receptionist/Dashboard';
import ReceptionPatients from './pages/receptionist/Patients';
import ReceptionAppointments from './pages/receptionist/Appointments';
import ReceptionAdmissions from './pages/receptionist/Admissions';
import ReceptionBills from './pages/receptionist/Bills';
import DoctorDashboard from './pages/doctor/Dashboard';
import DoctorAppointments from './pages/doctor/Appointments';
import DoctorPatients from './pages/doctor/Patients';
import DoctorPrescriptions from './pages/doctor/Prescriptions';
import DoctorTests from './pages/doctor/Tests';
import DoctorHistory from './pages/doctor/PatientHistory';
import PatientDashboard from './pages/patient/Dashboard';
import PatientProfile from './pages/patient/Profile';
import BookAppointment from './pages/patient/BookAppointment';
import PatientAppointments from './pages/patient/Appointments';
import MedicalHistory from './pages/patient/MedicalHistory';
import PatientPrescriptions from './pages/patient/Prescriptions';
import PatientTests from './pages/patient/Tests';
import PatientBills from './pages/patient/Bills';

function RoleLayout({ roles, children }) {
  return (
    <ProtectedRoute roles={roles}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  const { user, loading, roleHome } = useAuth();

  if (loading) return <LoadingSpinner />;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={roleHome[user.role]} replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={roleHome[user.role]} replace /> : <Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route path="/admin/dashboard" element={<RoleLayout roles={['admin']}><AdminDashboard /></RoleLayout>} />
      <Route path="/admin/patients" element={<RoleLayout roles={['admin']}><AdminPatients /></RoleLayout>} />
      <Route path="/admin/doctors" element={<RoleLayout roles={['admin']}><AdminDoctors /></RoleLayout>} />
      <Route path="/admin/departments" element={<RoleLayout roles={['admin']}><AdminDepartments /></RoleLayout>} />
      <Route path="/admin/appointments" element={<RoleLayout roles={['admin']}><AdminAppointments /></RoleLayout>} />
      <Route path="/admin/admissions" element={<RoleLayout roles={['admin']}><AdminAdmissions /></RoleLayout>} />
      <Route path="/admin/bills" element={<RoleLayout roles={['admin']}><AdminBills /></RoleLayout>} />
      <Route path="/admin/users" element={<RoleLayout roles={['admin']}><AdminUsers /></RoleLayout>} />

      <Route path="/receptionist/dashboard" element={<RoleLayout roles={['receptionist']}><ReceptionDashboard /></RoleLayout>} />
      <Route path="/receptionist/patients" element={<RoleLayout roles={['receptionist']}><ReceptionPatients /></RoleLayout>} />
      <Route path="/receptionist/appointments" element={<RoleLayout roles={['receptionist']}><ReceptionAppointments /></RoleLayout>} />
      <Route path="/receptionist/admissions" element={<RoleLayout roles={['receptionist']}><ReceptionAdmissions /></RoleLayout>} />
      <Route path="/receptionist/bills" element={<RoleLayout roles={['receptionist']}><ReceptionBills /></RoleLayout>} />

      <Route path="/doctor/dashboard" element={<RoleLayout roles={['doctor']}><DoctorDashboard /></RoleLayout>} />
      <Route path="/doctor/appointments" element={<RoleLayout roles={['doctor']}><DoctorAppointments /></RoleLayout>} />
      <Route path="/doctor/patients" element={<RoleLayout roles={['doctor']}><DoctorPatients /></RoleLayout>} />
      <Route path="/doctor/prescriptions" element={<RoleLayout roles={['doctor']}><DoctorPrescriptions /></RoleLayout>} />
      <Route path="/doctor/tests" element={<RoleLayout roles={['doctor']}><DoctorTests /></RoleLayout>} />
      <Route path="/doctor/patients/:id" element={<RoleLayout roles={['doctor']}><DoctorHistory /></RoleLayout>} />

      <Route path="/patient/dashboard" element={<RoleLayout roles={['patient']}><PatientDashboard /></RoleLayout>} />
      <Route path="/patient/profile" element={<RoleLayout roles={['patient']}><PatientProfile /></RoleLayout>} />
      <Route path="/patient/book" element={<RoleLayout roles={['patient']}><BookAppointment /></RoleLayout>} />
      <Route path="/patient/appointments" element={<RoleLayout roles={['patient']}><PatientAppointments /></RoleLayout>} />
      <Route path="/patient/history" element={<RoleLayout roles={['patient']}><MedicalHistory /></RoleLayout>} />
      <Route path="/patient/prescriptions" element={<RoleLayout roles={['patient']}><PatientPrescriptions /></RoleLayout>} />
      <Route path="/patient/tests" element={<RoleLayout roles={['patient']}><PatientTests /></RoleLayout>} />
      <Route path="/patient/bills" element={<RoleLayout roles={['patient']}><PatientBills /></RoleLayout>} />

      <Route path="/" element={<Navigate to={user ? roleHome[user.role] : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
