import { useEffect, useState } from 'react';
import api from '../../services/api';
import Badge from '../../components/Badge';
import Card from '../../components/Card';
import Select from '../../components/Select';
import Table from '../../components/Table';

export default function AdminAdmissions() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const load = () => {
    api.get('/admissions', { params: status ? { status } : {} }).then((res) => setRows(res.data)).catch((err) => setError(err.message));
  };
  useEffect(() => { load(); }, [status]);

  return (
    <Card title="Admissions" action={<Select value={status} onChange={(e) => setStatus(e.target.value)} options={[{ value: '', label: 'All' }, { value: 'Admitted', label: 'Admitted' }, { value: 'Discharged', label: 'Discharged' }]} />}>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <Table rows={rows} columns={[
        { key: 'admission_id', label: 'ID' },
        { key: 'patient_name', label: 'Patient' },
        { key: 'doctor_name', label: 'Doctor' },
        { key: 'room_number', label: 'Room' },
        { key: 'admission_date', label: 'Admitted' },
        { key: 'discharge_date', label: 'Discharged' },
        { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
      ]} />
    </Card>
  );
}
