import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { TopicStats } from '../types';
import { useTheme } from '../hooks/ThemeContext';
import { formatNumber } from '../utils/dataProcessing';
import { Spacing, BorderRadius } from '../utils/theme';

interface DonutChartProps {
  data: TopicStats[];
  onTopicSelect?: (topic: string | null) => void;
  selectedTopic?: string | null;
}

type Metric = 'count' | 'shows';

export function DonutChart({ data, onTopicSelect, selectedTopic }: DonutChartProps) {
  const { colors } = useTheme();
  const [metric, setMetric] = useState<Metric>('count');
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const top = data.slice(0, 10);
  const total = top.reduce((s, d) => s + (metric === 'count' ? d.count : d.totalShows), 0);

  const pieData = top.map((d, i) => ({
    value: metric === 'count' ? d.count : d.totalShows,
    color: colors.chartColors[i % colors.chartColors.length],
    text: '',
    focused: focusedIndex === i,
    topic: d.topic,
  }));

  const handlePress = (index: number) => {
    const newFocus = focusedIndex === index ? null : index;
    setFocusedIndex(newFocus);
    if (onTopicSelect) {
      onTopicSelect(newFocus !== null ? top[newFocus].topic : null);
    }
  };

  if (!top.length) {
    return (
      <View style={styles.empty}>
        <Text style={{ color: colors.textMuted }}>Нет данных</Text>
      </View>
    );
  }

  const centerLabel = focusedIndex !== null
    ? formatNumber(metric === 'count' ? top[focusedIndex].count : top[focusedIndex].totalShows)
    : formatNumber(total);

  const centerSub = focusedIndex !== null
    ? top[focusedIndex].topic
    : (metric === 'count' ? 'публ.' : 'охват');

  return (
    <View>
      {/* Metric toggle */}
      <View style={[styles.toggle, { backgroundColor: colors.surfaceLight }]}>
        {(['count', 'shows'] as Metric[]).map(m => (
          <TouchableOpacity
            key={m}
            style={[styles.toggleBtn, metric === m && { backgroundColor: colors.primary }]}
            onPress={() => { setMetric(m); setFocusedIndex(null); if (onTopicSelect) onTopicSelect(null); }}
          >
            <Text style={[styles.toggleText, { color: metric === m ? '#fff' : colors.textSecondary }]}>
              {m === 'count' ? 'Публикации' : 'Охват'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.row}>
        {/* Donut */}
        <View style={styles.chartContainer}>
          <PieChart
            data={pieData}
            donut
            radius={80}
            innerRadius={52}
            innerCircleColor={colors.surface}
            centerLabelComponent={() => (
              <View style={styles.centerLabel}>
                <Text style={[styles.centerValue, { color: colors.text }]} numberOfLines={1}>
                  {centerLabel}
                </Text>
                <Text style={[styles.centerSub, { color: colors.textSecondary }]} numberOfLines={2}>
                  {centerSub}
                </Text>
              </View>
            )}
            onPress={(_item: any, index: number) => handlePress(index)}
            focusOnPress
            toggleFocusOnPress
            showGradient={false}
            strokeWidth={1}
            strokeColor={colors.surface}
          />
        </View>

        {/* Legend */}
        <ScrollView style={styles.legend} showsVerticalScrollIndicator={false} nestedScrollEnabled>
          {top.map((d, i) => {
            const isSelected = selectedTopic === d.topic;
            return (
              <TouchableOpacity
                key={d.topic}
                style={[styles.legendItem, isSelected && { backgroundColor: colors.primary + '15', borderRadius: 6 }]}
                onPress={() => handlePress(i)}
              >
                <View style={[styles.dot, { backgroundColor: colors.chartColors[i % colors.chartColors.length] }]} />
                <View style={styles.legendText}>
                  <Text style={[styles.legendLabel, { color: colors.text }]} numberOfLines={1}>
                    {d.topic}
                  </Text>
                  <Text style={[styles.legendValue, { color: colors.textSecondary }]}>
                    {metric === 'count' ? `${d.count} публ.` : formatNumber(d.totalShows)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {selectedTopic && (
        <View style={[styles.filterBadge, { backgroundColor: colors.primary + '22', borderColor: colors.primary }]}>
          <Text style={[styles.filterBadgeText, { color: colors.primary }]}>
            Фильтр: {selectedTopic}
          </Text>
          <TouchableOpacity onPress={() => { setFocusedIndex(null); if (onTopicSelect) onTopicSelect(null); }}>
            <Text style={[styles.filterBadgeText, { color: colors.primary }]}> ✕</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    borderRadius: BorderRadius.sm,
    padding: 3,
    marginBottom: Spacing.md,
    alignSelf: 'flex-start',
  },
  toggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    alignItems: 'center',
    width: 90,
  },
  centerValue: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  centerSub: {
    fontSize: 9,
    textAlign: 'center',
    marginTop: 2,
  },
  legend: {
    flex: 1,
    maxHeight: 200,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 4,
    marginBottom: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  legendText: {
    flex: 1,
  },
  legendLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  legendValue: {
    fontSize: 10,
  },
  filterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  empty: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
