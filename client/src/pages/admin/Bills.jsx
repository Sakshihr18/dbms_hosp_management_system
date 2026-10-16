import { useEffect, useState } from 'react';
import api from '../../services/api';
import Badge from '../../components/Badge';
import Card from '../../components/Card';
import Select from '../../components/Select';
import Table from '../../components/Table';
import PaymentVerificationView from '../../components/PaymentVerificationView';

export default function AdminBills() {
  const [activeTab, setActiveTab] = useState('verification'); // Default to verification for quick access
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (activeTab === 'all') {
      api
        .get('/bills', { params: status ? { status } : {} })
        .then((res) => setRows(res.data))
        .catch((err) => setError(err.message));
    }
  }, [status, activeTab]);

  return (
    <div className="space-y-4">
      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('verification')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
            activeTab === 'verification'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <span>UPI Payment Verification</span>
          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-700">
            Queue
          </span>
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
            activeTab === 'all'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          All Hospital Invoices
        </button>
      </div>

      {activeTab === 'verification' ? (
        <PaymentVerificationView />
      ) : (
        <Card
          title="All Hospital Bills"
          action={
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'Pending', label: 'Pending' },
                { value: 'Paid', label: 'Paid' },
              ]}
            />
          }
        >
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
          <Table
            rows={rows}
            columns={[
              { key: 'bill_id', label: 'ID', render: (r) => `#${r.bill_id}` },
              { key: 'patient_name', label: 'Patient' },
              { key: 'amount', label: 'Amount', render: (r) => `₹${Number(r.amount).toFixed(2)}` },
              { key: 'bill_date', label: 'Date' },
              { key: 'description', label: 'Description' },
              { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
            ]}
          />
        </Card>
      )}
    </div>
  );
}
