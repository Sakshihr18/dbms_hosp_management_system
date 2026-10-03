import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/Card';
import Select from '../../components/Select';
import Input from '../../components/Input';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function BookAppointment() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);

  const [departmentId, setDepartmentId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(new Date().toISOString().slice(0, 10));
  const [appointmentTime, setAppointmentTime] = useState('');
  const [reason, setReason] = useState('');

  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/departments')
      .then((res) => setDepartments(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!departmentId) {
      setDoctors([]);
      setDoctorId('');
      return;
    }
    api.get(`/doctors?department_id=${departmentId}`)
      .then((res) => {
        setDoctors(res.data);
        setDoctorId('');
      })
      .catch((err) => console.error(err));
  }, [departmentId]);

  useEffect(() => {
    if (!doctorId || !appointmentDate) {
      setAvailableSlots([]);
      setAppointmentTime('');
      return;
    }
    setSlotsLoading(true);
    api.get(`/appointments/slots?doctor_id=${doctorId}&date=${appointmentDate}`)
      .then((res) => {
        setAvailableSlots(res.data);
        setAppointmentTime('');
      })
      .catch((err) => console.error(err))
      .finally(() => setSlotsLoading(false));
  }, [doctorId, appointmentDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/appointments', {
        doctor_id: doctorId,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        reason,
      });
      navigate('/patient/appointments');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Book an Appointment</h1>
        <p className="text-sm text-slate-500">Choose a medical department, doctor, date, and preferred time slot.</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Department"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            options={[
              { value: '', label: 'Select a department...' },
              ...departments.map((d) => ({ value: d.department_id, label: d.department_name })),
            ]}
            required
          />

          <Select
            label="Doctor"
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            options={[
              { value: '', label: 'Select a doctor...' },
              ...doctors.map((doc) => ({
                value: doc.doctor_id,
                label: `${doc.name} (${doc.specialization})`,
              })),
            ]}
            disabled={!departmentId}
            required
          />

          <Input
            label="Appointment Date"
            type="date"
            min={new Date().toISOString().slice(0, 10)}
            value={appointmentDate}
            onChange={(e) => setAppointmentDate(e.target.value)}
            disabled={!doctorId}
            required
          />

          {doctorId && appointmentDate && (
            <div>
              <label className="block text-sm font-medium text-slate-700">Available Time Slots</label>
              {slotsLoading ? (
                <p className="mt-1 text-xs text-slate-500">Checking slot availability...</p>
              ) : availableSlots.length > 0 ? (
                <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setAppointmentTime(slot)}
                      className={`rounded-lg border py-2 text-xs font-semibold ${
                        appointmentTime === slot
                          ? 'border-brand-700 bg-brand-700 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-brand-500'
                      }`}
                    >
                      {slot.slice(0, 5)}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-xs text-rose-600">No available time slots for this date.</p>
              )}
            </div>
          )}

          <Input
            label="Reason for Consultation"
            placeholder="e.g. Routine checkup, chest discomfort, joint pain..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={!appointmentTime}
            required
          />

          {error && <p className="text-xs text-rose-600">{error}</p>}

          <div className="pt-2">
            <Button type="submit" className="w-full" disabled={!appointmentTime || submitting}>
              {submitting ? 'Confirming Appointment...' : 'Confirm Appointment'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
