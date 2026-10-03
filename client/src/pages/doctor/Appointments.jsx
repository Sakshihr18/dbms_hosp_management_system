import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/Card';
import Table from '../../components/Table';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Select from '../../components/Select';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchAppointments = () => {
    setLoading(true);
    let url = '/appointments';
    if (statusFilter) url += `?status=${statusFilter}`;
    api.get(url)
      .then((res) => setAppointments(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter]);

  const handleComplete = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.put(`/appointments/${selectedAppt.appointment_id}`, {
        status: 'Completed',
        diagnosis,
      });
      setSelectedAppt(null);
      setDiagnosis('');
      fetchAppointments();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Appointments</h1>
          <p className="text-sm text-slate-500">Manage and complete patient consultations.</p>
        </div>
        <div className="w-48">
          <Select
            label="Filter by Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'Scheduled', label: 'Scheduled' },
              { value: 'Completed', label: 'Completed' },
              { value: 'Cancelled', label: 'Cancelled' },
            ]}
          />
        </div>
      </div>

      <Card>
        <Table
          columns={[
            { key: 'appointment_date', label: 'Date' },
            { key: 'appointment_time', label: 'Time', render: (r) => r.appointment_time.slice(0, 5) },
            { key: 'patient_name', label: 'Patient Name' },
            { key: 'patient_phone', label: 'Phone' },
            { key: 'reason', label: 'Reason' },
            { key: 'diagnosis', label: 'Diagnosis', render: (r) => r.diagnosis || '-' },
            { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
            {
              key: 'actions',
              label: 'Actions',
              render: (r) => (
                <div className="flex items-center gap-2">
                  {r.status === 'Scheduled' && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedAppt(r);
                        setDiagnosis(r.diagnosis || '');
                      }}
                    >
                      Complete
                    </Button>
                  )}
                  <Link
                    to={`/doctor/patients/${r.patient_id}`}
                    className="text-xs font-semibold text-teal-600 hover:underline"
                  >
                    History
                  </Link>
                </div>
              ),
            },
          ]}
          rows={appointments}
          empty="No appointments found."
        />
      </Card>

      {selectedAppt && (
        <Modal
          title={`Complete Appointment #${selectedAppt.appointment_id}`}
          onClose={() => setSelectedAppt(null)}
        >
          <form onSubmit={handleComplete} className="space-y-4">
            <div>
              <p className="text-sm font-medium text-slate-700">Patient: {selectedAppt.patient_name}</p>
              <p className="text-xs text-slate-500">Reason: {selectedAppt.reason}</p>
            </div>

            <Input
              label="Diagnosis & Clinical Notes"
              placeholder="Enter diagnosis or consultation notes..."
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              required
            />

            {error && <p className="text-xs text-rose-600">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setSelectedAppt(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : 'Mark as Completed'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
