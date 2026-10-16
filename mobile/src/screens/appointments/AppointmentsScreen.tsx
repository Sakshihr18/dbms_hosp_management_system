import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { Appointment } from '../../types';
import { theme } from '../../theme/theme';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const AppointmentsScreen = ({ navigation }: any) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await api.get('/appointments');
      setAppointments(res.data);
    } catch (err: any) {
      console.warn('Failed to load appointments:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const handleCancel = (appointmentId: number) => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this scheduled appointment?',
      [
        { text: 'No, Keep it', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancellingId(appointmentId);
            try {
              await api.put(`/appointments/${appointmentId}`, { status: 'Cancelled' });
              Alert.alert('Success', 'Appointment has been cancelled.');
              fetchAppointments();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Unable to cancel appointment.');
            } finally {
              setCancellingId(null);
            }
          },
        },
      ]
    );
  };

  if (loading) return <LoadingSpinner message="Loading your appointments..." />;

  const filteredAppointments = appointments.filter((a) => {
    if (filter === 'All') return true;
    return a.status === filter;
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Appointments</Text>
        <Text style={styles.headerSubtitle}>Manage your doctor consultations and payment statuses.</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {['All', 'Scheduled', 'Completed', 'Cancelled'].map((f) => {
          const isSelected = filter === f;
          return (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, isSelected && styles.filterTabSelected]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterTabText, isSelected && styles.filterTabTextSelected]}>
                {f}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {filteredAppointments.length > 0 ? (
        filteredAppointments.map((app) => {
          const fee = Number(app.bill_amount || app.consultation_fee || 500);
          const isPaid = app.payment_status === 'Paid' || app.bill_status === 'Paid';
          const isPendingVerification = app.payment_status === 'Pending Verification';

          return (
            <Card key={app.appointment_id}>
              {/* Top Row: Doctor and Status */}
              <View style={styles.topRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.doctorName}>{app.doctor_name || 'Hospital Doctor'}</Text>
                  <Text style={styles.deptName}>{app.department_name || 'Department'} • {app.doctor_specialization || 'Consultant'}</Text>
                </View>
                <Badge status={app.status} />
              </View>

              {/* Schedule Info */}
              <View style={styles.scheduleRow}>
                <View style={styles.scheduleItem}>
                  <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} />
                  <Text style={styles.scheduleValue}>{app.appointment_date}</Text>
                </View>
                <View style={styles.scheduleItem}>
                  <Ionicons name="time-outline" size={16} color={theme.colors.primary} />
                  <Text style={styles.scheduleValue}>{app.appointment_time?.slice(0, 5)}</Text>
                </View>
                <View style={styles.scheduleItem}>
                  <Text style={styles.feeTag}>₹{fee.toFixed(0)}</Text>
                </View>
              </View>

              {/* Reason */}
              <View style={styles.reasonRow}>
                <Text style={styles.reasonLabel}>Reason:</Text>
                <Text style={styles.reasonText}>{app.reason}</Text>
              </View>

              {/* Diagnosis if completed */}
              {app.diagnosis ? (
                <View style={styles.diagnosisRow}>
                  <Text style={styles.diagnosisLabel}>Doctor's Diagnosis:</Text>
                  <Text style={styles.diagnosisText}>{app.diagnosis}</Text>
                </View>
              ) : null}

              {/* Payment Status & Action Bar */}
              <View style={styles.actionRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.paymentStatusLabel}>Payment:</Text>
                  <Badge status={app.payment_status || app.bill_status || 'Awaiting Payment'} size="sm" />
                </View>

                <View style={styles.btnGroup}>
                  {/* Cancel button if scheduled */}
                  {app.status === 'Scheduled' && (
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => handleCancel(app.appointment_id)}
                      disabled={cancellingId === app.appointment_id}
                    >
                      <Text style={styles.cancelBtnText}>
                        {cancellingId === app.appointment_id ? 'Cancelling...' : 'Cancel'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Payment / Receipt Action */}
                  {isPaid ? (
                    <TouchableOpacity
                      style={styles.receiptBtn}
                      onPress={() =>
                        navigation.navigate('ReceiptModal', { paymentId: app.payment_id })
                      }
                    >
                      <Ionicons name="receipt-outline" size={14} color="#047857" />
                      <Text style={styles.receiptBtnText}>Receipt</Text>
                    </TouchableOpacity>
                  ) : isPendingVerification ? (
                    <TouchableOpacity
                      style={styles.verifyingBtn}
                      onPress={() =>
                        navigation.navigate('PaymentModal', {
                          billId: app.bill_id,
                          appointmentId: app.appointment_id,
                          doctorName: app.doctor_name,
                          amount: fee,
                          date: app.appointment_date,
                          time: app.appointment_time,
                        })
                      }
                    >
                      <Text style={styles.verifyingBtnText}>Status</Text>
                    </TouchableOpacity>
                  ) : app.status !== 'Cancelled' ? (
                    <TouchableOpacity
                      style={styles.payBtn}
                      onPress={() =>
                        navigation.navigate('PaymentModal', {
                          billId: app.bill_id,
                          appointmentId: app.appointment_id,
                          doctorName: app.doctor_name,
                          departmentName: app.department_name,
                          amount: fee,
                          date: app.appointment_date,
                          time: app.appointment_time,
                        })
                      }
                    >
                      <Ionicons name="qr-code" size={14} color="#FFFFFF" />
                      <Text style={styles.payBtnText}>Pay UPI</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            </Card>
          );
        })
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={48} color={theme.colors.textMuted} />
          <Text style={styles.emptyTitle}>No appointments found</Text>
          <Text style={styles.emptySub}>
            {filter === 'All'
              ? 'You have not booked any hospital appointments yet.'
              : `No appointments with status "${filter}".`}
          </Text>
          <Button
            title="Book an Appointment"
            onPress={() => navigation.navigate('Book Appointment')}
            style={{ marginTop: 16 }}
          />
        </View>
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
    marginBottom: theme.spacing.md,
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
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: theme.spacing.lg,
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterTabSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primaryDark,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  filterTabTextSelected: {
    color: '#FFFFFF',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  deptName: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 1,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.surfaceVariant,
    padding: 8,
    borderRadius: theme.borderRadius.sm,
    marginVertical: 6,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scheduleValue: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
  },
  feeTag: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.primaryDark,
  },
  reasonRow: {
    marginVertical: 4,
  },
  reasonLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  reasonText: {
    fontSize: 13,
    color: theme.colors.text,
    fontStyle: 'italic',
  },
  diagnosisRow: {
    marginTop: 6,
    padding: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: theme.borderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.success,
  },
  diagnosisLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  diagnosisText: {
    fontSize: 12,
    color: '#166534',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  paymentStatusLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  btnGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  cancelBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.error,
  },
  receiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
  },
  receiptBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  verifyingBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    backgroundColor: '#F5F3FF',
  },
  verifyingBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6D28D9',
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.primary,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.sm,
  },
  payBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 10,
  },
  emptySub: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
});
