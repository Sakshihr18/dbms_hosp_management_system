import { useEffect, useState } from 'react';
import api from '../../services/api';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ConfirmDialog from '../../components/ConfirmDialog';
import Input from '../../components/Input';
import Modal from '../../components/Modal';
import Select from '../../components/Select';
import Table from '../../components/Table';

const empty = { patient_id: '', department_id: '', doctor_id: '', appointment_date: '', appointment_time: '', reason: '' };

export default function ReceptionistAppointments() {
  const [rows, setRows] = useState([]);
  const [patients, setPatients] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [filters, setFilters] = useState({ date: '', status: '', doctor_id: '' });
  const [form, setForm] = useState(empty);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(null);

  const load = () => {
    const params = {};
    if (filters.date) params.date = filters.date;
    if (filters.status) params.status = filters.status;
    if (filters.doctor_id) params.doctor_id = filters.doctor_id;
    api.get('/appointments', { params }).then((res) => setRows(res.data)).catch((err) => setError(err.message));
  };

  useEffect(() => {
    api.get('/patients').then((res) => setPatients(res.data));
    api.get('/departments').then((res) => setDepartments(res.data));
    api.get('/doctors').then((res) => setDoctors(res.data));
    load();
  }, []);

  useEffect(() => {
    if (!form.department_id) return;
    api.get('/doctors', { params: { department_id: form.department_id } }).then((res) => setDoctors(res.data));
    setForm((f) => ({ ...f, doctor_id: '' }));
  }, [form.department_id]);

  useEffect(() => {
    if (!form.doctor_id || !form.appointment_date) return;
    api.get('/appointments/slots', { params: { doctor_id: form.doctor_id, date: form.appointment_date } })
      .then((res) => setSlots(res.data));
  }, [form.doctor_id, form.appointment_date]);

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.post('/appointments', form);
      setOpen(false);
      setForm(empty);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Card title="Appointments" action={<Button onClick={() => setOpen(true)}>Create Appointment</Button>}>
      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <Input type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} />
        <Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} options={[{ value: '', label: 'All statuses' }, { value: 'Scheduled', label: 'Scheduled' }, { value: 'Completed', label: 'Completed' }, { value: 'Cancelled', label: 'Cancelled' }]} />
        <Select value={filters.doctor_id} onChange={(e) => setFilters({ ...filters, doctor_id: e.target.value })} options={[{ value: '', label: 'All doctors' }, ...doctors.map((d) => ({ value: d.doctor_id, label: d.name }))]} />
        <Button onClick={load}>Filter</Button>
      </div>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <Table rows={rows} columns={[
        { key: 'patient_name', label: 'Patient' },
        { key: 'doctor_name', label: 'Doctor' },
        { key: 'appointment_date', label: 'Date' },
        { key: 'appointment_time', label: 'Time', render: (r) => String(r.appointment_time).slice(0, 5) },
        { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
        { key: 'actions', label: '', render: (r) => r.status === 'Scheduled' ? (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={async () => { await api.put(`/appointments/${r.appointment_id}`, { status: 'Completed' }); load(); }}>Complete</Button>
            <Button variant="danger" onClick={() => setConfirm(r)}>Cancel</Button>
          </div>
        ) : null },
      ]} />
      <Modal open={open} title="Create Appointment" onClose={() => setOpen(false)}>
        <form onSubmit={save} className="grid gap-3">
          <Select label="Patient" value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} options={[{ value: '', label: 'Select patient' }, ...patients.map((p) => ({ value: p.patient_id, label: `${p.name} (#${p.patient_id})` }))]} />
          <Select label="Department" value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })} options={[{ value: '', label: 'Select department' }, ...departments.map((d) => ({ value: d.department_id, label: d.department_name }))]} />
          <Select label="Doctor" value={form.doctor_id} onChange={(e) => setForm({ ...form, doctor_id: e.target.value })} options={[{ value: '', label: 'Select doctor' }, ...doctors.filter((d) => !form.department_id || String(d.department_id) === String(form.department_id)).map((d) => ({ value: d.doctor_id, label: d.name }))]} />
          <Input label="Date" type="date" value={form.appointment_date} onChange={(e) => setForm({ ...form, appointment_date: e.target.value })} required />
          <Select label="Time" value={form.appointment_time} onChange={(e) => setForm({ ...form, appointment_time: e.target.value })} options={[{ value: '', label: 'Select time' }, ...slots.map((s) => ({ value: s, label: s.slice(0, 5) }))]} />
          <Input label="Reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required />
          <Button type="submit">Book</Button>
        </form>
      </Modal>
      <ConfirmDialog open={!!confirm} title="Cancel appointment" message="This appointment will be marked as Cancelled." onClose={() => setConfirm(null)} onConfirm={async () => { await api.delete(`/appointments/${confirm.appointment_id}`); setConfirm(null); load(); }} />
    </Card>
  );
}
