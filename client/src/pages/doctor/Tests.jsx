import { useEffect, useState } from 'react';
import api from '../../services/api';
import Card from '../../components/Card';
import Table from '../../components/Table';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Select from '../../components/Select';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function DoctorTests() {
  const [tests, setTests] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [updateTest, setUpdateTest] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [newTest, setNewTest] = useState({
    appointment_id: '',
    test_name: '',
    test_type: '',
  });

  const [testResult, setTestResult] = useState('');

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/tests'),
      api.get('/appointments')
    ])
      .then(([tRes, aRes]) => {
        setTests(tRes.data);
        setAppointments(aRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/tests', newTest);
      setCreateModal(false);
      setNewTest({ appointment_id: '', test_name: '', test_type: '' });
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.put(`/tests/${updateTest.test_id}`, {
        result: testResult,
        status: 'Completed',
      });
      setUpdateTest(null);
      setTestResult('');
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
          <h1 className="text-2xl font-bold text-slate-800">Medical Tests</h1>
          <p className="text-sm text-slate-500">Order lab tests and enter test results.</p>
        </div>
        <Button onClick={() => setCreateModal(true)}>+ Order Test</Button>
      </div>

      <Card>
        <Table
          columns={[
            { key: 'test_date', label: 'Date' },
            { key: 'patient_name', label: 'Patient Name' },
            { key: 'test_name', label: 'Test Name' },
            { key: 'test_type', label: 'Category' },
            { key: 'result', label: 'Result', render: (r) => r.result || 'Pending...' },
            { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
            {
              key: 'actions',
              label: 'Actions',
              render: (r) => (
                r.status === 'Ordered' ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      setUpdateTest(r);
                      setTestResult(r.result || '');
                    }}
                  >
                    Enter Result
                  </Button>
                ) : (
                  <span className="text-xs text-slate-400">Completed</span>
                )
              ),
            },
          ]}
          rows={tests}
          empty="No medical tests found."
        />
      </Card>

      {createModal && (
        <Modal title="Order Medical Test" onClose={() => setCreateModal(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <Select
              label="Select Appointment"
              value={newTest.appointment_id}
              onChange={(e) => setNewTest({ ...newTest, appointment_id: e.target.value })}
              options={[
                { value: '', label: 'Select appointment...' },
                ...appointments.map((a) => ({
                  value: a.appointment_id,
                  label: `#${a.appointment_id} - ${a.patient_name} (${a.appointment_date})`,
                })),
              ]}
              required
            />
            <Input
              label="Test Name"
              placeholder="e.g. Complete Blood Count (CBC)"
              value={newTest.test_name}
              onChange={(e) => setNewTest({ ...newTest, test_name: e.target.value })}
              required
            />
            <Select
              label="Test Category"
              value={newTest.test_type}
              onChange={(e) => setNewTest({ ...newTest, test_type: e.target.value })}
              options={[
                { value: '', label: 'Select category...' },
                { value: 'Blood', label: 'Blood Test' },
                { value: 'Imaging', label: 'Imaging / X-Ray / MRI' },
                { value: 'Cardiac', label: 'Cardiac (ECG / Echo)' },
                { value: 'Urine', label: 'Urine Analysis' },
                { value: 'Pathology', label: 'Pathology' },
              ]}
              required
            />

            {error && <p className="text-xs text-rose-600">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setCreateModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Ordering...' : 'Order Test'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {updateTest && (
        <Modal title={`Enter Result: ${updateTest.test_name}`} onClose={() => setUpdateTest(null)}>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <p className="text-sm font-medium text-slate-700">Patient: {updateTest.patient_name}</p>
              <p className="text-xs text-slate-500">Test Category: {updateTest.test_type}</p>
            </div>

            <Input
              label="Test Result / Findings"
              placeholder="e.g. Within normal limits, Hemoglobin 14.2 g/dL"
              value={testResult}
              onChange={(e) => setTestResult(e.target.value)}
              required
            />

            {error && <p className="text-xs text-rose-600">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setUpdateTest(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Result & Complete'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
