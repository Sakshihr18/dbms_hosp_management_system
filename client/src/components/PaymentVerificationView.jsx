import { useEffect, useState } from 'react';
import api from '../services/api';
import Badge from './Badge';
import Button from './Button';
import Card from './Card';
import Modal from './Modal';
import Select from './Select';
import Table from './Table';

export default function PaymentVerificationView() {
  const [payments, setPayments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('Pending Verification');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [activePayment, setActivePayment] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [receiptData, setReceiptData] = useState(null);
  const [processing, setProcessing] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/payments/history', {
        params: statusFilter ? { status: statusFilter } : {},
      });
      setPayments(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load payments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  const handleVerify = async () => {
    if (!activePayment) return;
    setProcessing(true);
    setError('');
    try {
      await api.post(`/payments/${activePayment.payment_id}/verify`);
      setSuccess(`Payment for Bill #${activePayment.bill_id} verified and marked as Paid.`);
      setConfirmModalOpen(false);
      setActivePayment(null);
      fetchPayments();
    } catch (err) {
      setError(err.message || 'Failed to verify payment.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!activePayment || !rejectionReason.trim()) return;
    setProcessing(true);
    setError('');
    try {
      await api.post(`/payments/${activePayment.payment_id}/reject`, {
        reason: rejectionReason.trim(),
      });
      setSuccess(`Payment for Bill #${activePayment.bill_id} marked as Rejected.`);
      setRejectModalOpen(false);
      setActivePayment(null);
      setRejectionReason('');
      fetchPayments();
    } catch (err) {
      setError(err.message || 'Failed to reject payment.');
    } finally {
      setProcessing(false);
    }
  };

  const openReceipt = async (payment) => {
    try {
      const res = await api.get(`/payments/receipt/${payment.payment_id}`);
      setReceiptData(res.data);
      setReceiptModalOpen(true);
    } catch (err) {
      setError(err.message || 'Unable to retrieve verified receipt.');
    }
  };

  return (
    <div className="space-y-4">
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div>}

      <Card
        title="UPI Payment Verification Queue"
        action={
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-500">Filter by status:</span>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'All Records' },
                { value: 'Pending Verification', label: 'Pending Verification' },
                { value: 'Paid', label: 'Verified & Paid' },
                { value: 'Awaiting Payment', label: 'Awaiting Payment' },
                { value: 'Rejected', label: 'Rejected' },
              ]}
            />
            <Button variant="outline" onClick={fetchPayments}>
              Refresh
            </Button>
          </div>
        }
      >
        <Table
          rows={payments}
          columns={[
            {
              key: 'payment_id',
              label: 'Pay ID',
              render: (r) => <span className="font-semibold text-slate-700">#{r.payment_id}</span>,
            },
            {
              key: 'bill_id',
              label: 'Bill / Appt',
              render: (r) => (
                <div>
                  <div className="text-xs font-medium text-slate-900">Bill #{r.bill_id}</div>
                  {r.appointment_id && (
                    <div className="text-xs text-slate-500">Appt #{r.appointment_id}</div>
                  )}
                </div>
              ),
            },
            {
              key: 'patient',
              label: 'Patient',
              render: (r) => (
                <div>
                  <div className="font-medium text-slate-900">{r.patient_name}</div>
                  <div className="text-xs text-slate-500">{r.patient_phone}</div>
                </div>
              ),
            },
            {
              key: 'doctor',
              label: 'Doctor / Dept',
              render: (r) => (
                <div>
                  <div className="text-sm font-medium text-slate-800">{r.doctor_name || 'Hospital Service'}</div>
                  <div className="text-xs text-slate-500">{r.department_name || r.bill_description}</div>
                </div>
              ),
            },
            {
              key: 'amount',
              label: 'Amount (₹)',
              render: (r) => <span className="font-bold text-slate-900">₹{Number(r.amount).toFixed(2)}</span>,
            },
            {
              key: 'transaction_ref',
              label: 'UPI Ref / UTR',
              render: (r) =>
                r.transaction_ref ? (
                  <span className="rounded bg-slate-100 px-2 py-1 font-mono text-xs font-semibold text-slate-800">
                    {r.transaction_ref}
                  </span>
                ) : (
                  <span className="text-xs italic text-slate-400">Not provided</span>
                ),
            },
            {
              key: 'submitted_at',
              label: 'Submitted Date',
              render: (r) => (
                <div className="text-xs text-slate-600">
                  {r.submitted_at ? new Date(r.submitted_at).toLocaleString() : 'N/A'}
                </div>
              ),
            },
            {
              key: 'payment_status',
              label: 'Status',
              render: (r) => <Badge value={r.payment_status} />,
            },
            {
              key: 'actions',
              label: 'Actions',
              render: (r) => (
                <div className="flex items-center gap-1.5">
                  {r.payment_status === 'Pending Verification' && (
                    <>
                      <button
                        onClick={() => {
                          setActivePayment(r);
                          setConfirmModalOpen(true);
                        }}
                        className="rounded bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                      >
                        Verify & Pay
                      </button>
                      <button
                        onClick={() => {
                          setActivePayment(r);
                          setRejectModalOpen(true);
                        }}
                        className="rounded bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 border border-rose-200"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {r.payment_status === 'Paid' && (
                    <button
                      onClick={() => openReceipt(r)}
                      className="rounded bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 border border-blue-200"
                    >
                      Receipt
                    </button>
                  )}
                  {r.payment_status === 'Rejected' && r.rejection_reason && (
                    <span
                      title={r.rejection_reason}
                      className="text-xs text-rose-600 max-w-[120px] truncate block"
                    >
                      Reason: {r.rejection_reason}
                    </span>
                  )}
                </div>
              ),
            },
          ]}
          empty="No payment submissions found matching this filter."
        />
      </Card>

      {/* Confirm Payment Modal */}
      <Modal
        open={confirmModalOpen}
        title="Confirm UPI Payment"
        onClose={() => {
          setConfirmModalOpen(false);
          setActivePayment(null);
        }}
      >
        {activePayment && (
          <div className="space-y-4">
            <div className="rounded-lg bg-emerald-50 p-3 border border-emerald-200 text-xs text-emerald-800">
              ⚠️ <strong>Bank Verification Rule:</strong> Confirm this payment only after verifying that the exact
              amount and UPI Reference (UTR) have been credited to the <strong>Central Bank of India</strong> hospital account.
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-500">Patient</p>
                <p className="font-semibold text-slate-800">{activePayment.patient_name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Doctor / Service</p>
                <p className="font-semibold text-slate-800">{activePayment.doctor_name || 'Hospital'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Expected Amount</p>
                <p className="text-lg font-bold text-emerald-700">₹{Number(activePayment.amount).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Submitted UPI UTR / Ref</p>
                <p className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded inline-block">
                  {activePayment.transaction_ref || 'None provided'}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setConfirmModalOpen(false);
                  setActivePayment(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleVerify} disabled={processing}>
                {processing ? 'Confirming...' : 'Yes, Confirm Payment'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Payment Modal */}
      <Modal
        open={rejectModalOpen}
        title="Reject Payment Submission"
        onClose={() => {
          setRejectModalOpen(false);
          setActivePayment(null);
          setRejectionReason('');
        }}
      >
        {activePayment && (
          <form onSubmit={handleReject} className="space-y-4">
            <p className="text-xs text-slate-600">
              Provide a clear reason for rejection (e.g. invalid UTR, payment not credited, incorrect amount). This reason will be displayed to the patient so they can re-submit if needed.
            </p>
            <div className="text-sm">
              <p className="text-xs text-slate-500">Bill #{activePayment.bill_id} - {activePayment.patient_name}</p>
              <p className="font-semibold text-slate-800">Amount: ₹{Number(activePayment.amount).toFixed(2)}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Rejection Reason *</label>
              <textarea
                required
                rows={3}
                className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
                placeholder="e.g. UTR not found in bank statement, payment amount mismatch..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setRejectModalOpen(false);
                  setActivePayment(null);
                  setRejectionReason('');
                }}
              >
                Cancel
              </Button>
              <button
                type="submit"
                disabled={processing || !rejectionReason.trim()}
                className="rounded bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {processing ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Verified Receipt Modal */}
      <Modal
        open={receiptModalOpen}
        title="Verified Payment Receipt"
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
              <span className="font-bold text-slate-700">Total Verified Amount:</span>
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
