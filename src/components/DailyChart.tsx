import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Path, Rect, Line, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { DailyStats } from '../types';
import { Colors, Spacing, BorderRadius } from '../utils/theme';
import { formatNumber, formatDate } from '../utils/dataProcessing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DailyChartProps {
  data: DailyStats[];
}

export function DailyChart({ data }: DailyChartProps) {
  const [metric, setMetric] = useState<'count' | 'shows'>('count');

  if (!data.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Нет данных</Text>
      </View>
    );
  }

  // Show last 30 days max for readability
  const displayData = data.slice(-30);

  const chartWidth = Math.max(SCREEN_WIDTH - 64, displayData.length * 28);
  const chartHeight = 160;
  const paddingLeft = 40;
  const paddingRight = 16;
  const paddingTop = 16;
  const paddingBottom = 32;
  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  const values = displayData.map(d => metric === 'count' ? d.count : d.totalShows);
  const maxVal = Math.max(...values, 1);
  const minVal = 0;

  const barWidth = Math.max(6, (plotWidth / displayData.length) - 4);

  // Build path for line chart
  const points = displayData.map((d, i) => {
    const x = paddingLeft + (i / (displayData.length - 1)) * plotWidth;
    const y = paddingTop + plotHeight - ((values[i] - minVal) / (maxVal - minVal)) * plotHeight;
    return { x, y };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const areaPath =
    linePath +
    ` L ${points[points.length - 1].x} ${paddingTop + plotHeight}` +
    ` L ${points[0].x} ${paddingTop + plotHeight} Z`;

  // Y-axis labels
  const yLabels = [0, 0.25, 0.5, 0.75, 1].map(frac => ({
    value: Math.round(minVal + frac * (maxVal - minVal)),
    y: paddingTop + plotHeight - frac * plotHeight,
  }));

  // X-axis labels (every ~5 items)
  const step = Math.max(1, Math.floor(displayData.length / 6));
  const xLabels = displayData
    .map((d, i) => ({ label: formatDate(d.date), x: paddingLeft + (i / (displayData.length - 1)) * plotWidth, i }))
    .filter((_, i) => i % step === 0 || i === displayData.length - 1);

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

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Svg width={chartWidth} height={chartHeight}>
          <Defs>
            <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={Colors.primary} stopOpacity="0.4" />
              <Stop offset="1" stopColor={Colors.primary} stopOpacity="0.02" />
            </LinearGradient>
          </Defs>

          {/* Grid lines */}
          {yLabels.map((lbl, i) => (
            <React.Fragment key={i}>
              <Line
                x1={paddingLeft}
                y1={lbl.y}
                x2={chartWidth - paddingRight}
                y2={lbl.y}
                stroke={Colors.border}
                strokeWidth={1}
                strokeDasharray="4,4"
              />
              <SvgText
                x={paddingLeft - 4}
                y={lbl.y + 4}
                textAnchor="end"
                fontSize={9}
                fill={Colors.textMuted}
              >
                {formatNumber(lbl.value)}
              </SvgText>
            </React.Fragment>
          ))}

          {/* Area fill */}
          <Path d={areaPath} fill="url(#areaGrad)" />

          {/* Line */}
          <Path d={linePath} stroke={Colors.primary} strokeWidth={2} fill="none" strokeLinejoin="round" />

          {/* Data points */}
          {points.map((p, i) => (
            <React.Fragment key={i}>
              <Rect
                x={p.x - barWidth / 2}
                y={p.y}
                width={barWidth}
                height={paddingTop + plotHeight - p.y}
                fill={Colors.primary}
                opacity={0.15}
                rx={2}
              />
            </React.Fragment>
          ))}

          {/* X-axis labels */}
          {xLabels.map((lbl, i) => (
            <SvgText
              key={i}
              x={lbl.x}
              y={chartHeight - 4}
              textAnchor="middle"
              fontSize={9}
              fill={Colors.textMuted}
            >
              {lbl.label}
            </SvgText>
          ))}
        </Svg>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.sm,
    padding: 3,
    marginBottom: Spacing.sm,
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
});
