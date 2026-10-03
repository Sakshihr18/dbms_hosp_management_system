import { useEffect, useState } from 'react';
import api from '../../services/api';
import Card from '../../components/Card';
import Table from '../../components/Table';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function PatientTests() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tests')
      .then((res) => setTests(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Medical & Lab Tests</h1>
        <p className="text-sm text-slate-500">View test orders and diagnostic reports.</p>
      </div>

      <Card>
        <Table
          columns={[
            { key: 'test_date', label: 'Date' },
            { key: 'doctor_name', label: 'Doctor' },
            { key: 'test_name', label: 'Test Name' },
            { key: 'test_type', label: 'Category' },
            { key: 'result', label: 'Result / Findings', render: (r) => r.result || 'Pending...' },
            { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
          ]}
          rows={tests}
          empty="No medical tests found."
        />
      </Card>
    </div>
  );
}
