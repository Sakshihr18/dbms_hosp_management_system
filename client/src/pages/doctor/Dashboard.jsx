import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StatCard from '../../components/StatCard';
import Card from '../../components/Card';
import Table from '../../components/Table';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function DoctorDashboard() {
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/doctor'),
      api.get('/appointments?date=' + new Date().toISOString().slice(0, 10))
    ])
      .then(([statsRes, apptRes]) => {
        setStats(statsRes.data);
        setAppointments(apptRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Doctor Dashboard</h1>
        <p className="text-sm text-slate-500">Overview of your consultations, patients, and lab orders.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today's Scheduled Appointments" value={stats?.todayAppointments ?? 0} />
        <StatCard label="Pending Medical Tests" value={stats?.pendingTests ?? 0} />
        <StatCard label="Completed Consultations" value={stats?.completedConsultations ?? 0} />
        <StatCard label="Total Patients Treated" value={stats?.recentPatients ?? 0} />
      </div>

      <Card title="Today's Appointments">
        <Table
          columns={[
            { key: 'appointment_time', label: 'Time', render: (r) => r.appointment_time.slice(0, 5) },
            { key: 'patient_name', label: 'Patient Name' },
            { key: 'reason', label: 'Reason for Visit' },
            { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
            {
              key: 'action',
              label: 'Actions',
              render: (r) => (
                <Link
                  to={`/doctor/patients/${r.patient_id}`}
                  className="text-xs font-semibold text-teal-600 hover:underline"
                >
                  View History
                </Link>
              ),
            },
          ]}
          rows={appointments}
          empty="No appointments scheduled for today."
        />
      </Card>
    </div>
  );
}
