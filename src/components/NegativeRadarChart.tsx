import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { RadarChart } from 'react-native-gifted-charts';
import { useTheme } from '../hooks/ThemeContext';
import { Spacing } from '../utils/theme';

interface NegativeRadarChartProps {
  labels: string[];
  values: number[];
  maxValue: number;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

// Цвета для негативных тематик
const TOPIC_COLORS = ['#FF6B35', '#FF4B8B', '#FFD93D', '#F44336'];
const TOPIC_LABELS: Record<string, string> = {
  'Желтуха': 'Желтуха',
  'Конфликт': 'Конфликт',
  'Насилие': 'Насилие',
  'Жестокость': 'Жестокость',
};

export default function NegativeRadarChart({ labels, values, maxValue }: NegativeRadarChartProps) {
  const { colors } = useTheme();

  // Размер диаграммы — адаптивный
  const chartSize = Math.min(SCREEN_WIDTH - Spacing.md * 4, 280);

  // Нормализуем значения к maxValue для RadarChart
  const normalizedValues = values.map(v => (maxValue > 0 ? Math.round((v / maxValue) * 100) : 0));

  return (
    <View style={styles.container}>
      <View style={styles.chartWrapper}>
        <RadarChart
          data={normalizedValues}
          labels={labels}
          maxValue={100}
          noOfSections={4}
          chartSize={chartSize}
          isAnimated
          animationDuration={800}
          labelConfig={{
            fontSize: 11,
            stroke: colors.textSecondary,
            fontWeight: '600',
          }}
          gridConfig={{
            stroke: colors.border,
            strokeWidth: 1,
            fill: colors.surface,
            opacity: 0.8,
          }}
          polygonConfig={{
            stroke: '#FF4B8B',
            strokeWidth: 2,
            fill: '#FF4B8B',
            opacity: 0.25,
            gradientColor: '#FF6B35',
            showGradient: true,
            isAnimated: true,
            animationDuration: 800,
          }}
          asterLinesConfig={{
            stroke: colors.border,
            strokeWidth: 1,
          }}
        />
      </View>

      {/* Легенда с абсолютными значениями */}
      <View style={styles.legend}>
        {labels.map((label, i) => (
          <View key={label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: TOPIC_COLORS[i % TOPIC_COLORS.length] }]} />
            <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>
              {TOPIC_LABELS[label] || label}
            </Text>
            <Text style={[styles.legendValue, { color: colors.text }]}>
              {values[i]}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  legend: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 120,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 12,
    flex: 1,
  },
  legendValue: {
    fontSize: 13,
    fontWeight: '700',
    minWidth: 28,
    textAlign: 'right',
  },
});
