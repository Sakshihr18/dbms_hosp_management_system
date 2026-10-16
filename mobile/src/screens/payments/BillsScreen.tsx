import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { Bill } from '../../types';
import { theme } from '../../theme/theme';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const BillsScreen = ({ navigation }: any) => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchBills = useCallback(async () => {
    try {
      setError('');
      const res = await api.get('/bills');
      setBills(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load hospital invoices.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBills();
  };

  if (loading) return <LoadingSpinner message="Loading hospital bills and payments..." />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bills & Payments</Text>
        <Text style={styles.headerSubtitle}>
          View hospital invoices, Central Bank of India UPI payments, and verified receipts.
        </Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={18} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Info card about the UPI verification workflow */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle-outline" size={20} color={theme.colors.primaryDark} />
        <View style={{ flex: 1 }}>
          <Text style={styles.infoBannerTitle}>Central Bank of India UPI Terminal</Text>
          <Text style={styles.infoBannerText}>
            Payments are made by scanning the hospital QR code and submitting your 12-digit UTR reference. Authorized staff verify the credit before marking the invoice as Paid.
          </Text>
        </View>
      </View>

      {bills.length > 0 ? (
        bills.map((bill) => {
          const status = bill.payment_status || bill.status;
          const isPaid = status === 'Paid';
          const isPendingVerification = status === 'Pending Verification';
          const isRejected = status === 'Rejected';

          return (
            <Card key={bill.bill_id}>
              <View style={styles.billTopRow}>
                <View>
                  <Text style={styles.billId}>Invoice #{bill.bill_id}</Text>
                  <Text style={styles.billDate}>Issued: {bill.bill_date}</Text>
                </View>
                <Badge status={status} />
              </View>

              <Text style={styles.billDesc}>{bill.description}</Text>

              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Payable Amount:</Text>
                <Text style={styles.amountVal}>₹{Number(bill.amount).toFixed(2)}</Text>
              </View>

              {/* Status details */}
              {isPendingVerification && (
                <View style={styles.pendingNotice}>
                  <Ionicons name="time" size={16} color="#6D28D9" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pendingNoticeTitle}>Pending Staff Verification</Text>
                    {bill.transaction_ref ? (
                      <Text style={styles.pendingUtr}>Submitted UTR: {bill.transaction_ref}</Text>
                    ) : null}
                    <Text style={styles.pendingNoticeSub}>
                      Hospital reception is reviewing the bank statement.
                    </Text>
                  </View>
                </View>
              )}

              {isRejected && bill.rejection_reason && (
                <View style={styles.rejectedNotice}>
                  <Ionicons name="alert-circle" size={16} color={theme.colors.error} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rejectedNoticeTitle}>Payment Rejected</Text>
                    <Text style={styles.rejectedNoticeReason}>Reason: {bill.rejection_reason}</Text>
                    <Text style={styles.rejectedNoticeSub}>Please scan the QR code and re-submit your UTR reference.</Text>
                  </View>
                </View>
              )}

              {/* Actions */}
              <View style={styles.cardActions}>
                {isPaid && bill.payment_id ? (
                  <Button
                    title="View Official Receipt"
                    onPress={() => navigation.navigate('ReceiptModal', { paymentId: bill.payment_id })}
                    variant="outline"
                    size="sm"
                    icon={<Ionicons name="receipt-outline" size={16} color={theme.colors.primary} />}
                  />
                ) : (
                  <Button
                    title={isPendingVerification ? 'Check QR & Details' : 'Pay via UPI QR'}
                    onPress={() =>
                      navigation.navigate('PaymentModal', {
                        billId: bill.bill_id,
                        appointmentId: bill.appointment_id,
                        amount: bill.amount,
                      })
                    }
                    variant={isPendingVerification ? 'outline' : 'primary'}
                    size="sm"
                    icon={<Ionicons name="qr-code-outline" size={16} color={isPendingVerification ? theme.colors.primary : '#FFFFFF'} />}
                  />
                )}
              </View>
            </Card>
          );
        })
      ) : (
        <View style={styles.emptyCard}>
          <Ionicons name="wallet-outline" size={48} color={theme.colors.textMuted} />
          <Text style={styles.emptyTitle}>No Bills Found</Text>
          <Text style={styles.emptySub}>You have no pending or completed hospital invoices.</Text>
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    gap: 10,
    marginBottom: theme.spacing.lg,
  },
  infoBannerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primaryDark,
  },
  infoBannerText: {
    fontSize: 11,
    color: '#0F766E',
    marginTop: 2,
    lineHeight: 15,
  },
  billTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  billId: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  billDate: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 1,
  },
  billDesc: {
    fontSize: 13,
    color: theme.colors.text,
    marginVertical: 4,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    padding: 10,
    borderRadius: theme.borderRadius.sm,
    marginTop: 8,
  },
  amountLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  amountVal: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
  },
  pendingNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: theme.borderRadius.sm,
    padding: 8,
    gap: 8,
    marginTop: 8,
  },
  pendingNoticeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6D28D9',
  },
  pendingUtr: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4C1D95',
    marginTop: 1,
  },
  pendingNoticeSub: {
    fontSize: 10,
    color: '#5B21B6',
    marginTop: 1,
  },
  rejectedNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: theme.borderRadius.sm,
    padding: 8,
    gap: 8,
    marginTop: 8,
  },
  rejectedNoticeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.error,
  },
  rejectedNoticeReason: {
    fontSize: 11,
    fontWeight: '600',
    color: '#991B1B',
    marginTop: 1,
  },
  rejectedNoticeSub: {
    fontSize: 10,
    color: '#7F1D1D',
    marginTop: 1,
  },
  cardActions: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  emptyCard: {
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
