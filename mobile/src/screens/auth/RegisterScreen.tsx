import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../theme/theme';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';

export const RegisterScreen = ({ navigation }: any) => {
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    dob: '1998-05-20',
    gender: 'Female',
    blood_group: 'B+',
    phone: '',
    address: '',
    emergency_contact: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (key: string, val: string) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const handleRegister = async () => {
    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.password ||
      !form.phone.trim() ||
      !form.address.trim() ||
      !form.emergency_contact.trim()
    ) {
      setError('Please fill in all registration fields.');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await register(form);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Patient Registration</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.subtitle}>
            Create your CareHub patient profile to book appointments and track healthcare bills.
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color={theme.colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Input
            label="Full Name *"
            placeholder="e.g. Ananya Sharma"
            value={form.name}
            onChangeText={(v) => update('name', v)}
          />

          <Input
            label="Email Address *"
            placeholder="e.g. ananya@gmail.com"
            value={form.email}
            onChangeText={(v) => update('email', v)}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Password (min. 6 characters) *"
            placeholder="Create password"
            value={form.password}
            onChangeText={(v) => update('password', v)}
            secureTextEntry
          />

          <View style={styles.row}>
            <View style={styles.col}>
              <Input
                label="Date of Birth (YYYY-MM-DD) *"
                placeholder="1998-05-20"
                value={form.dob}
                onChangeText={(v) => update('dob', v)}
              />
            </View>
            <View style={styles.col}>
              <Input
                label="Gender (Male/Female/Other) *"
                placeholder="Female"
                value={form.gender}
                onChangeText={(v) => update('gender', v)}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Input
                label="Blood Group *"
                placeholder="e.g. B+, O+, AB+"
                value={form.blood_group}
                onChangeText={(v) => update('blood_group', v)}
              />
            </View>
            <View style={styles.col}>
              <Input
                label="Phone Number *"
                placeholder="e.g. 9876543210"
                value={form.phone}
                onChangeText={(v) => update('phone', v)}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <Input
            label="Residential Address *"
            placeholder="e.g. 42 Park Avenue, Pune"
            value={form.address}
            onChangeText={(v) => update('address', v)}
          />

          <Input
            label="Emergency Contact (Name & Phone) *"
            placeholder="e.g. Rohit Sharma - 9876500000"
            value={form.emergency_contact}
            onChangeText={(v) => update('emergency_contact', v)}
          />

          <Button
            title="Create Patient Account"
            onPress={handleRegister}
            loading={loading}
            size="lg"
            style={styles.submitBtn}
          />

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already registered? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flexGrow: 1,
    padding: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  backButton: {
    marginRight: theme.spacing.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.medium,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.errorLight,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.error,
    fontWeight: '500',
  },
  submitBtn: {
    marginTop: theme.spacing.md,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
  },
  loginText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  loginLink: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
  },
});
