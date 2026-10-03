import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import Input from '../../components/Input';

export default function Login() {
  const { user, login, roleHome } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={roleHome[user.role]} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedIn = await login(email, password);
      navigate(roleHome[loggedIn.role]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl md:grid-cols-2">
        <div className="bg-brand-900 p-10 text-white">
          <p className="text-sm uppercase tracking-wide text-teal-200">CareHub Hospital</p>
          <h1 className="mt-3 text-3xl font-bold">Hospital Management System</h1>
          <p className="mt-4 text-sm text-teal-100">
            Sign in to manage appointments, patient records, admissions and billing.
          </p>
        </div>
        <form onSubmit={submit} className="space-y-4 p-8">
          <h2 className="text-xl font-semibold">Login</h2>
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
          <p className="text-sm text-slate-600">
            New patient? <Link className="text-brand-700" to="/register">Create an account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
