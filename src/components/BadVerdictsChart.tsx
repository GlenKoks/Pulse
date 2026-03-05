import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TopicStats } from '../types';
import { Colors, Spacing, BorderRadius } from '../utils/theme';
import { formatNumber } from '../utils/dataProcessing';

interface BadVerdictsChartProps {
  data: TopicStats[];
}

const VERDICT_COLORS: Record<string, string> = {
  'Желтуха': '#FFD93D',
  'Политика': '#FF6B35',
  'Конфликт': '#F44336',
  'Оскорбления': '#FF4B8B',
  'Жестокость': '#9C27B0',
  'Кликбейт': '#FF9800',
  'Манипуляция': '#E91E63',
  'Дезинформация': '#F44336',
};

export function BadVerdictsChart({ data }: BadVerdictsChartProps) {
  if (!data.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Нет нарушений</Text>
      </View>
    );
  }

  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <View style={styles.container}>
      {/* Summary row */}
      <View style={styles.summaryRow}>
        {data.slice(0, 4).map((item, i) => {
          const color = VERDICT_COLORS[item.topic] || Colors.chartColors[i % Colors.chartColors.length];
          const percent = ((item.count / total) * 100).toFixed(0);
          return (
            <View key={item.topic} style={[styles.badge, { borderColor: color }]}>
              <Text style={[styles.badgeText, { color }]}>{item.topic}</Text>
              <Text style={[styles.badgeCount, { color }]}>{percent}%</Text>
            </View>
          );
        })}
      </View>

      {/* Bar chart */}
      {data.map((item, i) => {
        const color = VERDICT_COLORS[item.topic] || Colors.chartColors[i % Colors.chartColors.length];
        const barWidth = (item.count / data[0].count) * 100;
        return (
          <View key={item.topic} style={styles.row}>
            <View style={styles.labelRow}>
              <View style={[styles.dot, { backgroundColor: color }]} />
              <Text style={styles.label}>{item.topic}</Text>
              <Text style={[styles.count, { color }]}>{item.count}</Text>
            </View>
            <View style={styles.barBg}>
              <View style={[styles.bar, { width: `${barWidth}%`, backgroundColor: color }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  badgeCount: {
    fontSize: 11,
    fontWeight: '700',
  },
  row: {
    gap: 4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    flex: 1,
    fontSize: 12,
    color: Colors.text,
  },
  count: {
    fontSize: 12,
    fontWeight: '600',
  },
  barBg: {
    height: 5,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 3,
    opacity: 0.8,
  },
  empty: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
});
