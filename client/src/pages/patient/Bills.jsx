import { useEffect, useState } from 'react';
import api from '../../services/api';
import Card from '../../components/Card';
import Table from '../../components/Table';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function PatientBills() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [receiptData, setReceiptData] = useState(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/bills')
      .then((res) => setBills(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const openReceipt = async (paymentId) => {
    if (!paymentId) return;
    try {
      const res = await api.get(`/payments/receipt/${paymentId}`);
      setReceiptData(res.data);
      setReceiptModalOpen(true);
    } catch (err) {
      setError(err.message || 'Unable to retrieve verified receipt.');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Bills & Payments</h1>
        <p className="text-sm text-slate-500">
          Track hospital bills, UPI verification status, and official payment receipts.
        </p>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <Card>
        <Table
          columns={[
            { key: 'bill_id', label: 'Bill ID', render: (r) => `#${r.bill_id}` },
            { key: 'bill_date', label: 'Date' },
            { key: 'description', label: 'Description' },
            { key: 'amount', label: 'Amount (₹)', render: (r) => `₹${Number(r.amount).toFixed(2)}` },
            {
              key: 'payment_status',
              label: 'Verification Status',
              render: (r) => (
                <div>
                  <Badge value={r.payment_status || r.status} />
                  {r.payment_status === 'Rejected' && r.rejection_reason && (
                    <div className="text-xs text-rose-600 mt-0.5">Note: {r.rejection_reason}</div>
                  )}
                </div>
              ),
            },
            {
              key: 'actions',
              label: 'Receipt / Details',
              render: (r) =>
                (r.payment_status === 'Paid' || r.status === 'Paid') && r.payment_id ? (
                  <Button variant="outline" onClick={() => openReceipt(r.payment_id)}>
                    View Receipt
                  </Button>
                ) : r.payment_status === 'Pending Verification' ? (
                  <span className="text-xs text-purple-700 font-medium">Verifying with bank...</span>
                ) : (
                  <span className="text-xs text-slate-400">Payment pending</span>
                ),
            },
          ]}
          rows={bills}
          empty="No bills found."
        />
      </Card>

      {/* Verified Receipt Modal */}
      <Modal
        open={receiptModalOpen}
        title="Official Verified Payment Receipt"
        onClose={() => {
          setReceiptModalOpen(false);
          setReceiptData(null);
        }}
      >
        {receiptData && (
          <div className="space-y-4 text-slate-800 text-sm">
            <div className="border-b pb-3 text-center">
              <h2 className="text-lg font-bold text-slate-900">{receiptData.hospital_name}</h2>
              <p className="text-xs text-slate-500">{receiptData.hospital_address}</p>
              <p className="text-xs text-slate-500">{receiptData.hospital_contact}</p>
              <div className="mt-2 inline-block rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold text-emerald-800">
                Official Payment Receipt
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded">
              <div>
                <span className="text-slate-500">Receipt No:</span>{' '}
                <span className="font-semibold">{receiptData.receipt_number}</span>
              </div>
              <div>
                <span className="text-slate-500">Issued Date:</span>{' '}
                <span>{new Date(receiptData.issued_at).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-slate-500">Bill Reference:</span>{' '}
                <span className="font-semibold">#{receiptData.bill_id}</span>
              </div>
              <div>
                <span className="text-slate-500">Booking ID:</span>{' '}
                <span className="font-semibold">#{receiptData.appointment_id || 'N/A'}</span>
              </div>
            </div>

            <div className="border-t pt-2 space-y-1 text-xs">
              <p><strong>Patient:</strong> {receiptData.patient.name} ({receiptData.patient.phone})</p>
              {receiptData.doctor && (
                <p><strong>Doctor:</strong> {receiptData.doctor.name} - {receiptData.doctor.department}</p>
              )}
              {receiptData.appointment && (
                <p><strong>Appointment:</strong> {receiptData.appointment.date} at {receiptData.appointment.time}</p>
              )}
              <p><strong>Payment Channel:</strong> {receiptData.financials.bank_channel}</p>
              <p><strong>UPI UTR / Ref:</strong> <span className="font-mono font-bold">{receiptData.financials.transaction_ref}</span></p>
              <p><strong>Verified By:</strong> {receiptData.audit.verified_by} on {new Date(receiptData.audit.verified_at).toLocaleString()}</p>
            </div>

            <div className="border-t pt-3 flex justify-between items-center">
              <span className="font-bold text-slate-700">Total Paid Amount:</span>
              <span className="text-xl font-bold text-emerald-700">₹{receiptData.financials.amount.toFixed(2)}</span>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => window.print()}>Print Receipt</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
