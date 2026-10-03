import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/Card';
import Table from '../../components/Table';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function PatientHistory() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/patients/${id}/history`)
      .then((res) => setData(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!data) return <p className="text-center text-slate-500">Patient history not found.</p>;

  const { patient, appointments, prescriptions, tests } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Medical History: {patient.name}</h1>
          <p className="text-sm text-slate-500">Comprehensive patient records and past visits.</p>
        </div>
        <Link
          to="/doctor/patients"
          className="text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          ← Back to Patients
        </Link>
      </div>

      <Card title="Patient Profile & Contact Information">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm text-slate-700">
          <div>
            <p className="text-xs font-medium text-slate-400">Date of Birth</p>
            <p className="font-semibold">{patient.dob}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Gender / Blood Group</p>
            <p className="font-semibold">{patient.gender} ({patient.blood_group})</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Phone</p>
            <p className="font-semibold">{patient.phone}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Emergency Contact</p>
            <p className="font-semibold">{patient.emergency_contact}</p>
          </div>
        </div>
      </Card>

      <Card title="Appointments & Diagnoses">
        <Table
          columns={[
            { key: 'appointment_date', label: 'Date' },
            { key: 'doctor_name', label: 'Doctor' },
            { key: 'department_name', label: 'Department' },
            { key: 'reason', label: 'Reason' },
            { key: 'diagnosis', label: 'Diagnosis', render: (r) => r.diagnosis || 'None recorded' },
            { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
          ]}
          rows={appointments}
          empty="No appointments recorded."
        />
      </Card>

      <Card title="Prescriptions">
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
          empty="No prescriptions recorded."
        />
      </Card>

      <Card title="Medical Tests">
        <Table
          columns={[
            { key: 'test_date', label: 'Date' },
            { key: 'doctor_name', label: 'Doctor' },
            { key: 'test_name', label: 'Test Name' },
            { key: 'test_type', label: 'Category' },
            { key: 'result', label: 'Findings / Result', render: (r) => r.result || 'Pending...' },
            { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
          ]}
          rows={tests}
          empty="No medical tests recorded."
        />
      </Card>
    </div>
  );
}
