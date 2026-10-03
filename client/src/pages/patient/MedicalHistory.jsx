import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Table from '../../components/Table';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function MedicalHistory() {
  const { profile } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.patient_id) return;
    api.get(`/patients/${profile.patient_id}/history`)
      .then((res) => setData(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [profile]);

  if (loading) return <LoadingSpinner />;
  if (!data) return <p className="text-center text-slate-500">Medical history not available.</p>;

  const { appointments, prescriptions, tests } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Medical History</h1>
        <p className="text-sm text-slate-500">Overview of all your consultations, diagnoses, prescriptions, and lab tests.</p>
      </div>

      <Card title="Past Consultations & Diagnoses">
        <Table
          columns={[
            { key: 'appointment_date', label: 'Date' },
            { key: 'doctor_name', label: 'Doctor' },
            { key: 'department_name', label: 'Department' },
            { key: 'reason', label: 'Reason for Visit' },
            { key: 'diagnosis', label: 'Diagnosis', render: (r) => r.diagnosis || 'None recorded' },
            { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
          ]}
          rows={appointments}
          empty="No consultations found."
        />
      </Card>

      <Card title="Prescribed Medications">
        <Table
          columns={[
            { key: 'prescription_date', label: 'Date' },
            { key: 'doctor_name', label: 'Doctor' },
            { key: 'medicine_name', label: 'Medicine' },
            { key: 'dosage', label: 'Dosage' },
            { key: 'frequency', label: 'Frequency' },
            { key: 'duration', label: 'Duration' },
            { key: 'instructions', label: 'Instructions' },
          ]}
          rows={prescriptions}
          empty="No prescriptions found."
        />
      </Card>

      <Card title="Medical & Lab Tests">
        <Table
          columns={[
            { key: 'test_date', label: 'Date' },
            { key: 'doctor_name', label: 'Doctor' },
            { key: 'test_name', label: 'Test Name' },
            { key: 'test_type', label: 'Category' },
            { key: 'result', label: 'Result', render: (r) => r.result || 'Pending...' },
            { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
          ]}
          rows={tests}
          empty="No medical tests found."
        />
      </Card>
    </div>
  );
}
