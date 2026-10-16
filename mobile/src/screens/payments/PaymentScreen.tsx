import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import api from '../../services/api';
import { Payment } from '../../types';
import { theme } from '../../theme/theme';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';

export const PaymentScreen = ({ route, navigation }: any) => {
  const {
    billId,
    appointmentId,
    doctorName,
    departmentName,
    amount,
    date,
    time,
  } = route.params || {};

  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Exact Central Bank of India UPI QR Code
  const qrImageSource = require('../../../assets/hospital-upi-qr.png');

  // Load existing payment record if any
  const fetchPaymentDetails = async () => {
    if (!billId) return;
    try {
      const res = await api.get(`/payments/bill/${billId}`);
      setPayment(res.data);
      if (res.data?.transaction_ref) {
        setTransactionRef(res.data.transaction_ref);
      }
    } catch (err: any) {
      console.warn('Could not fetch existing payment record:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentDetails();
  }, [billId]);

  const handleShareQR = async () => {
    try {
      // Use React Native built-in Share for native cross-platform support
      await Share.share({
        title: 'CareHub Hospital UPI Payment',
        message: `CareHub Hospital UPI Payment\nBill ID: #${billId}\nAmount Payable: ₹${Number(amount || payment?.amount || 500).toFixed(2)}\nDestination: Central Bank of India - 5027 Primary\nPlease scan the hospital QR code and complete payment.`,
      });
    } catch (error: any) {
      Alert.alert('Share', error.message);
    }
  };

  const handleDownloadQR = async () => {
    try {
      if (await Sharing.isAvailableAsync()) {
        // If expo-sharing is available, resolve asset and share/save
        Alert.alert(
          'QR Image Ready',
          'You can save or send this Central Bank of India QR code to another phone to scan.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Share / Save Image',
              onPress: async () => {
                try {
                  // Share intent
                  await Share.share({
                    title: 'CareHub Central Bank of India QR',
                    message: `CareHub Hospital - Central Bank of India QR Payment for Bill #${billId}. Amount: ₹${Number(amount || payment?.amount || 500).toFixed(2)}`,
                  });
                } catch (e: any) {
                  Alert.alert('Notice', e.message);
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('Notice', 'Direct file save is not supported on this device. Please take a screenshot to share.');
      }
    } catch (err: any) {
      Alert.alert('Notice', err.message);
    }
  };

  const handleSubmitPayment = async () => {
    if (!billId) {
      Alert.alert('Error', 'Missing Bill ID.');
      return;
    }

    if (!transactionRef.trim()) {
      Alert.alert(
        'UPI Reference Required',
        'Please enter the 12-digit UPI Transaction ID / UTR number from your payment app (Google Pay, PhonePe, Paytm, BHIM, etc.).'
      );
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await api.post('/payments/submit', {
        bill_id: billId,
        transaction_ref: transactionRef.trim(),
        notes: notes.trim(),
      });

      setPayment(res.data.payment);
      setSubmittedSuccess(true);
      Alert.alert(
        'Payment Submitted For Verification',
        'Thank you! Your UPI transaction reference has been recorded. Authorized hospital reception/admin staff will verify the credit in the hospital account.',
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      setError(err.message || 'Failed to submit payment reference.');
      Alert.alert('Submission Error', err.message || 'Unable to submit payment.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentStatus = payment?.payment_status || 'Awaiting Payment';
  const payableAmount = Number(amount || payment?.amount || 500);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hospital Branding Header */}
      <View style={styles.hospitalBrand}>
        <View style={styles.brandIconBox}>
          <Ionicons name="medical" size={24} color={theme.colors.primary} />
        </View>
        <View>
          <Text style={styles.hospitalName}>CareHub Hospital</Text>
          <Text style={styles.hospitalTagline}>Cashless UPI Payment Terminal</Text>
        </View>
      </View>

      {/* Booking & Consultation Summary Card */}
      <Card title="Appointment & Invoice Details">
        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Booking ID</Text>
            <Text style={styles.metaValue}>#{appointmentId || payment?.appointment_id || 'N/A'}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Bill Reference</Text>
            <Text style={styles.metaValue}>#{billId}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Doctor</Text>
            <Text style={styles.metaValue}>{doctorName || payment?.doctor_name || 'Consulting Specialist'}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Department</Text>
            <Text style={styles.metaValue}>{departmentName || payment?.department_name || 'General'}</Text>
          </View>
          {date && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Appointment Date</Text>
              <Text style={styles.metaValue}>{date} {time ? `at ${time.slice(0, 5)}` : ''}</Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Verification Status</Text>
            <View style={{ marginTop: 2 }}>
              <Badge status={currentStatus} />
            </View>
          </View>
        </View>

        {/* Amount Payable Box */}
        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Total Amount Payable</Text>
          <Text style={styles.amountValue}>₹{payableAmount.toFixed(2)}</Text>
          <Text style={styles.amountSubtext}>Authoritative consultation fee calculated by hospital</Text>
        </View>
      </Card>

      {/* Central Bank of India UPI QR Code Display */}
      <Card title="Central Bank of India UPI QR Code">
        {/* Destination Bank Identity Banner */}
        <View style={styles.bankBanner}>
          <Ionicons name="business" size={18} color="#1E3A8A" />
          <Text style={styles.bankBannerText}>
            Payment Destination: <Text style={{ fontWeight: '800' }}>Central Bank of India - 5027 Primary</Text>
          </Text>
        </View>

        <Text style={styles.qrNotice}>
          Scan this exact QR code using any UPI mobile app (Google Pay, PhonePe, Paytm, BHIM, etc.).
        </Text>

        {/* Crisp QR Code Container */}
        <View style={styles.qrFrame}>
          <Image
            source={qrImageSource}
            style={styles.qrImage}
            resizeMode="contain"
            accessible={true}
            accessibilityLabel="Central Bank of India UPI QR Code"
          />
        </View>

        {/* Action Buttons: Share & Download */}
        <View style={styles.qrActionRow}>
          <TouchableOpacity
            style={styles.qrActionBtn}
            onPress={handleShareQR}
            activeOpacity={0.7}
          >
            <Ionicons name="share-social-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.qrActionBtnText}>Share Payment QR</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.qrActionBtn}
            onPress={handleDownloadQR}
            activeOpacity={0.7}
          >
            <Ionicons name="download-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.qrActionBtnText}>Download QR</Text>
          </TouchableOpacity>
        </View>

        {/* Step-by-Step Payment Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsHeading}>Payment Instructions:</Text>
          <Text style={styles.instructionStep}>
            1. Open any UPI application on your mobile phone.
          </Text>
          <Text style={styles.instructionStep}>
            2. Scan the Central Bank of India QR code shown above.
          </Text>
          <Text style={styles.instructionStep}>
            3. When prompted, enter the exact amount: <Text style={{ fontWeight: '800' }}>₹{payableAmount.toFixed(2)}</Text>.
          </Text>
          <Text style={styles.instructionStep}>
            4. Once payment is successful, copy the <Text style={{ fontWeight: '700' }}>12-digit UPI Ref / UTR number</Text> from your UPI app and paste it below.
          </Text>
        </View>
      </Card>

      {/* Payment Submission & Verification Section */}
      <Card title="Payment Confirmation & Verification">
        {currentStatus === 'Paid' ? (
          <View style={styles.paidSuccessBox}>
            <Ionicons name="checkmark-circle" size={40} color={theme.colors.success} />
            <Text style={styles.paidTitle}>Payment Verified & Completed</Text>
            <Text style={styles.paidSubtitle}>
              Hospital staff has verified this payment. Your appointment is confirmed.
            </Text>
            {payment?.verified_at && (
              <Text style={styles.auditText}>
                Verified on: {new Date(payment.verified_at).toLocaleString()}
              </Text>
            )}
            <Button
              title="View Official Receipt"
              onPress={() => navigation.navigate('ReceiptModal', { paymentId: payment?.payment_id })}
              style={{ marginTop: 12 }}
            />
          </View>
        ) : currentStatus === 'Pending Verification' ? (
          <View style={styles.pendingVerificationBox}>
            <View style={styles.pendingIconRow}>
              <Ionicons name="time" size={32} color={theme.colors.purple} />
              <View style={{ flex: 1 }}>
                <Text style={styles.pendingTitle}>Verification in Progress</Text>
                <Text style={styles.pendingSubtitle}>
                  Your UPI transaction reference has been submitted. Authorized hospital staff are reviewing the transaction record with the bank.
                </Text>
              </View>
            </View>

            <View style={styles.refDisplayRow}>
              <Text style={styles.refDisplayLabel}>Submitted UTR / Ref:</Text>
              <Text style={styles.refDisplayValue}>{payment?.transaction_ref || transactionRef}</Text>
            </View>

            {payment?.submitted_at && (
              <Text style={styles.auditText}>
                Submitted at: {new Date(payment.submitted_at).toLocaleString()}
              </Text>
            )}

            <View style={styles.ruleNote}>
              <Ionicons name="shield-outline" size={14} color="#6D28D9" />
              <Text style={styles.ruleNoteText}>
                Hospital policy: Bills are only marked as Paid after manual verification by authorized staff.
              </Text>
            </View>
          </View>
        ) : (
          <View>
            {currentStatus === 'Rejected' && payment?.rejection_reason ? (
              <View style={styles.rejectedBox}>
                <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rejectedTitle}>Previous Submission Rejected</Text>
                  <Text style={styles.rejectedReason}>Reason: {payment.rejection_reason}</Text>
                  <Text style={styles.rejectedHelp}>Please re-check your UPI transaction details and submit again.</Text>
                </View>
              </View>
            ) : null}

            {error ? (
              <View style={styles.errorBanner}>
                <Ionicons name="warning-outline" size={18} color={theme.colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Input
              label="UPI Transaction Reference / UTR Number *"
              placeholder="e.g. 429381029384 (12 digits)"
              value={transactionRef}
              onChangeText={setTransactionRef}
              keyboardType="numeric"
              icon={<Ionicons name="receipt-outline" size={18} color={theme.colors.textSecondary} />}
            />

            <Input
              label="Additional Notes (optional)"
              placeholder="e.g. Paid via Google Pay from account ending 4021"
              value={notes}
              onChangeText={setNotes}
            />

            <Button
              title="I Have Completed Payment"
              onPress={handleSubmitPayment}
              loading={submitting}
              size="lg"
              style={{ marginTop: 8 }}
            />

            <Text style={styles.legalDisclaimer}>
              Clicking "I Have Completed Payment" submits your transaction for verification. An authorized hospital receptionist will verify the bank deposit before issuing a receipt.
            </Text>
          </View>
        )}

        <Button
          variant="outline"
          title="Return to Patient Dashboard"
          onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
          style={{ marginTop: 16 }}
        />
      </Card>
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
  hospitalBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: theme.spacing.lg,
  },
  brandIconBox: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hospitalName: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
  },
  hospitalTagline: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    width: '47%',
  },
  metaLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 1,
  },
  amountBox: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: '#F0FDFA',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#99F6E4',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 12,
    color: theme.colors.primaryDark,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountValue: {
    fontSize: 30,
    fontWeight: '900',
    color: theme.colors.primaryDark,
    marginVertical: 2,
  },
  amountSubtext: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  bankBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  bankBannerText: {
    fontSize: 12,
    color: '#1E3A8A',
    flex: 1,
  },
  qrNotice: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    lineHeight: 16,
  },
  qrFrame: {
    backgroundColor: '#000000',
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: theme.spacing.sm,
    ...theme.shadows.medium,
  },
  qrImage: {
    width: 270,
    height: 300,
  },
  qrActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: theme.spacing.md,
  },
  qrActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.colors.surfaceVariant,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
  },
  qrActionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  instructionsContainer: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.borderRadius.md,
  },
  instructionsHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 6,
  },
  instructionStep: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
    lineHeight: 16,
  },
  paidSuccessBox: {
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: '#ECFDF5',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  paidTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#047857',
    marginTop: 6,
  },
  paidSubtitle: {
    fontSize: 12,
    color: '#065F46',
    textAlign: 'center',
    marginTop: 4,
  },
  pendingVerificationBox: {
    backgroundColor: '#F5F3FF',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    padding: theme.spacing.md,
  },
  pendingIconRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  pendingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6D28D9',
  },
  pendingSubtitle: {
    fontSize: 12,
    color: '#5B21B6',
    marginTop: 2,
    lineHeight: 16,
  },
  refDisplayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    padding: 10,
    borderRadius: theme.borderRadius.sm,
    marginTop: 6,
  },
  refDisplayLabel: {
    fontSize: 12,
    color: '#5B21B6',
    fontWeight: '500',
  },
  refDisplayValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4C1D95',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  auditText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 6,
    fontStyle: 'italic',
  },
  ruleNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#DDD6FE',
  },
  ruleNoteText: {
    fontSize: 11,
    color: '#6D28D9',
    flex: 1,
  },
  rejectedBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.errorLight,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    gap: 8,
  },
  rejectedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.error,
  },
  rejectedReason: {
    fontSize: 12,
    color: '#991B1B',
    marginTop: 2,
    fontWeight: '600',
  },
  rejectedHelp: {
    fontSize: 11,
    color: '#7F1D1D',
    marginTop: 2,
  },
  errorBanner: {
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
    fontSize: 12,
    color: theme.colors.error,
  },
  legalDisclaimer: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 10,
    lineHeight: 15,
    textAlign: 'center',
  },
});
