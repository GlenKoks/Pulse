import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, BorderRadius, Spacing } from '../utils/theme';

interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  color?: string;
  wide?: boolean;
}

export function StatCard({ label, value, subtitle, color = Colors.primary, wide = false }: StatCardProps) {
  return (
    <View style={[styles.card, wide && styles.wide, { borderLeftColor: color }]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flex: 1,
    borderLeftWidth: 3,
    minHeight: 80,
    maxWidth: 300,
  },
  wide: {
    flex: 2,
    maxWidth: 600,
  },
  label: {
    fontSize: 11,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
