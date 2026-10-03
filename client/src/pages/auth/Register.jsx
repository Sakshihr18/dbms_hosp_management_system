import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';

const initial = {
  name: '', email: '', password: '', dob: '', gender: 'Female',
  blood_group: 'O+', phone: '', address: '', emergency_contact: '',
};

export default function Register() {
  const { user, register, roleHome } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={roleHome[user.role]} replace />;

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/patient/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">Patient Registration</h1>
        <p className="mb-6 text-sm text-slate-500">Create a patient account. Staff accounts are created by Admin.</p>
        {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <Input label="Name" name="name" value={form.name} onChange={change} required />
          <Input label="Email" type="email" name="email" value={form.email} onChange={change} required />
          <Input label="Password" type="password" name="password" value={form.password} onChange={change} required />
          <Input label="Date of Birth" type="date" name="dob" value={form.dob} onChange={change} required />
          <Select label="Gender" name="gender" value={form.gender} onChange={change} options={[
            { value: 'Female', label: 'Female' }, { value: 'Male', label: 'Male' }, { value: 'Other', label: 'Other' },
          ]} />
          <Select label="Blood Group" name="blood_group" value={form.blood_group} onChange={change} options={['A+','A-','B+','B-','O+','O-','AB+','AB-'].map((v) => ({ value: v, label: v }))} />
          <Input label="Phone" name="phone" value={form.phone} onChange={change} required />
          <Input label="Emergency Contact" name="emergency_contact" value={form.emergency_contact} onChange={change} required />
          <Input label="Address" name="address" value={form.address} onChange={change} className="md:col-span-2" required />
          <div className="md:col-span-2 flex items-center justify-between">
            <Link to="/login" className="text-sm text-brand-700">Back to login</Link>
            <Button type="submit" disabled={loading}>{loading ? 'Registering...' : 'Register'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
