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

export const LoginScreen = ({ navigation }: any) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('patient@hospital.com');
  const [password, setPassword] = useState('Hospital@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed.');
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
        {/* Brand Header */}
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Ionicons name="medical" size={36} color={theme.colors.primary} />
          </View>
          <Text style={styles.brandTitle}>CareHub</Text>
          <Text style={styles.brandSubtitle}>Patient Healthcare & Appointment Portal</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.formTitle}>Patient Sign In</Text>
          <Text style={styles.formSubtitle}>Access your appointments, health records, and payments</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color={theme.colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Input
            label="Email Address"
            placeholder="patient@hospital.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            icon={<Ionicons name="mail-outline" size={18} color={theme.colors.textSecondary} />}
          />

          <Input
            label="Password"
            placeholder="Enter password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            icon={<Ionicons name="lock-closed-outline" size={18} color={theme.colors.textSecondary} />}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            }
          />

          <Button
            title="Sign In to CareHub"
            onPress={handleLogin}
            loading={loading}
            size="lg"
            style={styles.submitButton}
          />

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Don't have a patient account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Register Here</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Demo Credentials Box */}
        <View style={styles.demoBox}>
          <View style={styles.demoHeader}>
            <Ionicons name="information-circle-outline" size={18} color={theme.colors.primaryDark} />
            <Text style={styles.demoTitle}>Patient Demo Account</Text>
          </View>
          <Text style={styles.demoBody}>Email: patient@hospital.com</Text>
          <Text style={styles.demoBody}>Password: Hospital@123</Text>
          <Text style={styles.demoNotice}>
            Hospital staff (Admin/Doctor/Receptionist) must sign in through the web application.
          </Text>
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
    padding: theme.spacing.xl,
    justifyContent: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
    ...theme.shadows.soft,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.medium,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  formSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 4,
    marginBottom: theme.spacing.lg,
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
  submitButton: {
    marginTop: theme.spacing.sm,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
  },
  registerText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  registerLink: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  demoBox: {
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.primaryVeryLight,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primaryDark,
  },
  demoBody: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: '500',
  },
  demoNotice: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
});
