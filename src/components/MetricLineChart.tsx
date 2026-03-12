import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { DailyStats } from '../types';
import { useTheme } from '../hooks/ThemeContext';
import { formatDate, formatNumber } from '../utils/dataProcessing';
import { Spacing, BorderRadius } from '../utils/theme';

interface MetricLineChartProps {
  data: DailyStats[];
}

type Metric = 'count' | 'shows';

export function MetricLineChart({ data }: MetricLineChartProps) {
  const { colors } = useTheme();
  const [metric, setMetric] = useState<Metric>('count');
  const screenWidth = Dimensions.get('window').width;

  const chartData = data.map(d => ({
    value: metric === 'count' ? d.count : d.totalShows,
    label: formatDate(d.date),
    dataPointText: '',
  }));

  if (!chartData.length) {
    return (
      <View style={styles.empty}>
        <Text style={{ color: colors.textMuted }}>Нет данных</Text>
      </View>
    );
  }

  const maxVal = Math.max(...chartData.map(d => d.value), 1);

  return (
    <View>
      {/* Metric toggle */}
      <View style={[styles.toggle, { backgroundColor: colors.surfaceLight }]}>
        {(['count', 'shows'] as Metric[]).map(m => (
          <TouchableOpacity
            key={m}
            style={[styles.toggleBtn, metric === m && { backgroundColor: colors.primary }]}
            onPress={() => setMetric(m)}
          >
            <Text style={[styles.toggleText, { color: metric === m ? '#fff' : colors.textSecondary }]}>
              {m === 'count' ? 'Публикации' : 'Охват'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chart */}
      <View style={styles.chartWrap}>
        <LineChart
          data={chartData}
          width={screenWidth - 80}
          height={180}
          curved
          color={colors.primary}
          thickness={2}
          dataPointsColor={colors.primary}
          dataPointsRadius={3}
          startFillColor={colors.primary}
          endFillColor={colors.primary}
          startOpacity={0.25}
          endOpacity={0.02}
          areaChart
          hideDataPoints={chartData.length > 15}
          xAxisColor={colors.border}
          yAxisColor={colors.border}
          yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
          xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 9 }}
          noOfSections={4}
          maxValue={maxVal * 1.2}
          rulesColor={colors.border}
          rulesType="solid"
          showVerticalLines={false}
          yAxisLabelWidth={50}
          formatYLabel={(v) => formatNumber(Number(v))}
          hideYAxisText={false}
          backgroundColor="transparent"
          initialSpacing={10}
          spacing={Math.max(20, (screenWidth - 120) / Math.max(chartData.length, 1))}
        />
      </View>
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
  chartWrap: {
    marginLeft: -10,
  },
  empty: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
