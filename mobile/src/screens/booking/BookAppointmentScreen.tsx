import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { Department, Doctor } from '../../types';
import { theme } from '../../theme/theme';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const BookAppointmentScreen = ({ navigation }: any) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [slots, setSlots] = useState<string[]>([]);

  // Selection states
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().slice(0, 10) // default tomorrow
  );
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  // UI state
  const [loading, setLoading] = useState(true);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 1. Fetch departments on mount
  useEffect(() => {
    api
      .get('/departments')
      .then((res) => setDepartments(res.data))
      .catch((err) => setError(err.message || 'Failed to load departments.'))
      .finally(() => setLoading(false));
  }, []);

  // 2. Fetch doctors when department changes
  useEffect(() => {
    if (!selectedDeptId) {
      setDoctors([]);
      setSelectedDoctor(null);
      return;
    }
    setDoctorsLoading(true);
    setSelectedDoctor(null);
    setSlots([]);
    setSelectedSlot('');

    api
      .get(`/doctors?department_id=${selectedDeptId}`)
      .then((res) => setDoctors(res.data))
      .catch((err) => setError(err.message || 'Failed to load doctors.'))
      .finally(() => setDoctorsLoading(false));
  }, [selectedDeptId]);

  // 3. Fetch slots when doctor or date changes
  useEffect(() => {
    if (!selectedDoctor || !selectedDate) {
      setSlots([]);
      setSelectedSlot('');
      return;
    }
    setSlotsLoading(true);
    setSelectedSlot('');

    api
      .get(`/appointments/slots?doctor_id=${selectedDoctor.doctor_id}&date=${selectedDate}`)
      .then((res) => setSlots(res.data))
      .catch((err) => setError(err.message || 'Failed to load slots.'))
      .finally(() => setSlotsLoading(false));
  }, [selectedDoctor, selectedDate]);

  const handleBooking = async () => {
    if (!selectedDoctor) {
      Alert.alert('Required', 'Please select a consulting doctor.');
      return;
    }
    if (!selectedDate || !selectedSlot) {
      Alert.alert('Required', 'Please select an appointment date and available time slot.');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Required', 'Please enter a brief reason or symptoms for the visit.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await api.post('/appointments', {
        doctor_id: selectedDoctor.doctor_id,
        appointment_date: selectedDate,
        appointment_time: selectedSlot,
        reason: reason.trim(),
      });

      const appointment = response.data;

      // Navigate to PaymentScreen with booking and bill details
      navigation.navigate('PaymentModal', {
        billId: appointment.bill_id,
        appointmentId: appointment.appointment_id,
        doctorName: selectedDoctor.name,
        departmentName: selectedDoctor.department_name,
        amount: appointment.bill_amount || selectedDoctor.consultation_fee,
        date: appointment.appointment_date,
        time: appointment.appointment_time,
      });

      // Reset form
      setSelectedDeptId(null);
      setSelectedDoctor(null);
      setSelectedSlot('');
      setReason('');
    } catch (err: any) {
      setError(err.message || 'Failed to book appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading hospital departments..." />;

  // Quick date selector dates (today, tomorrow, next 4 days)
  const dateOptions = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      iso: d.toISOString().slice(0, 10),
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    };
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Book Doctor Appointment</Text>
        <Text style={styles.headerSubtitle}>
          Select a clinical department, specialist, date, and preferred time slot.
        </Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={18} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Step 1: Department Selection */}
      <Card title="1. Select Department">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
          {departments.map((dept) => {
            const isSelected = selectedDeptId === dept.department_id;
            return (
              <TouchableOpacity
                key={dept.department_id}
                style={[styles.deptPill, isSelected && styles.deptPillSelected]}
                onPress={() => setSelectedDeptId(dept.department_id)}
              >
                <Ionicons
                  name="medkit-outline"
                  size={16}
                  color={isSelected ? '#FFFFFF' : theme.colors.primary}
                />
                <Text style={[styles.deptPillText, isSelected && styles.deptPillTextSelected]}>
                  {dept.department_name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Card>

      {/* Step 2: Doctor Selection */}
      {selectedDeptId && (
        <Card title="2. Select Specialist Doctor">
          {doctorsLoading ? (
            <ActivityIndicator size="small" color={theme.colors.primary} style={{ padding: 20 }} />
          ) : doctors.length > 0 ? (
            <View style={{ gap: 10 }}>
              {doctors.map((doc) => {
                const isSelected = selectedDoctor?.doctor_id === doc.doctor_id;
                return (
                  <TouchableOpacity
                    key={doc.doctor_id}
                    style={[styles.doctorCard, isSelected && styles.doctorCardSelected]}
                    onPress={() => setSelectedDoctor(doc)}
                  >
                    <View style={styles.doctorAvatar}>
                      <Ionicons
                        name="person"
                        size={24}
                        color={isSelected ? '#FFFFFF' : theme.colors.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.doctorName, isSelected && { color: theme.colors.primaryDark }]}>
                        {doc.name}
                      </Text>
                      <Text style={styles.doctorSpec}>{doc.specialization}</Text>
                      <Text style={styles.doctorExp}>{doc.experience} years clinical experience</Text>
                    </View>
                    <View style={styles.feeBox}>
                      <Text style={styles.feeLabel}>Fee</Text>
                      <Text style={styles.feeAmount}>₹{Number(doc.consultation_fee || 500).toFixed(0)}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Text style={styles.noDoctorsText}>No active doctors currently available in this department.</Text>
          )}
        </Card>
      )}

      {/* Step 3: Date & Slot Selection */}
      {selectedDoctor && (
        <Card title="3. Select Date & Available Slot">
          <Text style={styles.sectionLabel}>Consultation Date:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
            {dateOptions.map((item) => {
              const isSelected = selectedDate === item.iso;
              return (
                <TouchableOpacity
                  key={item.iso}
                  style={[styles.dateChip, isSelected && styles.dateChipSelected]}
                  onPress={() => setSelectedDate(item.iso)}
                >
                  <Text style={[styles.dateChipText, isSelected && styles.dateChipTextSelected]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.dateIsoText, isSelected && { color: '#FFFFFF' }]}>
                    {item.iso.slice(5)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Available Time Slots:</Text>
          {slotsLoading ? (
            <ActivityIndicator size="small" color={theme.colors.primary} style={{ padding: 16 }} />
          ) : slots.length > 0 ? (
            <View style={styles.slotsGrid}>
              {slots.map((slot) => {
                const isSelected = selectedSlot === slot;
                const displayTime = slot.slice(0, 5);
                return (
                  <TouchableOpacity
                    key={slot}
                    style={[styles.slotChip, isSelected && styles.slotChipSelected]}
                    onPress={() => setSelectedSlot(slot)}
                  >
                    <Text style={[styles.slotText, isSelected && styles.slotTextSelected]}>
                      {displayTime}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Text style={styles.noSlotsText}>
              All slots are booked for this date. Please pick another date.
            </Text>
          )}
        </Card>
      )}

      {/* Step 4: Reason & Summary */}
      {selectedDoctor && selectedSlot && (
        <Card title="4. Booking Summary & Reason">
          <Input
            label="Reason for Consultation *"
            placeholder="e.g. Chest pain, routine review, migraine, persistent cough..."
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={2}
          />

          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Doctor:</Text>
              <Text style={styles.summaryValue}>{selectedDoctor.name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Department:</Text>
              <Text style={styles.summaryValue}>{selectedDoctor.department_name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date & Time:</Text>
              <Text style={styles.summaryValue}>
                {selectedDate} at {selectedSlot.slice(0, 5)}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryTotalRow]}>
              <Text style={styles.summaryTotalLabel}>Consultation Fee Payable:</Text>
              <Text style={styles.summaryTotalAmount}>
                ₹{Number(selectedDoctor.consultation_fee || 500).toFixed(2)}
              </Text>
            </View>
          </View>

          <Button
            title="Confirm Booking & Proceed to Payment"
            onPress={handleBooking}
            loading={submitting}
            size="lg"
            style={{ marginTop: 16 }}
          />
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: 40,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.errorLight,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.error,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  deptPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surfaceVariant,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  deptPillSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primaryDark,
  },
  deptPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  deptPillTextSelected: {
    color: '#FFFFFF',
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surfaceVariant,
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 12,
  },
  doctorCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#F0FDFA',
  },
  doctorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  doctorSpec: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  doctorExp: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  feeBox: {
    alignItems: 'flex-end',
  },
  feeLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
  },
  feeAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  noDoctorsText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  dateChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surfaceVariant,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  dateChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primaryDark,
  },
  dateChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text,
  },
  dateChipTextSelected: {
    color: '#FFFFFF',
  },
  dateIsoText: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surfaceVariant,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  slotChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primaryDark,
  },
  slotText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  slotTextSelected: {
    color: '#FFFFFF',
  },
  noSlotsText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  summaryBox: {
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: 8,
    gap: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  summaryTotalRow: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    alignItems: 'center',
  },
  summaryTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  summaryTotalAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.primary,
  },
});
