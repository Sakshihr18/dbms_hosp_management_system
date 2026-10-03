import { useEffect, useState } from 'react';
import api from '../../services/api';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Modal from '../../components/Modal';
import Table from '../../components/Table';

export default function AdminDepartments() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ department_name: '', description: '' });
  const [error, setError] = useState('');

  const load = () => api.get('/departments').then((res) => setRows(res.data)).catch((err) => setError(err.message));
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.put(`/departments/${editing.department_id}`, form);
      else await api.post('/departments', form);
      setOpen(false);
      setEditing(null);
      setForm({ department_name: '', description: '' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Card title="Departments" action={<Button onClick={() => { setEditing(null); setForm({ department_name: '', description: '' }); setOpen(true); }}>Add Department</Button>}>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <Table rows={rows} columns={[
        { key: 'department_name', label: 'Name' },
        { key: 'description', label: 'Description' },
        { key: 'actions', label: '', render: (r) => <Button variant="secondary" onClick={() => { setEditing(r); setForm(r); setOpen(true); }}>Edit</Button> },
      ]} />
      <Modal open={open} title={editing ? 'Edit Department' : 'Add Department'} onClose={() => setOpen(false)}>
        <form onSubmit={save} className="grid gap-3">
          <Input label="Name" value={form.department_name} onChange={(e) => setForm({ ...form, department_name: e.target.value })} required />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          <Button type="submit">Save</Button>
        </form>
      </Modal>
    </Card>
  );
}
