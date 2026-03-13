import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { useTheme } from '../hooks/ThemeContext';
import { Spacing } from '../utils/theme';

interface NegativeRadarChartProps {
  labels: string[];
  /** Значения в процентах (0–100) от общего числа публикаций */
  values: number[];
  /** Абсолютные числа публикаций для каждого тега */
  counts: number[];
  /** Общее число публикаций сущности */
  total: number;
}

const TOPIC_COLORS = ['#FF6B35', '#FF4B8B', '#FFD93D', '#F44336'];

export default function NegativeRadarChart({
  labels,
  values,
  counts,
  total,
}: NegativeRadarChartProps) {
  const { colors } = useTheme();
  
  const hasData = values.some(v => v > 0);
  if (!hasData) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          Нет публикаций с негативными тематиками
        </Text>
      </View>
    );
  }

  const barData = values.map((v, i) => ({
    value: v,
    label: labels[i],
    frontColor: TOPIC_COLORS[i % TOPIC_COLORS.length],
    topLabelComponent: () => (
      <Text style={{ color: colors.text, fontSize: 10, marginBottom: 4 }}>{v}%</Text>
    ),
  }));

  return (
    <View style={styles.container}>
      <View style={styles.chartWrapper}>
        <BarChart
          data={barData}
          barWidth={40}
          noOfSections={4}
          maxValue={100}
          isAnimated
          animationDuration={600}
          yAxisThickness={0}
          xAxisThickness={1}
          xAxisColor={colors.border}
          yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
          labelTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
          hideRules
          backgroundColor="transparent"
          showVerticalLines={false}
          spacing={25}
        />
      </View>
      
      <View style={styles.legend}>
        {labels.map((label, i) => (
          <View
            key={label}
            style={[
              styles.legendItem,
              { backgroundColor: colors.surfaceLight, borderColor: colors.border },
            ]}
          >
            <View
              style={[
                styles.legendDot,
                { backgroundColor: TOPIC_COLORS[i % TOPIC_COLORS.length] },
              ]}
            />
            <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>
              {label}
            </Text>
            <View style={styles.legendNumbers}>
              <Text style={[styles.legendPercent, { color: TOPIC_COLORS[i % TOPIC_COLORS.length] }]}>
                {values[i]}%
              </Text>
              <Text style={[styles.legendCount, { color: colors.textMuted }]}>
                {counts[i]} публ.
              </Text>
            </View>
          </View>
        ))}
      </View>
      <Text style={[styles.totalNote, { color: colors.textMuted }]}>
        Всего публикаций с упоминанием: {total}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingTop: Spacing.sm,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingRight: 20,
  },
  legend: {
    width: '100%',
    gap: Spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  legendLabel: {
    fontSize: 13,
    flex: 1,
    fontWeight: '500',
  },
  legendNumbers: {
    alignItems: 'flex-end',
    gap: 1,
  },
  legendPercent: {
    fontSize: 15,
    fontWeight: '700',
  },
  legendCount: {
    fontSize: 11,
  },
  totalNote: {
    fontSize: 11,
    textAlign: 'center',
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
});
