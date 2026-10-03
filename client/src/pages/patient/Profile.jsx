import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function PatientProfile() {
  const { profile, setProfile } = useAuth();
  const [loading, setLoading] = useState(!profile);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    phone: '',
    address: '',
    emergency_contact: '',
  });

  useEffect(() => {
    api.get('/auth/me')
      .then((res) => {
        setProfile(res.data.profile);
        if (res.data.profile) {
          setFormData({
            phone: res.data.profile.phone || '',
            address: res.data.profile.address || '',
            emergency_contact: res.data.profile.emergency_contact || '',
          });
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setSubmitting(true);
    try {
      const res = await api.put(`/patients/${profile.patient_id}`, formData);
      setProfile(res.data);
      setMessage('Profile updated successfully.');
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!profile) return <p className="text-center text-slate-500">Patient profile not found.</p>;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
        <p className="text-sm text-slate-500">View and update your personal and emergency contact information.</p>
      </div>

      {message && <p className="rounded bg-emerald-50 p-3 text-sm font-medium text-emerald-700">{message}</p>}
      {error && <p className="rounded bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p>}

      <Card title="Personal Information">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
          <div>
            <p className="text-xs font-medium text-slate-400">Full Name</p>
            <p className="text-base font-semibold text-slate-800">{profile.name}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Email Address</p>
            <p className="text-base font-semibold text-slate-800">{profile.email}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Date of Birth</p>
            <p className="text-base font-semibold text-slate-800">{profile.dob}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Gender / Blood Group</p>
            <p className="text-base font-semibold text-slate-800">{profile.gender} ({profile.blood_group})</p>
          </div>
        </div>
      </Card>

      <Card title="Contact Details">
        {editing ? (
          <form onSubmit={handleUpdate} className="space-y-4">
            <Input
              label="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
            <Input
              label="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />
            <Input
              label="Emergency Contact (Name & Number)"
              value={formData.emergency_contact}
              onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
              required
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-xs font-medium text-slate-400">Phone</p>
              <p className="text-slate-800 font-medium">{profile.phone}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">Address</p>
              <p className="text-slate-800 font-medium">{profile.address}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">Emergency Contact</p>
              <p className="text-slate-800 font-medium">{profile.emergency_contact}</p>
            </div>
            <div className="pt-2">
              <Button onClick={() => setEditing(true)}>Edit Contact Details</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
