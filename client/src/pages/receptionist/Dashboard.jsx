import { useEffect, useState } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatCard from '../../components/StatCard';

export default function ReceptionistDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api.get('/dashboard/receptionist').then((res) => setData(res.data)).catch((err) => setError(err.message));
  }, []);
  if (!data && !error) return <LoadingSpinner />;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Reception Desk</h1>
      {error && <p className="text-red-600">{error}</p>}
      {data && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Today's Appointments" value={data.todayAppointments} />
          <StatCard label="Current Admissions" value={data.currentAdmissions} />
          <StatCard label="Pending Bills" value={data.pendingBills} />
          <StatCard label="Total Patients" value={data.totalPatients} />
        </div>
      )}
    </div>
  );
}
