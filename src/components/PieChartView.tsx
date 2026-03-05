import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Svg, { G, Path, Circle } from 'react-native-svg';
import { TopicStats } from '../types';
import { Colors, Spacing, BorderRadius } from '../utils/theme';
import { formatNumber } from '../utils/dataProcessing';

interface PieChartViewProps {
  data: TopicStats[];
}

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

export function PieChartView({ data }: PieChartViewProps) {
  const [metric, setMetric] = useState<'count' | 'shows'>('count');
  const [selected, setSelected] = useState<number | null>(null);

  const top = data.slice(0, 8);
  const total = top.reduce((sum, d) => sum + (metric === 'count' ? d.count : d.totalShows), 0);

  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 75;
  const innerR = 40;

  let currentAngle = 0;
  const slices = top.map((item, i) => {
    const value = metric === 'count' ? item.count : item.totalShows;
    const angle = (value / total) * 360;
    const slice = {
      item,
      startAngle: currentAngle,
      endAngle: currentAngle + angle,
      color: Colors.chartColors[i % Colors.chartColors.length],
      percent: ((value / total) * 100).toFixed(1),
      value,
    };
    currentAngle += angle;
    return slice;
  });

  return (
    <View>
      {/* Metric toggle */}
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

      <View style={styles.chartRow}>
        {/* Donut chart */}
        <Svg width={size} height={size}>
          {slices.map((slice, i) => (
            <Path
              key={i}
              d={describeArc(cx, cy, selected === i ? outerR + 6 : outerR, slice.startAngle, slice.endAngle)}
              fill={slice.color}
              opacity={selected === null || selected === i ? 1 : 0.4}
              onPress={() => setSelected(selected === i ? null : i)}
            />
          ))}
          <Circle cx={cx} cy={cy} r={innerR} fill={Colors.surface} />
          {selected !== null ? (
            <>
              <Text />
            </>
          ) : null}
        </Svg>

        {/* Center label */}
        <View style={[styles.centerLabel, { left: cx - 35, top: cy - 22 }]}>
          {selected !== null ? (
            <>
              <Text style={styles.centerValue}>{slices[selected]?.percent}%</Text>
              <Text style={styles.centerSub} numberOfLines={2}>
                {slices[selected]?.item.topic}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.centerValue}>{top.length}</Text>
              <Text style={styles.centerSub}>тематик</Text>
            </>
          )}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          {slices.map((slice, i) => (
            <TouchableOpacity
              key={i}
              style={styles.legendItem}
              onPress={() => setSelected(selected === i ? null : i)}
            >
              <View style={[styles.legendDot, { backgroundColor: slice.color }]} />
              <View style={styles.legendText}>
                <Text style={styles.legendLabel} numberOfLines={1}>
                  {slice.item.topic}
                </Text>
                <Text style={styles.legendValue}>
                  {metric === 'count'
                    ? `${slice.value} публ.`
                    : formatNumber(slice.value)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
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
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  centerLabel: {
    position: 'absolute',
    width: 70,
    alignItems: 'center',
  },
  centerValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  centerSub: {
    fontSize: 9,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  legend: {
    flex: 1,
    gap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    flex: 1,
  },
  legendLabel: {
    fontSize: 11,
    color: Colors.text,
    fontWeight: '500',
  },
  legendValue: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
});
