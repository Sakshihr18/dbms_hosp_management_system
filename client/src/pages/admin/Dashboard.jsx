import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../../services/api';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatCard from '../../components/StatCard';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard/admin').then((res) => setData(res.data)).catch((err) => setError(err.message));
  }, []);

  if (!data && !error) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      {error && <p className="text-red-600">{error}</p>}
      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard label="Total Patients" value={data.totalPatients} />
            <StatCard label="Total Doctors" value={data.totalDoctors} />
            <StatCard label="Today's Appointments" value={data.todayAppointments} />
            <StatCard label="Current Admissions" value={data.currentAdmissions} />
            <StatCard label="Pending Bills" value={data.pendingBills} />
          </div>
          <Card title="Appointments in the last 7 days">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.appointmentsLast7Days}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#0f766e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
