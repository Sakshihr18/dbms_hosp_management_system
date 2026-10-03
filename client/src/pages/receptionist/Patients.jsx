import { useEffect, useState } from 'react';
import api from '../../services/api';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Modal from '../../components/Modal';
import Select from '../../components/Select';
import Table from '../../components/Table';

const empty = { name: '', email: '', password: '', dob: '', gender: 'Female', blood_group: 'O+', phone: '', address: '', emergency_contact: '' };

export default function ReceptionistPatients() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  const load = () => api.get('/patients', { params: { search } }).then((res) => setRows(res.data)).catch((err) => setError(err.message));
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.put(`/patients/${editing.patient_id}`, form);
      else await api.post('/patients', form);
      setOpen(false);
      setEditing(null);
      setForm(empty);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Card
      title="Patients"
      action={
        <div className="flex gap-2">
          <Input placeholder="Search name, phone or ID" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} />
          <Button onClick={() => { setEditing(null); setForm(empty); setOpen(true); }}>Register Patient</Button>
        </div>
      }
    >
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <Table rows={rows} columns={[
        { key: 'patient_id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'phone', label: 'Phone' },
        { key: 'email', label: 'Email' },
        { key: 'actions', label: '', render: (r) => (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setSelected(r)}>View</Button>
            <Button variant="secondary" onClick={() => { setEditing(r); setForm(r); setOpen(true); }}>Edit</Button>
          </div>
        ) },
      ]} />
      <Modal open={open} title={editing ? 'Edit Patient' : 'Register Patient'} onClose={() => setOpen(false)}>
        <form onSubmit={save} className="grid max-h-[70vh] gap-3 overflow-y-auto">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          {!editing && <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />}
          {!editing && <Input label="Password" type="password" value={form.password || ''} onChange={(e) => setForm({ ...form, password: e.target.value })} required />}
          <Input label="Date of Birth" type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} required />
          <Select label="Gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} options={[{ value: 'Female', label: 'Female' }, { value: 'Male', label: 'Male' }, { value: 'Other', label: 'Other' }]} />
          <Select label="Blood Group" value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value })} options={['A+','A-','B+','B-','O+','O-','AB+','AB-'].map((v) => ({ value: v, label: v }))} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
          <Input label="Emergency Contact" value={form.emergency_contact} onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })} required />
          <Button type="submit">Save</Button>
        </form>
      </Modal>
      <Modal open={!!selected} title="Patient details" onClose={() => setSelected(null)}>
        {selected && (
          <div className="space-y-1 text-sm">
            <p><b>ID:</b> {selected.patient_id}</p>
            <p><b>Name:</b> {selected.name}</p>
            <p><b>Phone:</b> {selected.phone}</p>
            <p><b>Email:</b> {selected.email}</p>
            <p><b>DOB:</b> {selected.dob}</p>
            <p><b>Gender:</b> {selected.gender}</p>
            <p><b>Blood Group:</b> {selected.blood_group}</p>
            <p><b>Address:</b> {selected.address}</p>
            <p><b>Emergency:</b> {selected.emergency_contact}</p>
          </div>
        )}
      </Modal>
    </Card>
  );
}
