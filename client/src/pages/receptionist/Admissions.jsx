import { useEffect, useState } from 'react';
import api from '../../services/api';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Modal from '../../components/Modal';
import Select from '../../components/Select';
import Table from '../../components/Table';

const empty = { patient_id: '', doctor_id: '', room_number: '', admission_date: '', reason: '' };

export default function ReceptionistAdmissions() {
  const [rows, setRows] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [status, setStatus] = useState('Admitted');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');

  const load = () => api.get('/admissions', { params: status ? { status } : {} }).then((res) => setRows(res.data)).catch((err) => setError(err.message));
  useEffect(() => {
    api.get('/patients').then((res) => setPatients(res.data));
    api.get('/doctors').then((res) => setDoctors(res.data));
  }, []);
  useEffect(() => { load(); }, [status]);

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admissions', form);
      setOpen(false);
      setForm(empty);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Card
      title="Admissions"
      action={
        <div className="flex gap-2">
          <Select value={status} onChange={(e) => setStatus(e.target.value)} options={[{ value: '', label: 'All' }, { value: 'Admitted', label: 'Admitted' }, { value: 'Discharged', label: 'Discharged' }]} />
          <Button onClick={() => setOpen(true)}>Admit Patient</Button>
        </div>
      }
    >
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <Table rows={rows} columns={[
        { key: 'patient_name', label: 'Patient' },
        { key: 'doctor_name', label: 'Doctor' },
        { key: 'room_number', label: 'Room' },
        { key: 'admission_date', label: 'Date' },
        { key: 'reason', label: 'Reason' },
        { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
        { key: 'actions', label: '', render: (r) => r.status === 'Admitted' ? (
          <Button onClick={async () => { await api.put(`/admissions/${r.admission_id}`, { status: 'Discharged' }); load(); }}>Discharge</Button>
        ) : null },
      ]} />
      <Modal open={open} title="Admit Patient" onClose={() => setOpen(false)}>
        <form onSubmit={save} className="grid gap-3">
          <Select label="Patient" value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} options={[{ value: '', label: 'Select patient' }, ...patients.map((p) => ({ value: p.patient_id, label: p.name }))]} />
          <Select label="Doctor" value={form.doctor_id} onChange={(e) => setForm({ ...form, doctor_id: e.target.value })} options={[{ value: '', label: 'Select doctor' }, ...doctors.map((d) => ({ value: d.doctor_id, label: d.name }))]} />
          <Input label="Room Number" value={form.room_number} onChange={(e) => setForm({ ...form, room_number: e.target.value })} required />
          <Input label="Admission Date" type="date" value={form.admission_date} onChange={(e) => setForm({ ...form, admission_date: e.target.value })} required />
          <Input label="Reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required />
          <Button type="submit">Admit</Button>
        </form>
      </Modal>
    </Card>
  );
}
