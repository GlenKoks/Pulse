import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { PublisherStats } from '../types';
import { Colors, Spacing, BorderRadius } from '../utils/theme';
import { formatNumber } from '../utils/dataProcessing';

interface PublishersChartProps {
  data: PublisherStats[];
  limit?: number;
}

export function PublishersChart({ data, limit = 10 }: PublishersChartProps) {
  const [metric, setMetric] = useState<'count' | 'shows'>('count');
  const displayData = data.slice(0, limit);
  const maxVal = Math.max(...displayData.map(d => metric === 'count' ? d.count : d.totalShows), 1);

  if (!displayData.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Нет данных</Text>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.toggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, metric === 'count' && styles.toggleActive]}
          onPress={() => setMetric('count')}
        >
          <Text style={[styles.toggleText, metric === 'count' && styles.toggleTextActive]}>
            Публикации
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, metric === 'shows' && styles.toggleActive]}
          onPress={() => setMetric('shows')}
        >
          <Text style={[styles.toggleText, metric === 'shows' && styles.toggleTextActive]}>
            Охват
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        {displayData.map((pub, index) => {
          const value = metric === 'count' ? pub.count : pub.totalShows;
          const barWidth = (value / maxVal) * 100;
          const color = Colors.chartColors[index % Colors.chartColors.length];
          return (
            <View key={pub.name} style={styles.row}>
              <Text style={styles.name} numberOfLines={1}>
                {pub.name}
              </Text>
              <View style={styles.barContainer}>
                <View style={styles.barBg}>
                  <View
                    style={[styles.bar, { width: `${barWidth}%`, backgroundColor: color }]}
                  />
                </View>
                <Text style={[styles.value, { color }]}>{formatNumber(value)}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceLight,
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
  toggleActive: {
    backgroundColor: Colors.primary,
  },
  toggleText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: Colors.text,
    fontWeight: '600',
  },
  container: {
    gap: 10,
  },
  row: {
    gap: 4,
  },
  name: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barBg: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
    opacity: 0.85,
  },
  value: {
    fontSize: 11,
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },
  empty: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
});
