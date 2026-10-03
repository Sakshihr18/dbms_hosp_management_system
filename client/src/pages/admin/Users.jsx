import { useEffect, useState } from 'react';
import api from '../../services/api';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Modal from '../../components/Modal';
import Table from '../../components/Table';

export default function AdminUsers() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const load = () => api.get('/users').then((res) => setRows(res.data)).catch((err) => setError(err.message));
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users', form);
      setOpen(false);
      setForm({ name: '', email: '', password: '' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Card title="Users" action={<Button onClick={() => setOpen(true)}>Create Receptionist</Button>}>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <Table rows={rows} columns={[
        { key: 'user_id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'role', label: 'Role' },
        { key: 'is_active', label: 'Active', render: (r) => (r.is_active ? 'Yes' : 'No') },
      ]} />
      <Modal open={open} title="Create Receptionist" onClose={() => setOpen(false)}>
        <form onSubmit={save} className="grid gap-3">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <Button type="submit">Create</Button>
        </form>
      </Modal>
    </Card>
  );
}
