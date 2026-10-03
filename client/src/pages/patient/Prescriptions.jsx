import { useEffect, useState } from 'react';
import api from '../../services/api';
import Card from '../../components/Card';
import Table from '../../components/Table';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function PatientPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/prescriptions')
      .then((res) => setPrescriptions(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Prescriptions</h1>
        <p className="text-sm text-slate-500">List of medicines prescribed by your consulting doctors.</p>
      </div>

      <Card>
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
    </div>
  );
}
