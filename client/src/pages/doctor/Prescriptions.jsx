import { useEffect, useState } from 'react';
import api from '../../services/api';
import Card from '../../components/Card';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Select from '../../components/Select';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function DoctorPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    appointment_id: '',
    medicine_name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/prescriptions'),
      api.get('/appointments')
    ])
      .then(([pRes, aRes]) => {
        setPrescriptions(pRes.data);
        setAppointments(aRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/prescriptions', formData);
      setModalOpen(false);
      setFormData({
        appointment_id: '',
        medicine_name: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
      });
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Prescriptions</h1>
          <p className="text-sm text-slate-500">Add and manage medicine prescriptions for patients.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>+ Add Prescription</Button>
      </div>

      <Card>
        <Table
          columns={[
            { key: 'prescription_date', label: 'Date' },
            { key: 'patient_name', label: 'Patient Name' },
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

      {modalOpen && (
        <Modal title="Create New Prescription" onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="Select Appointment"
              value={formData.appointment_id}
              onChange={(e) => setFormData({ ...formData, appointment_id: e.target.value })}
              options={[
                { value: '', label: 'Select an appointment...' },
                ...appointments.map((a) => ({
                  value: a.appointment_id,
                  label: `#${a.appointment_id} - ${a.patient_name} (${a.appointment_date})`,
                })),
              ]}
              required
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Medicine Name"
                placeholder="e.g. Paracetamol"
                value={formData.medicine_name}
                onChange={(e) => setFormData({ ...formData, medicine_name: e.target.value })}
                required
              />
              <Input
                label="Dosage"
                placeholder="e.g. 500 mg"
                value={formData.dosage}
                onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Frequency"
                placeholder="e.g. Twice daily"
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                required
              />
              <Input
                label="Duration"
                placeholder="e.g. 5 days"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                required
              />
            </div>

            <Input
              label="Special Instructions"
              placeholder="e.g. Take after meals with warm water"
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              required
            />

            {error && <p className="text-xs text-rose-600">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : 'Create Prescription'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
