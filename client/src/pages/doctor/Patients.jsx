import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/Card';
import Table from '../../components/Table';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function DoctorPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/patients')
      .then((res) => setPatients(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Assigned Patients</h1>
        <p className="text-sm text-slate-500">Patients associated with your consultations or admissions.</p>
      </div>

      <Card>
        <Table
          columns={[
            { key: 'patient_id', label: 'ID' },
            { key: 'name', label: 'Patient Name' },
            { key: 'gender', label: 'Gender' },
            { key: 'blood_group', label: 'Blood Group' },
            { key: 'phone', label: 'Phone' },
            { key: 'email', label: 'Email' },
            { key: 'emergency_contact', label: 'Emergency Contact' },
            {
              key: 'actions',
              label: 'Medical History',
              render: (r) => (
                <Link
                  to={`/doctor/patients/${r.patient_id}`}
                  className="rounded bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-100"
                >
                  View Full History
                </Link>
              ),
            },
          ]}
          rows={patients}
          empty="No assigned patients found."
        />
      </Card>
    </div>
  );
}
