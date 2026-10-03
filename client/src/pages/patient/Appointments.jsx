import { useEffect, useState } from 'react';
import api from '../../services/api';
import Card from '../../components/Card';
import Table from '../../components/Table';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import ConfirmDialog from '../../components/ConfirmDialog';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function PatientAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchAppointments = () => {
    setLoading(true);
    api.get('/appointments')
      .then((res) => setAppointments(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setSubmitting(true);
    try {
      await api.delete(`/appointments/${cancelTarget.appointment_id}`);
      setCancelTarget(null);
      fetchAppointments();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Appointments</h1>
        <p className="text-sm text-slate-500">Track and manage your upcoming and past doctor appointments.</p>
      </div>

      <Card>
        <Table
          columns={[
            { key: 'appointment_date', label: 'Date' },
            { key: 'appointment_time', label: 'Time', render: (r) => r.appointment_time.slice(0, 5) },
            { key: 'doctor_name', label: 'Doctor' },
            { key: 'department_name', label: 'Department' },
            { key: 'reason', label: 'Reason' },
            { key: 'diagnosis', label: 'Diagnosis', render: (r) => r.diagnosis || '-' },
            { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
            {
              key: 'actions',
              label: 'Actions',
              render: (r) => (
                r.status === 'Scheduled' ? (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => setCancelTarget(r)}
                  >
                    Cancel
                  </Button>
                ) : (
                  <span className="text-xs text-slate-400">-</span>
                )
              ),
            },
          ]}
          rows={appointments}
          empty="No appointments found."
        />
      </Card>

      {cancelTarget && (
        <ConfirmDialog
          title="Cancel Appointment"
          message={`Are you sure you want to cancel your appointment with ${cancelTarget.doctor_name} on ${cancelTarget.appointment_date}?`}
          onConfirm={handleCancel}
          onClose={() => setCancelTarget(null)}
          loading={submitting}
        />
      )}
    </div>
  );
}
