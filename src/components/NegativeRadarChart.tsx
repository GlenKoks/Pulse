import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { RadarChart } from 'react-native-gifted-charts';
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

const SCREEN_WIDTH = Dimensions.get('window').width;
const TOPIC_COLORS = ['#FF6B35', '#FF4B8B', '#FFD93D', '#F44336'];

export default function NegativeRadarChart({
  labels,
  values,
  counts,
  total,
}: NegativeRadarChartProps) {
  const { colors, mode } = useTheme();

  const chartSize = Math.min(SCREEN_WIDTH - Spacing.md * 4, 280);

  // Передаём проценты напрямую (0–100), maxValue=100
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

  return (
    <View style={styles.container}>
      <View style={styles.chartWrapper}>
        <RadarChart
          data={values}
          labels={labels}
          maxValue={100}
          noOfSections={4}
          chartSize={chartSize}
          isAnimated
          animationDuration={600}
          labelConfig={{
            fontSize: 12,
            stroke: colors.textSecondary,
            fontWeight: '600',
          }}
          gridConfig={{
            stroke: colors.border,
            strokeWidth: 1,
            fill: mode === 'dark' ? '#1a1a2e' : '#f0f0f8',
            opacity: 1,
          }}
          polygonConfig={{
            stroke: '#FF4B8B',
            strokeWidth: 2.5,
            fill: '#FF4B8B',
            opacity: 0.3,
            gradientColor: '#FF6B35',
            showGradient: true,
            isAnimated: true,
            animationDuration: 600,
          }}
          asterLinesConfig={{
            stroke: colors.border,
            strokeWidth: 1,
          }}
        />
      </View>

      {/* Легенда: название + % + абсолютное число */}
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
  },
  legend: {
    width: '100%',
    gap: Spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
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
