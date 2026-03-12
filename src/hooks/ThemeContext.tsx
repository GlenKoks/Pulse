import React, { createContext, useContext, useState, useMemo } from 'react';

export type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
  mode: ThemeMode;
  toggle: () => void;
  colors: typeof darkColors;
}

const darkColors = {
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
  cardShadow: 'rgba(0,0,0,0.4)',
  chartColors: [
    '#6C63FF', '#00D4AA', '#FF6B35', '#FF4B8B', '#FFD93D',
    '#4ECDC4', '#A78BFA', '#34D399', '#FB923C', '#F472B6',
  ],
};

const lightColors = {
  background: '#F4F6FB',
  surface: '#FFFFFF',
  surfaceLight: '#EEF0F8',
  border: '#DDE1F0',
  primary: '#5A52E0',
  primaryLight: '#7B74F5',
  accent: '#00B894',
  accentOrange: '#E55A2B',
  accentPink: '#E03070',
  accentYellow: '#E6C200',
  accentBlue: '#3AB8B0',
  text: '#1A1D27',
  textSecondary: '#5A5E78',
  textMuted: '#9699B0',
  success: '#388E3C',
  warning: '#F57C00',
  error: '#D32F2F',
  cardShadow: 'rgba(0,0,0,0.08)',
  chartColors: [
    '#5A52E0', '#00B894', '#E55A2B', '#E03070', '#E6C200',
    '#3AB8B0', '#7B74F5', '#27AE60', '#E67E22', '#E91E8C',
  ],
};

const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark',
  toggle: () => {},
  colors: darkColors,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('dark');

  const value = useMemo(() => ({
    mode,
    toggle: () => setMode(m => m === 'dark' ? 'light' : 'dark'),
    colors: mode === 'dark' ? darkColors : lightColors,
  }), [mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
