import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Share,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { VerifiedReceipt } from '../../types';
import { theme } from '../../theme/theme';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const ReceiptScreen = ({ route, navigation }: any) => {
  const { paymentId } = route.params || {};
  const [receipt, setReceipt] = useState<VerifiedReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!paymentId) {
      setError('Invalid payment ID.');
      setLoading(false);
      return;
    }

    api
      .get(`/payments/receipt/${paymentId}`)
      .then((res) => setReceipt(res.data))
      .catch((err) => setError(err.message || 'Unable to retrieve verified payment receipt.'))
      .finally(() => setLoading(false));
  }, [paymentId]);

  const handleShareReceipt = async () => {
    if (!receipt) return;
    try {
      const receiptText = `
=== ${receipt.hospital_name.toUpperCase()} ===
OFFICIAL PAYMENT RECEIPT
Receipt No: ${receipt.receipt_number}
Date Issued: ${new Date(receipt.issued_at).toLocaleDateString()}
-----------------------------------
Patient: ${receipt.patient.name} (${receipt.patient.phone})
Doctor: ${receipt.doctor?.name || 'Hospital Service'} (${receipt.doctor?.department || ''})
${receipt.appointment ? `Appointment: ${receipt.appointment.date} at ${receipt.appointment.time}` : ''}
Bill ID: #${receipt.bill_id}
Booking ID: #${receipt.appointment_id || 'N/A'}
Amount Paid: INR ${receipt.financials.amount.toFixed(2)}
Payment Channel: ${receipt.financials.bank_channel}
UPI Ref (UTR): ${receipt.financials.transaction_ref}
Status: VERIFIED & PAID
Verified By: ${receipt.audit.verified_by}
-----------------------------------
CareHub Hospital & Research Centre
Contact: ${receipt.hospital_contact}
      `.trim();

      await Share.share({
        title: `CareHub Receipt - ${receipt.receipt_number}`,
        message: receiptText,
      });
    } catch (e: any) {
      console.warn('Share receipt error:', e);
    }
  };

  if (loading) return <LoadingSpinner message="Generating verified official receipt..." />;

  if (error || !receipt) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="document-text-outline" size={48} color={theme.colors.error} />
        <Text style={styles.errorTitle}>Receipt Unavailable</Text>
        <Text style={styles.errorSubtitle}>
          {error || 'Official receipts can only be generated for verified and paid payments.'}
        </Text>
        <Button
          title="Go Back"
          onPress={() => navigation.goBack()}
          style={{ marginTop: 16 }}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Printable Receipt Card */}
      <View style={styles.receiptCard}>
        {/* Hospital Branding Header */}
        <View style={styles.receiptHeader}>
          <View style={styles.logoBadge}>
            <Ionicons name="medical" size={28} color={theme.colors.primary} />
          </View>
          <Text style={styles.hospitalTitle}>{receipt.hospital_name}</Text>
          <Text style={styles.hospitalAddr}>{receipt.hospital_address}</Text>
          <Text style={styles.hospitalContact}>{receipt.hospital_contact}</Text>

          <View style={styles.verifiedStamp}>
            <Ionicons name="shield-checkmark" size={14} color="#047857" />
            <Text style={styles.verifiedStampText}>VERIFIED & PAID</Text>
          </View>
        </View>

        {/* Receipt Identifiers */}
        <View style={styles.identifiersRow}>
          <View style={styles.idCol}>
            <Text style={styles.idLabel}>Receipt Number</Text>
            <Text style={styles.idValue}>{receipt.receipt_number}</Text>
          </View>
          <View style={[styles.idCol, { alignItems: 'flex-end' }]}>
            <Text style={styles.idLabel}>Issue Date</Text>
            <Text style={styles.idValue}>{new Date(receipt.issued_at).toLocaleDateString()}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Patient & Doctor Information */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Patient & Clinical Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Patient Name:</Text>
            <Text style={styles.detailValue}>{receipt.patient.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phone / Email:</Text>
            <Text style={styles.detailValue}>{receipt.patient.phone}</Text>
          </View>
          {receipt.doctor && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Consultant:</Text>
              <Text style={styles.detailValue}>{receipt.doctor.name} ({receipt.doctor.department})</Text>
            </View>
          )}
          {receipt.appointment && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Appointment Date:</Text>
              <Text style={styles.detailValue}>{receipt.appointment.date} at {receipt.appointment.time}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Hospital Bill Ref:</Text>
            <Text style={styles.detailValue}>#{receipt.bill_id}</Text>
          </View>
          {receipt.appointment_id && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Booking ID:</Text>
              <Text style={styles.detailValue}>#{receipt.appointment_id}</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* Financial & Banking Information */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Financial Settlement</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Description:</Text>
            <Text style={styles.detailValue}>{receipt.financials.description}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Channel:</Text>
            <Text style={styles.detailValue}>{receipt.financials.bank_channel}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>UPI Ref (UTR):</Text>
            <Text style={[styles.detailValue, styles.utrText]}>{receipt.financials.transaction_ref}</Text>
          </View>
          {receipt.audit.verified_at && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Verified By:</Text>
              <Text style={styles.detailValue}>
                {receipt.audit.verified_by} on {new Date(receipt.audit.verified_at).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* Total Amount Box */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Amount Paid</Text>
          <Text style={styles.totalAmount}>₹{receipt.financials.amount.toFixed(2)}</Text>
        </View>

        <View style={styles.footerNote}>
          <Text style={styles.footerNoteText}>
            This is an official computer-generated receipt from CareHub Hospital. No physical signature is required.
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <Button
          title="Share / Save Receipt"
          onPress={handleShareReceipt}
          size="lg"
          icon={<Ionicons name="share-outline" size={20} color="#FFFFFF" />}
        />
        <Button
          variant="outline"
          title="Close Receipt"
          onPress={() => navigation.goBack()}
          size="md"
          style={{ marginTop: 10 }}
        />
      </View>
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
  receiptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.medium,
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  logoBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  hospitalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
  },
  hospitalAddr: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  hospitalContact: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 1,
    textAlign: 'center',
  },
  verifiedStamp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.full,
    marginTop: 10,
  },
  verifiedStampText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#047857',
    letterSpacing: 0.5,
  },
  identifiersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surfaceVariant,
    padding: 10,
    borderRadius: theme.borderRadius.md,
    marginTop: 8,
  },
  idCol: {},
  idLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
  },
  idValue: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },
  section: {
    gap: 6,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
    maxWidth: '65%',
    textAlign: 'right',
  },
  utrText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '800',
    color: theme.colors.purple,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primaryDark,
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.primaryDark,
  },
  footerNote: {
    marginTop: theme.spacing.md,
    alignItems: 'center',
  },
  footerNoteText: {
    fontSize: 10,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 14,
  },
  actionsContainer: {
    marginTop: theme.spacing.lg,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    marginTop: 12,
  },
  errorSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
