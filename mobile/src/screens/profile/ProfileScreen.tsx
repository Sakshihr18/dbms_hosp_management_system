import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../services/api';
import { theme } from '../../theme/theme';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';

export const ProfileScreen = () => {
  const { user, patient, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of CareHub?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color={theme.colors.primary} />
        </View>
        <Text style={styles.name}>{patient?.name || user?.name || 'Patient'}</Text>
        <Text style={styles.email}>{patient?.email || user?.email}</Text>
        <View style={styles.roleTag}>
          <Text style={styles.roleTagText}>Registered Patient</Text>
        </View>
      </View>

      {/* Medical Details */}
      <Card title="Medical & Personal Information">
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Patient ID</Text>
          <Text style={styles.detailValue}>#{patient?.patient_id || 'N/A'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Blood Group</Text>
          <Text style={[styles.detailValue, { color: '#DC2626', fontWeight: '800' }]}>
            {patient?.blood_group || 'Not recorded'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date of Birth</Text>
          <Text style={styles.detailValue}>{patient?.dob || 'N/A'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Gender</Text>
          <Text style={styles.detailValue}>{patient?.gender || 'N/A'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Contact Phone</Text>
          <Text style={styles.detailValue}>{patient?.phone || 'N/A'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Address</Text>
          <Text style={styles.detailValue}>{patient?.address || 'N/A'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Emergency Contact</Text>
          <Text style={styles.detailValue}>{patient?.emergency_contact || 'N/A'}</Text>
        </View>
      </Card>

      {/* Network & Diagnostics */}
      <Card title="System Diagnostics">
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>CareHub API URL</Text>
          <Text style={[styles.detailValue, styles.monoText]}>{API_BASE_URL}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Payment Gateway</Text>
          <Text style={styles.detailValue}>Central Bank of India UPI QR</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>App Build</Text>
          <Text style={styles.detailValue}>CareHub Expo Mobile v1.0.0</Text>
        </View>
      </Card>

      {/* Sign Out Button */}
      <Button
        title="Sign Out of Account"
        onPress={handleLogout}
        variant="danger"
        size="lg"
        icon={<Ionicons name="log-out-outline" size={20} color="#FFFFFF" />}
        style={{ marginTop: 8 }}
      />
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
  profileHeader: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.soft,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
  },
  email: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  roleTag: {
    backgroundColor: theme.colors.primaryLight,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.full,
    marginTop: 8,
  },
  roleTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primaryDark,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceVariant,
  },
  detailLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
    maxWidth: '65%',
    textAlign: 'right',
  },
  monoText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: theme.colors.primary,
  },
});
