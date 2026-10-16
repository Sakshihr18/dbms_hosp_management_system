import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { theme } from '../theme/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          button: { backgroundColor: theme.colors.secondary },
          text: { color: '#FFFFFF' },
        };
      case 'outline':
        return {
          button: {
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: theme.colors.primary,
          },
          text: { color: theme.colors.primary, fontWeight: '600' as const },
        };
      case 'danger':
        return {
          button: { backgroundColor: theme.colors.error },
          text: { color: '#FFFFFF' },
        };
      case 'ghost':
        return {
          button: { backgroundColor: 'transparent' },
          text: { color: theme.colors.textSecondary },
        };
      case 'primary':
      default:
        return {
          button: { backgroundColor: theme.colors.primary },
          text: { color: '#FFFFFF' },
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          button: { paddingVertical: 8, paddingHorizontal: 12 },
          text: { fontSize: 13 },
        };
      case 'lg':
        return {
          button: { paddingVertical: 14, paddingHorizontal: 20 },
          text: { fontSize: 16, fontWeight: '700' as const },
        };
      case 'md':
      default:
        return {
          button: { paddingVertical: 11, paddingHorizontal: 16 },
          text: { fontSize: 14, fontWeight: '600' as const },
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.baseButton,
        variantStyles.button,
        sizeStyles.button,
        disabled && styles.disabledButton,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? theme.colors.primary : '#FFFFFF'}
        />
      ) : (
        <>
          {icon}
          <Text style={[styles.baseText, variantStyles.text, sizeStyles.text, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    borderRadius: theme.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  baseText: {
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
});
