import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './Button';

const menus = {
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/patients', label: 'Patients' },
    { to: '/admin/doctors', label: 'Doctors' },
    { to: '/admin/departments', label: 'Departments' },
    { to: '/admin/appointments', label: 'Appointments' },
    { to: '/admin/admissions', label: 'Admissions' },
    { to: '/admin/bills', label: 'Bills' },
    { to: '/admin/users', label: 'Users' },
  ],
  receptionist: [
    { to: '/receptionist/dashboard', label: 'Dashboard' },
    { to: '/receptionist/patients', label: 'Patients' },
    { to: '/receptionist/appointments', label: 'Appointments' },
    { to: '/receptionist/admissions', label: 'Admissions' },
    { to: '/receptionist/bills', label: 'Bills' },
  ],
  doctor: [
    { to: '/doctor/dashboard', label: 'Dashboard' },
    { to: '/doctor/appointments', label: 'My Appointments' },
    { to: '/doctor/patients', label: 'Patients' },
    { to: '/doctor/prescriptions', label: 'Prescriptions' },
    { to: '/doctor/tests', label: 'Medical Tests' },
  ],
  patient: [
    { to: '/patient/dashboard', label: 'Dashboard' },
    { to: '/patient/profile', label: 'My Profile' },
    { to: '/patient/book', label: 'Book Appointment' },
    { to: '/patient/appointments', label: 'My Appointments' },
    { to: '/patient/history', label: 'Medical History' },
    { to: '/patient/prescriptions', label: 'Prescriptions' },
    { to: '/patient/tests', label: 'Medical Tests' },
    { to: '/patient/bills', label: 'Bills' },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = menus[user?.role] || [];

  return (
    <aside className="flex w-64 flex-col bg-brand-900 text-white">
      <div className="px-5 py-6">
        <p className="text-lg font-bold">CareHub</p>
        <p className="text-xs text-teal-100">Hospital Management</p>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `block rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-brand-700' : 'hover:bg-brand-800'}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4">
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => {
            logout();
            navigate('/login');
          }}
        >
          Logout
        </Button>
      </div>
    </aside>
  );
}
