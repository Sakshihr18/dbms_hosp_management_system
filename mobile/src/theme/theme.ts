export const theme = {
  colors: {
    primary: '#0D9488', // Teal 600 - CareHub Medical Teal
    primaryDark: '#0F766E', // Teal 700
    primaryLight: '#CCFBF1', // Teal 100
    primaryVeryLight: '#F0FDFA', // Teal 50
    secondary: '#0284C7', // Sky 600
    background: '#F8FAFC', // Slate 50
    surface: '#FFFFFF',
    surfaceVariant: '#F1F5F9', // Slate 100
    text: '#0F172A', // Slate 900
    textSecondary: '#64748B', // Slate 500
    textMuted: '#94A3B8', // Slate 400
    border: '#E2E8F0', // Slate 200
    borderDark: '#CBD5E1', // Slate 300
    success: '#10B981', // Emerald 500
    successLight: '#D1FAE5',
    warning: '#F59E0B', // Amber 500
    warningLight: '#FEF3C7',
    error: '#EF4444', // Red 500
    errorLight: '#FEE2E2',
    purple: '#7C3AED', // Violet 600 - for Pending Verification
    purpleLight: '#EDE9FE',
  },
  typography: {
    h1: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.5 },
    h2: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.4 },
    h3: { fontSize: 17, fontWeight: '600' as const },
    body: { fontSize: 14, fontWeight: '400' as const },
    bodyBold: { fontSize: 14, fontWeight: '600' as const },
    caption: { fontSize: 12, fontWeight: '400' as const },
    captionBold: { fontSize: 12, fontWeight: '600' as const },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  borderRadius: {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
    full: 9999,
  },
  shadows: {
    soft: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    medium: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
  },
};
