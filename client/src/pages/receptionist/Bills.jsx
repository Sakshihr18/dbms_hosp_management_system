import { useEffect, useState } from 'react';
import api from '../../services/api';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Modal from '../../components/Modal';
import Select from '../../components/Select';
import Table from '../../components/Table';

const empty = { patient_id: '', appointment_id: '', admission_id: '', amount: '', description: '' };

export default function ReceptionistBills() {
  const [rows, setRows] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [status, setStatus] = useState('Pending');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');

  const load = () => api.get('/bills', { params: status ? { status } : {} }).then((res) => setRows(res.data)).catch((err) => setError(err.message));
  useEffect(() => { api.get('/patients').then((res) => setPatients(res.data)); }, []);
  useEffect(() => { load(); }, [status]);

  useEffect(() => {
    if (!form.patient_id) return;
    api.get('/appointments').then((res) => setAppointments(res.data.filter((a) => String(a.patient_id) === String(form.patient_id))));
    api.get('/admissions').then((res) => setAdmissions(res.data.filter((a) => String(a.patient_id) === String(form.patient_id))));
  }, [form.patient_id]);

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.post('/bills', {
        ...form,
        appointment_id: form.appointment_id || null,
        admission_id: form.admission_id || null,
      });
      setOpen(false);
      setForm(empty);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Card
      title="Bills"
      action={
        <div className="flex gap-2">
          <Select value={status} onChange={(e) => setStatus(e.target.value)} options={[{ value: '', label: 'All' }, { value: 'Pending', label: 'Pending' }, { value: 'Paid', label: 'Paid' }]} />
          <Button onClick={() => setOpen(true)}>Create Bill</Button>
        </div>
      }
    >
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <Table rows={rows} columns={[
        { key: 'patient_name', label: 'Patient' },
        { key: 'amount', label: 'Amount' },
        { key: 'description', label: 'Description' },
        { key: 'bill_date', label: 'Date' },
        { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
        { key: 'actions', label: '', render: (r) => r.status === 'Pending' ? (
          <Button onClick={async () => { await api.put(`/bills/${r.bill_id}`, { status: 'Paid' }); load(); }}>Mark Paid</Button>
        ) : null },
      ]} />
      <Modal open={open} title="Create Bill" onClose={() => setOpen(false)}>
        <form onSubmit={save} className="grid gap-3">
          <Select label="Patient" value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value, appointment_id: '', admission_id: '' })} options={[{ value: '', label: 'Select patient' }, ...patients.map((p) => ({ value: p.patient_id, label: p.name }))]} />
          <Select label="Appointment (optional)" value={form.appointment_id} onChange={(e) => setForm({ ...form, appointment_id: e.target.value, admission_id: '' })} options={[{ value: '', label: 'None' }, ...appointments.map((a) => ({ value: a.appointment_id, label: `#${a.appointment_id} ${a.appointment_date}` }))]} />
          <Select label="Admission (optional)" value={form.admission_id} onChange={(e) => setForm({ ...form, admission_id: e.target.value, appointment_id: '' })} options={[{ value: '', label: 'None' }, ...admissions.map((a) => ({ value: a.admission_id, label: `#${a.admission_id} Room ${a.room_number}` }))]} />
          <Input label="Amount" type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          <Button type="submit">Save Bill</Button>
        </form>
      </Modal>
    </Card>
  );
}
