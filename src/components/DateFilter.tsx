import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/ThemeContext';
import { Spacing, BorderRadius } from '../utils/theme';

interface DateFilterProps {
  value: 2 | 7 | 30 | null;
  onChange: (v: 2 | 7 | 30 | null) => void;
}

const OPTIONS: { label: string; value: 2 | 7 | 30 }[] = [
  { label: '2 дня', value: 2 },
  { label: '7 дней', value: 7 },
  { label: '30 дней', value: 30 },
];

export function DateFilter({ value, onChange }: DateFilterProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      {OPTIONS.map(opt => {
        const active = value === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.btn,
              { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary + '22' : colors.surfaceLight },
            ]}
            onPress={() => onChange(active ? null : opt.value)}
          >
            <Text style={[styles.btnText, { color: active ? colors.primary : colors.textSecondary }]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  btnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
