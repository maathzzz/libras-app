// Provisional values until the Claude Design tokens are imported.
export const colors = {
  background: '#FFFFFF',
  surface: '#F2F5F9',
  primary: '#208AEF',
  onPrimary: '#FFFFFF',
  text: '#1B1F24',
  textMuted: '#5B6470',
  streak: '#FF8A00',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const fontSize = {
  body: 16,
  title: 24,
} as const;

export const fontWeight = {
  regular: '400',
  bold: '700',
} as const;

export const radius = {
  md: 12,
} as const;

// Minimum touch area required by the accessibility guidelines.
export const minTouchTarget = 44;
