import { useEffect, useState } from 'react';
import api from '../../services/api';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ConfirmDialog from '../../components/ConfirmDialog';
import Input from '../../components/Input';
import Modal from '../../components/Modal';
import Select from '../../components/Select';
import Table from '../../components/Table';

const empty = { name: '', email: '', password: '', department_id: '', specialization: '', phone: '', experience: '' };

export default function AdminDoctors() {
  const [rows, setRows] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(null);

  const load = () => {
    api.get('/doctors', { params: departmentId ? { department_id: departmentId } : {} })
      .then((res) => setRows(res.data))
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    api.get('/departments').then((res) => setDepartments(res.data));
  }, []);

  useEffect(() => { load(); }, [departmentId]);

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.put(`/doctors/${editing.doctor_id}`, form);
      else await api.post('/doctors', form);
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
      title="Doctors"
      action={
        <div className="flex gap-2">
          <Select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            options={[{ value: '', label: 'All departments' }, ...departments.map((d) => ({ value: d.department_id, label: d.department_name }))]}
          />
          <Button onClick={() => { setEditing(null); setForm(empty); setOpen(true); }}>Add Doctor</Button>
        </div>
      }
    >
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <Table
        rows={rows}
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'department_name', label: 'Department' },
          { key: 'specialization', label: 'Specialization' },
          { key: 'phone', label: 'Phone' },
          { key: 'experience', label: 'Experience' },
          { key: 'is_active', label: 'Status', render: (r) => (r.is_active ? 'Active' : 'Inactive') },
          { key: 'actions', label: '', render: (r) => (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => { setEditing(r); setForm({ ...r, password: '' }); setOpen(true); }}>Edit</Button>
              {r.is_active ? <Button variant="danger" onClick={() => setConfirm(r)}>Deactivate</Button> : null}
            </div>
          ) },
        ]}
      />
      <Modal open={open} title={editing ? 'Edit Doctor' : 'Add Doctor'} onClose={() => setOpen(false)}>
        <form onSubmit={save} className="grid gap-3">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          {!editing && <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />}
          {!editing && <Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />}
          <Select label="Department" value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })} options={[{ value: '', label: 'Select' }, ...departments.map((d) => ({ value: d.department_id, label: d.department_name }))]} />
          <Input label="Specialization" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} required />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          <Input label="Experience (years)" type="number" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} required />
          <Button type="submit">Save</Button>
        </form>
      </Modal>
      <ConfirmDialog
        open={!!confirm}
        title="Deactivate doctor"
        message="This doctor will no longer be able to log in."
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          await api.delete(`/doctors/${confirm.doctor_id}`);
          setConfirm(null);
          load();
        }}
      />
    </Card>
  );
}
