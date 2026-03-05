import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing } from '../utils/theme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  accent?: string;
}

export function SectionHeader({ title, subtitle, accent = Colors.primary }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.accent, { backgroundColor: accent }]} />
      <View>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  accent: {
    width: 3,
    height: 20,
    borderRadius: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
