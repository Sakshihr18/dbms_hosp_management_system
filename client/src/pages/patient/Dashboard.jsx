import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/Card';
import StatCard from '../../components/StatCard';
import Table from '../../components/Table';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function PatientDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/patient')
      .then((res) => setData(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Patient Dashboard</h1>
          <p className="text-sm text-slate-500">Welcome to your personal health portal.</p>
        </div>
        <Link to="/patient/book">
          <Button>+ Book New Appointment</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Next Scheduled Appointment"
          value={data?.upcomingAppointment ? `${data.upcomingAppointment.appointment_date}` : 'None'}
        />
        <StatCard label="Pending Bills" value={data?.pendingBills ?? 0} />
        <StatCard label="Recent Prescriptions" value={data?.recentPrescriptions?.length ?? 0} />
      </div>

      {data?.upcomingAppointment && (
        <Card title="Upcoming Appointment Details">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-sm text-slate-700">
            <div>
              <p className="text-xs text-slate-400">Doctor</p>
              <p className="font-semibold text-slate-800">{data.upcomingAppointment.doctor_name}</p>
              <p className="text-xs text-slate-500">{data.upcomingAppointment.department_name}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Date & Time</p>
              <p className="font-semibold text-slate-800">
                {data.upcomingAppointment.appointment_date} at {data.upcomingAppointment.appointment_time.slice(0, 5)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Reason</p>
              <p className="font-semibold text-slate-800">{data.upcomingAppointment.reason}</p>
            </div>
          </div>
        </Card>
      )}

      <Card title="Recent Prescriptions">
        <Table
          columns={[
            { key: 'prescription_date', label: 'Date' },
            { key: 'doctor_name', label: 'Doctor' },
            { key: 'medicine_name', label: 'Medicine' },
            { key: 'dosage', label: 'Dosage' },
            { key: 'frequency', label: 'Frequency' },
            { key: 'duration', label: 'Duration' },
          ]}
          rows={data?.recentPrescriptions || []}
          empty="No recent prescriptions."
        />
      </Card>
    </div>
  );
}
