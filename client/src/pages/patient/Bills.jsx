import { useEffect, useState } from 'react';
import api from '../../services/api';
import Card from '../../components/Card';
import Table from '../../components/Table';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function PatientBills() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/bills')
      .then((res) => setBills(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Bills</h1>
        <p className="text-sm text-slate-500">View hospital bills for consultations and admissions.</p>
      </div>

      <Card>
        <Table
          columns={[
            { key: 'bill_id', label: 'Bill ID', render: (r) => `#${r.bill_id}` },
            { key: 'bill_date', label: 'Date' },
            { key: 'description', label: 'Description' },
            { key: 'amount', label: 'Amount (₹)', render: (r) => `₹${Number(r.amount).toFixed(2)}` },
            { key: 'status', label: 'Payment Status', render: (r) => <Badge value={r.status} /> },
          ]}
          rows={bills}
          empty="No bills found."
        />
      </Card>
    </div>
  );
}
