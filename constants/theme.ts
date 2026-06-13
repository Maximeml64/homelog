/**
 * Homelog Design System — "Carnet de patrimoine maison"
 * Direction A : Anthracite + or champagne, fond papier chaud
 *
 * Typography : IBM Plex Serif (titres éditoriaux) + Inter (UI/body)
 * Palette : monochrome anthracite, or champagne en accent discret
 */

export const COLORS = {
  primary: '#1F2937',
  primaryDark: '#111827',
  primaryMuted: 'rgba(31, 41, 55, 0.08)',

  accent: '#C9A961',
  accentDark: '#A88B45',
  accentMuted: 'rgba(201, 169, 97, 0.10)',

  background: '#FAFAF9',
  surface: '#FFFFFF',
  surfaceAlt: '#F5F5F4',

  text: '#18181B',
  textSecondary: '#52525B',
  textTertiary: '#A1A1AA',
  textInverse: '#FAFAF9',

  border: '#E7E5E4',
  borderStrong: '#D6D3D1',

  danger: '#B91C1C',
  dangerMuted: 'rgba(185, 28, 28, 0.10)',
  warning: '#B45309',
  warningMuted: 'rgba(180, 83, 9, 0.10)',
  success: '#15803D',
  successMuted: 'rgba(21, 128, 61, 0.10)',
  info: '#1D4ED8',
  infoMuted: 'rgba(29, 78, 216, 0.10)',
} as const;

export const FONTS = {
  serif: 'IBMPlexSerif_400Regular',
  serifMedium: 'IBMPlexSerif_500Medium',
  serifSemiBold: 'IBMPlexSerif_600SemiBold',
  serifBold: 'IBMPlexSerif_700Bold',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemiBold: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',
} as const;

export const TYPOGRAPHY = {
  display: { fontFamily: FONTS.serifBold, fontSize: 40, lineHeight: 46, letterSpacing: -1, color: COLORS.text },
  h1: { fontFamily: FONTS.serifBold, fontSize: 32, lineHeight: 38, letterSpacing: -0.5, color: COLORS.text },
  h2: { fontFamily: FONTS.serifSemiBold, fontSize: 24, lineHeight: 30, letterSpacing: -0.3, color: COLORS.text },
  h3: { fontFamily: FONTS.serifSemiBold, fontSize: 20, lineHeight: 26, color: COLORS.text },
  title: { fontFamily: FONTS.sansSemiBold, fontSize: 17, lineHeight: 24, color: COLORS.text },
  body: { fontFamily: FONTS.sans, fontSize: 15, lineHeight: 22, color: COLORS.text },
  bodyMedium: { fontFamily: FONTS.sansMedium, fontSize: 15, lineHeight: 22, color: COLORS.text },
  small: { fontFamily: FONTS.sans, fontSize: 13, lineHeight: 18, color: COLORS.textSecondary },
  smallMedium: { fontFamily: FONTS.sansMedium, fontSize: 13, lineHeight: 18, color: COLORS.text },
  eyebrow: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
    color: COLORS.textSecondary,
  },
  caption: { fontFamily: FONTS.sans, fontSize: 11, lineHeight: 14, color: COLORS.textTertiary },
  numericLarge: { fontFamily: FONTS.sansSemiBold, fontSize: 28, lineHeight: 32, color: COLORS.text, fontVariant: ['tabular-nums'] as const },
  numericMedium: { fontFamily: FONTS.sansMedium, fontSize: 17, lineHeight: 22, color: COLORS.text, fontVariant: ['tabular-nums'] as const },
  numericSmall: { fontFamily: FONTS.sansMedium, fontSize: 13, lineHeight: 18, color: COLORS.textSecondary, fontVariant: ['tabular-nums'] as const },
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  huge: 64,
} as const;

export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const SHADOWS = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  xl: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.10, shadowRadius: 24, elevation: 8 },
} as const;

export const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;

export const TAB_BAR = {
  height: 84,
  paddingBottom: 24,
  paddingTop: 10,
} as const;

export const theme = {
  colors: COLORS,
  fonts: FONTS,
  typography: TYPOGRAPHY,
  spacing: SPACING,
  radius: RADIUS,
  shadows: SHADOWS,
  hitSlop: HIT_SLOP,
  tabBar: TAB_BAR,
} as const;
export default theme;
