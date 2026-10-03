import { useEffect, useState } from 'react';
import api from '../../services/api';
import Badge from '../../components/Badge';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Table from '../../components/Table';

export default function AdminAppointments() {
  const [rows, setRows] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [filters, setFilters] = useState({ date: '', status: '', doctor_id: '' });
  const [error, setError] = useState('');

  const load = () => {
    const params = {};
    if (filters.date) params.date = filters.date;
    if (filters.status) params.status = filters.status;
    if (filters.doctor_id) params.doctor_id = filters.doctor_id;
    api.get('/appointments', { params }).then((res) => setRows(res.data)).catch((err) => setError(err.message));
  };

  useEffect(() => { api.get('/doctors').then((res) => setDoctors(res.data)); load(); }, []);

  return (
    <Card title="Appointments">
      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <Input type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} />
        <Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} options={[
          { value: '', label: 'All statuses' }, { value: 'Scheduled', label: 'Scheduled' }, { value: 'Completed', label: 'Completed' }, { value: 'Cancelled', label: 'Cancelled' },
        ]} />
        <Select value={filters.doctor_id} onChange={(e) => setFilters({ ...filters, doctor_id: e.target.value })} options={[{ value: '', label: 'All doctors' }, ...doctors.map((d) => ({ value: d.doctor_id, label: d.name }))]} />
        <button onClick={load} className="rounded-lg bg-brand-700 text-white">Filter</button>
      </div>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <Table rows={rows} columns={[
        { key: 'appointment_id', label: 'ID' },
        { key: 'patient_name', label: 'Patient' },
        { key: 'doctor_name', label: 'Doctor' },
        { key: 'department_name', label: 'Department' },
        { key: 'appointment_date', label: 'Date' },
        { key: 'appointment_time', label: 'Time', render: (r) => String(r.appointment_time).slice(0, 5) },
        { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
      ]} />
    </Card>
  );
}
