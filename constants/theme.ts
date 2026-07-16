export const COLORS = {
  primary: '#F59E0B',
  primaryLight: '#FEF3C7',
  primaryDark: '#D97706',
  success: '#16A34A',
  successLight: '#F0FDF4',
  danger: '#DC2626',
  dangerLight: '#FEF2F2',
  warning: '#EA580C',
  warningLight: '#FFF7ED',
  bg: '#FAFAF9',
  card: '#FFFFFF',
  border: '#E5E7EB',
  text: '#111827',
  textMuted: '#6B7280',
  textLight: '#9CA3AF',
}

export const DARK_COLORS = {
  primary: '#F59E0B',
  primaryLight: '#292120',
  primaryDark: '#FCD34D',
  success: '#4ADE80',
  successLight: '#14532D',
  danger: '#F87171',
  dangerLight: '#450A0A',
  warning: '#FB923C',
  warningLight: '#431407',
  bg: '#1C1917',
  card: '#292524',
  border: '#44403C',
  text: '#F5F5F4',
  textMuted: '#A8A29E',
  textLight: '#78716C',
}

export type AppColors = typeof COLORS
export type ColorValue = string

export const FONTS = {
  xs: 11,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
} as const

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 16,
  full: 9999,
} as const
