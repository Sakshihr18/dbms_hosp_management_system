import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user } = useAuth();
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div>
        <p className="text-sm text-slate-500">Hospital Management System</p>
        <p className="font-semibold text-slate-800">Welcome, {user?.name}</p>
      </div>
      <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium capitalize text-brand-800">
        {user?.role}
      </span>
    </header>
  );
}
