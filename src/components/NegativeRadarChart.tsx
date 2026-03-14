import React from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
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
const TOPIC_COLORS = ['#FF6B35', '#FF4B8B', '#FFD93D', '#F44336', '#9C27B0'];

export default function NegativeRadarChart({
  labels,
  values,
  counts,
  total,
}: NegativeRadarChartProps) {
  const { colors, mode } = useTheme();

  // Проверяем, есть ли данные
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

  // На iPhone (iOS) RadarChart вызывает ошибку типизации в Fabric, 
  // поэтому показываем его только в Web или Android (если применимо).
  const showChart = Platform.OS === 'web';

  return (
    <View style={styles.container}>
      {/* Заголовок */}
      <Text style={[styles.title, { color: colors.text }]}>
        Распределение негативных тематик
      </Text>

      {/* Контейнер графика */}
      <View style={[styles.chartWrapper, { paddingVertical: Spacing.md }]}>
        {showChart ? (
          <RadarChart
            data={values}
            labels={labels}
          />
        ) : (
          <View style={styles.fallbackBox}>
            <Text style={{ color: colors.textMuted, fontSize: 12, fontStyle: 'italic', textAlign: 'center' }}>
              График доступен в веб-версии.{"\n"}См. подробную статистику ниже.
            </Text>
          </View>
        )}
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
            <Text style={[styles.legendLabel, { color: colors.text }]}>
              {label}
            </Text>
            <View style={styles.legendNumbers}>
              <Text
                style={[
                  styles.legendPercent,
                  { color: TOPIC_COLORS[i % TOPIC_COLORS.length] },
                ]}
              >
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
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 180,
  },
  fallbackBox: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#ccc',
    width: '80%',
  },
  legend: {
    width: '100%',
    gap: Spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    flexShrink: 0,
  },
  legendLabel: {
    fontSize: 13,
    flex: 1,
    fontWeight: '500',
  },
  legendNumbers: {
    alignItems: 'flex-end',
    gap: 2,
  },
  legendPercent: {
    fontSize: 14,
    fontWeight: '700',
  },
  legendCount: {
    fontSize: 11,
    fontWeight: '400',
  },
  totalNote: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontWeight: '400',
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
