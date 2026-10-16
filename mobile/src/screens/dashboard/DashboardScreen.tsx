import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { PatientDashboardData } from '../../types';
import { theme } from '../../theme/theme';
import { Badge } from '../../components/Badge';
import { Card } from '../../components/Card';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const DashboardScreen = ({ navigation }: any) => {
  const { user, patient } = useAuth();
  const [data, setData] = useState<PatientDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchDashboard = useCallback(async () => {
    try {
      setError('');
      const res = await api.get('/dashboard/patient');
      setData(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load patient dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  if (loading) {
    return <LoadingSpinner message="Loading your health portal..." />;
  }

  const patientName = data?.patient?.name || patient?.name || user?.name || 'Patient';
  const upcoming = data?.upcomingAppointment;
  const pendingCount = data?.pendingBills || 0;
  const pendingVerificationsCount = data?.pendingVerifications || 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
    >
      {/* Welcome Header */}
      <View style={styles.welcomeCard}>
        <View style={styles.welcomeTextContainer}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.patientName}>{patientName}</Text>
          <View style={styles.infoBadgeRow}>
            {patient?.blood_group && (
              <View style={styles.infoTag}>
                <Ionicons name="water" size={12} color="#DC2626" />
                <Text style={styles.infoTagText}>Blood: {patient.blood_group}</Text>
              </View>
            )}
            <View style={styles.infoTag}>
              <Ionicons name="shield-checkmark" size={12} color={theme.colors.primary} />
              <Text style={styles.infoTagText}>CareHub Verified</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => navigation.navigate('Profile')}
        >
          <Ionicons name="person-circle" size={44} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Ionicons name="warning-outline" size={18} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Quick Action Buttons */}
      <View style={styles.quickActionsRow}>
        <TouchableOpacity
          style={[styles.quickActionCard, { backgroundColor: '#F0FDFA', borderColor: '#99F6E4' }]}
          onPress={() => navigation.navigate('Book Appointment')}
        >
          <View style={[styles.iconBubble, { backgroundColor: theme.colors.primaryLight }]}>
            <Ionicons name="calendar-outline" size={22} color={theme.colors.primary} />
          </View>
          <Text style={styles.quickActionTitle}>Book Visit</Text>
          <Text style={styles.quickActionSub}>Choose doctor</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionCard, { backgroundColor: '#F5F3FF', borderColor: '#DDD6FE' }]}
          onPress={() => navigation.navigate('Bills and Payments')}
        >
          <View style={[styles.iconBubble, { backgroundColor: '#EDE9FE' }]}>
            <Ionicons name="qr-code-outline" size={22} color={theme.colors.purple} />
          </View>
          <Text style={styles.quickActionTitle}>UPI Pay</Text>
          <Text style={styles.quickActionSub}>QR payment</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionCard, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}
          onPress={() => navigation.navigate('My Appointments')}
        >
          <View style={[styles.iconBubble, { backgroundColor: '#E0F2FE' }]}>
            <Ionicons name="document-text-outline" size={22} color={theme.colors.secondary} />
          </View>
          <Text style={styles.quickActionTitle}>History</Text>
          <Text style={styles.quickActionSub}>All visits</Text>
        </TouchableOpacity>
      </View>

      {/* Pending Payment Alert Banner if any */}
      {(pendingCount > 0 || pendingVerificationsCount > 0) && (
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.paymentAlertBox}
          onPress={() => navigation.navigate('Bills and Payments')}
        >
          <View style={styles.paymentAlertLeft}>
            <View style={styles.alertIconBubble}>
              <Ionicons name="wallet-outline" size={24} color="#B45309" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>
                {pendingVerificationsCount > 0
                  ? `${pendingVerificationsCount} Payment Under Staff Verification`
                  : `${pendingCount} Pending Hospital Bill${pendingCount > 1 ? 's' : ''}`}
              </Text>
              <Text style={styles.alertSubtitle}>
                {pendingVerificationsCount > 0
                  ? 'Hospital receptionist is matching your UPI reference with the bank'
                  : 'Scan the Central Bank of India UPI QR to complete payment'}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#B45309" />
        </TouchableOpacity>
      )}

      {/* Upcoming Appointment Section */}
      <Card
        title="Upcoming Appointment"
        subtitle="Your next scheduled doctor consultation"
        action={
          upcoming && (
            <TouchableOpacity onPress={() => navigation.navigate('My Appointments')}>
              <Text style={styles.cardActionText}>View All</Text>
            </TouchableOpacity>
          )
        }
      >
        {upcoming ? (
          <View style={styles.appointmentBox}>
            <View style={styles.appHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.doctorName}>{upcoming.doctor_name}</Text>
                <Text style={styles.deptName}>{upcoming.department_name}</Text>
              </View>
              <Badge status={upcoming.status} />
            </View>

            <View style={styles.scheduleRow}>
              <View style={styles.scheduleItem}>
                <Ionicons name="calendar-clear-outline" size={15} color={theme.colors.primary} />
                <Text style={styles.scheduleText}>{upcoming.appointment_date}</Text>
              </View>
              <View style={styles.scheduleItem}>
                <Ionicons name="time-outline" size={15} color={theme.colors.primary} />
                <Text style={styles.scheduleText}>{upcoming.appointment_time}</Text>
              </View>
            </View>

            <View style={styles.reasonBox}>
              <Text style={styles.reasonLabel}>Reason for visit:</Text>
              <Text style={styles.reasonText}>{upcoming.reason}</Text>
            </View>

            {upcoming.bill_id && (
              <View style={styles.billingRow}>
                <View>
                  <Text style={styles.billIdText}>Bill #{upcoming.bill_id}</Text>
                  <Text style={styles.billAmountText}>Fee: ₹{Number(upcoming.bill_amount || upcoming.consultation_fee || 500).toFixed(2)}</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.payNowBtn,
                    upcoming.payment_status === 'Paid'
                      ? { backgroundColor: theme.colors.successLight }
                      : upcoming.payment_status === 'Pending Verification'
                      ? { backgroundColor: theme.colors.purpleLight }
                      : { backgroundColor: theme.colors.primary },
                  ]}
                  onPress={() => {
                    if (upcoming.payment_status === 'Paid') {
                      navigation.navigate('ReceiptModal', { paymentId: upcoming.payment_id });
                    } else {
                      navigation.navigate('PaymentModal', {
                        billId: upcoming.bill_id,
                        appointmentId: upcoming.appointment_id,
                        doctorName: upcoming.doctor_name,
                        departmentName: upcoming.department_name,
                        amount: upcoming.bill_amount || upcoming.consultation_fee || 500,
                        date: upcoming.appointment_date,
                        time: upcoming.appointment_time,
                      });
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.payNowText,
                      upcoming.payment_status === 'Paid'
                        ? { color: '#047857' }
                        : upcoming.payment_status === 'Pending Verification'
                        ? { color: '#6D28D9' }
                        : { color: '#FFFFFF' },
                    ]}
                  >
                    {upcoming.payment_status === 'Paid'
                      ? 'View Receipt'
                      : upcoming.payment_status === 'Pending Verification'
                      ? 'Verifying UPI...'
                      : 'Pay via UPI QR'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.emptyBox}>
            <Ionicons name="calendar-outline" size={36} color={theme.colors.textMuted} />
            <Text style={styles.emptyTitle}>No scheduled appointments</Text>
            <Text style={styles.emptySubtitle}>Book a visit with our specialist doctors anytime.</Text>
            <TouchableOpacity
              style={styles.bookEmptyBtn}
              onPress={() => navigation.navigate('Book Appointment')}
            >
              <Text style={styles.bookEmptyBtnText}>Book Appointment Now</Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>

      {/* Recent Payments & Verification Status */}
      <Card
        title="Recent Payment Submissions"
        subtitle="UPI payments submitted for hospital verification"
        action={
          <TouchableOpacity onPress={() => navigation.navigate('Bills and Payments')}>
            <Text style={styles.cardActionText}>All Bills</Text>
          </TouchableOpacity>
        }
      >
        {data?.recentPayments && data.recentPayments.length > 0 ? (
          data.recentPayments.map((p) => (
            <TouchableOpacity
              key={p.payment_id}
              activeOpacity={0.7}
              style={styles.paymentListItem}
              onPress={() => {
                if (p.payment_status === 'Paid') {
                  navigation.navigate('ReceiptModal', { paymentId: p.payment_id });
                } else {
                  navigation.navigate('PaymentModal', {
                    billId: p.bill_id,
                    appointmentId: p.appointment_id,
                    doctorName: p.doctor_name,
                    amount: p.amount,
                  });
                }
              }}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.payListTitle}>Bill #{p.bill_id}</Text>
                  <Text style={styles.payListDate}>• {p.created_at?.slice(0, 10)}</Text>
                </View>
                <Text style={styles.payListSub}>{p.bill_description || p.doctor_name || 'Medical Consultation'}</Text>
                {p.transaction_ref ? (
                  <Text style={styles.payListUtr}>UTR: {p.transaction_ref}</Text>
                ) : null}
              </View>

              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={styles.payListAmount}>₹{Number(p.amount).toFixed(2)}</Text>
                <Badge status={p.payment_status} size="sm" />
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptySubBox}>
            <Text style={styles.emptySubText}>No recent payments recorded.</Text>
          </View>
        )}
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
  welcomeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.soft,
  },
  welcomeTextContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  patientName: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.4,
    marginTop: 1,
  },
  infoBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  infoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.sm,
    gap: 4,
  },
  infoTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text,
  },
  profileBtn: {
    padding: 2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.errorLight,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.error,
    fontWeight: '500',
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: theme.spacing.lg,
  },
  quickActionCard: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickActionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
  },
  quickActionSub: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 1,
  },
  paymentAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  paymentAlertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  alertIconBubble: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  alertSubtitle: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
  },
  cardActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  appointmentBox: {
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  appHeaderRow: {
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
    gap: 16,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginBottom: 6,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  scheduleText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  reasonBox: {
    marginBottom: 10,
  },
  reasonLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  reasonText: {
    fontSize: 13,
    color: theme.colors.text,
    fontStyle: 'italic',
  },
  billingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  billIdText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  billAmountText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.text,
  },
  payNowBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.md,
  },
  payNowText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  bookEmptyBtn: {
    marginTop: 12,
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.md,
  },
  bookEmptyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  paymentListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceVariant,
  },
  payListTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  payListDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  payListSub: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 1,
  },
  payListUtr: {
    fontSize: 11,
    color: theme.colors.purple,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  payListAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.text,
  },
  emptySubBox: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  emptySubText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
});
