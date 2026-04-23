// constants/theme.ts

export const colors = {
  background: '#FAF9F6',
  surface: '#FFFFFF',
  surfaceAlt: '#F2F0EB',
  border: '#E5E2DA',

  primary: '#1A5C4A',
  primaryLight: '#E8F2EF',
  primaryDark: '#134438',

  accent: '#C17B2F',
  accentLight: '#FBF3E8',

  text: '#1A1A1A',
  textSecondary: '#6B6860',
  textTertiary: '#A8A49C',

  danger: '#C0392B',
  dangerLight: '#FDECEA',
  warning: '#E67E22',
  warningLight: '#FEF5E7',
  success: '#1A5C4A',
  successLight: '#E8F2EF',

  white: '#FFFFFF',
  black: '#000000',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
};

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
};