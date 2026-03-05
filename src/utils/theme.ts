export const Colors = {
  background: '#0F1117',
  surface: '#1A1D27',
  surfaceLight: '#22263A',
  border: '#2A2D3E',
  primary: '#6C63FF',
  primaryLight: '#8B85FF',
  accent: '#00D4AA',
  accentOrange: '#FF6B35',
  accentPink: '#FF4B8B',
  accentYellow: '#FFD93D',
  accentBlue: '#4ECDC4',
  text: '#FFFFFF',
  textSecondary: '#8B8FA8',
  textMuted: '#555870',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  chartColors: [
    '#6C63FF',
    '#00D4AA',
    '#FF6B35',
    '#FF4B8B',
    '#FFD93D',
    '#4ECDC4',
    '#A78BFA',
    '#34D399',
    '#FB923C',
    '#F472B6',
  ],
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const Typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, color: Colors.text },
  h2: { fontSize: 22, fontWeight: '700' as const, color: Colors.text },
  h3: { fontSize: 18, fontWeight: '600' as const, color: Colors.text },
  h4: { fontSize: 16, fontWeight: '600' as const, color: Colors.text },
  body: { fontSize: 14, fontWeight: '400' as const, color: Colors.text },
  caption: { fontSize: 12, fontWeight: '400' as const, color: Colors.textSecondary },
  small: { fontSize: 11, fontWeight: '400' as const, color: Colors.textMuted },
};
