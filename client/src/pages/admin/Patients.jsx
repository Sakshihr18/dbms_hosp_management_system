import { useEffect, useState } from 'react';
import api from '../../services/api';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Table from '../../components/Table';

export default function AdminPatients() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const load = () => {
    api.get('/patients', { params: { search } })
      .then((res) => setRows(res.data))
      .catch((err) => setError(err.message));
  };

  useEffect(() => { load(); }, []);

  return (
    <Card title="Patients" action={<Input placeholder="Search name, phone or ID" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} />}>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <Table
        rows={rows}
        columns={[
          { key: 'patient_id', label: 'ID' },
          { key: 'name', label: 'Name' },
          { key: 'phone', label: 'Phone' },
          { key: 'email', label: 'Email' },
          { key: 'gender', label: 'Gender' },
          { key: 'blood_group', label: 'Blood Group' },
        ]}
      />
    </Card>
  );
}
