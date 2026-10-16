import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme/theme';

interface BadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ status, size = 'sm' }) => {
  const getBadgeStyle = (val: string) => {
    switch (val) {
      case 'Scheduled':
      case 'Ordered':
        return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' }; // Blue
      case 'Completed':
      case 'Paid':
        return { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' }; // Emerald
      case 'Cancelled':
      case 'Discharged':
        return { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' }; // Slate
      case 'Pending':
      case 'Awaiting Payment':
        return { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' }; // Amber
      case 'Pending Verification':
        return { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE' }; // Purple
      case 'Rejected':
        return { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' }; // Red
      default:
        return { bg: '#F8FAFC', text: '#334155', border: '#E2E8F0' };
    }
  };

  const styleConfig = getBadgeStyle(status);
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: styleConfig.bg,
          borderColor: styleConfig.border,
          paddingVertical: isSmall ? 2 : 5,
          paddingHorizontal: isSmall ? 8 : 12,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: styleConfig.text,
            fontSize: isSmall ? 11 : 13,
            fontWeight: isSmall ? '600' : '700',
          },
        ]}
      >
        {status}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textTransform: 'none',
  },
});
