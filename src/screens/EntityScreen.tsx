import React, { useState, useMemo, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar,
  ActivityIndicator,
} from 'react-native';
import type { ScrollView as ScrollViewType } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useNewsDataContext } from '../hooks/NewsDataContext';
import { useTheme } from '../hooks/ThemeContext';
import { MetricLineChart } from '../components/MetricLineChart';
import { WordCloud } from '../components/WordCloud';
import { NewsTopList } from '../components/NewsTopList';
import { DateFilter } from '../components/DateFilter';
import { InsightsModal } from '../components/InsightsModal';
import NegativeRadarChart from '../components/NegativeRadarChart';
import { WikipediaCard } from '../components/WikipediaCard';
import {
  filterByEntity, getDailyStats, getWordCloud, applyFilters, formatNumber,
  getNegativeTopicRadarData,
} from '../utils/dataProcessing';
import { Filters } from '../types';
import { Spacing, BorderRadius } from '../utils/theme';
import { usePdfExport, PdfExportOptions } from '../hooks/usePdfExport';

type RouteParams = {
  Entity: {
    type: 'persons' | 'locations' | 'companies';
    name: string;
  };
};

const DEFAULT_FILTERS: Filters = {
  topics: [],
  publishers: [],
  persons: [],
  dateRange: null,
  selectedTopic: null,
};

const ENTITY_LABEL: Record<string, string> = {
  persons: 'Персона',
  locations: 'Локация',
  companies: 'Компания',
};

export function EntityScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'Entity'>>();
  const { type, name } = route.params;

  const { colors, mode, toggle } = useTheme();
  const { allData } = useNewsDataContext();

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [insightsVisible, setInsightsVisible] = useState(false);
  const scrollRef = useRef<ScrollViewType>(null);
  const { exportPdf, loading: pdfLoading } = usePdfExport();

  // Сначала фильтруем по сущности, потом по дате
  const entityData = useMemo(
    () => filterByEntity(allData, type, name),
    [allData, type, name]
  );

  const filteredData = useMemo(
    () => applyFilters(entityData, filters),
    [entityData, filters]
  );

  const dailyStats = useMemo(() => getDailyStats(filteredData), [filteredData]);
  const wordCloud = useMemo(() => getWordCloud(filteredData), [filteredData]);
  const negativeRadarData = useMemo(
    () => getNegativeTopicRadarData(filteredData),
    [filteredData]
  );
  const totalShows = filteredData.reduce((s, item) => s + (item.shows || 0), 0);

  const hasActiveFilters = filters.dateRange !== null;

  const negativeCount = filteredData.filter(
    item => item.bad_verdicts_list && item.bad_verdicts_list.length > 0
  ).length;
  const negativePercent = filteredData.length > 0
    ? Math.round((negativeCount / filteredData.length) * 100)
    : 0;

  const handleExportPdf = () => {
    const options: PdfExportOptions = {
      title: `${ENTITY_LABEL[type] ?? type}: ${name}`,
      sections: [
        {
          heading: 'Статистика',
          rows: [
            { label: 'Публикации', value: formatNumber(filteredData.length) },
            { label: 'Охват', value: formatNumber(totalShows) },
            { label: 'Негатив', value: `${negativePercent}%` },
          ],
        },
        {
          heading: 'Описание',
          text: `Аналитический отчет по сущности "${name}" (${ENTITY_LABEL[type] ?? type}). Данные включают публикации за выбранный период с анализом охвата и негативного контента.`,
        },
      ],
    };
    exportPdf(options);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.backIcon, { color: colors.text }]}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.entityType, { color: colors.textMuted }]}>
              {ENTITY_LABEL[type] ?? type}
            </Text>
            <Text style={[styles.entityName, { color: colors.text }]} numberOfLines={1}>
              {name}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}
            onPress={toggle}
          >
            <Text style={styles.iconBtnText}>{mode === 'dark' ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pdfBtn, { backgroundColor: colors.accentOrange }]}
            onPress={handleExportPdf}
            disabled={pdfLoading}
          >
            {pdfLoading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.btnText}>📄 PDF</Text>
            }
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.insightsBtn, { backgroundColor: colors.primary }]}
            onPress={() => setInsightsVisible(true)}
          >
            <Text style={styles.btnText}>✦ Выводы</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Date filters */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>Период</Text>
          <View style={styles.filterRow}>
            <DateFilter
              value={filters.dateRange}
              onChange={(v) => setFilters({ ...filters, dateRange: v })}
            />
            {hasActiveFilters && (
              <TouchableOpacity
                style={[styles.resetBtn, { backgroundColor: colors.error + '22', borderColor: colors.error + '66' }]}
                onPress={() => setFilters(DEFAULT_FILTERS)}
              >
                <Text style={[styles.resetText, { color: colors.error }]}>Сбросить</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Stat cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: colors.primary }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>ПУБЛИКАЦИИ</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>{formatNumber(filteredData.length)}</Text>
            <Text style={[styles.statSub, { color: colors.textMuted }]}>с упоминанием</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: colors.accent }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>ОХВАТ</Text>
            <Text style={[styles.statValue, { color: colors.accent }]}>{formatNumber(totalShows)}</Text>
            <Text style={[styles.statSub, { color: colors.textMuted }]}>суммарный</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: colors.error }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>НЕГАТИВ</Text>
            <Text style={[styles.statValue, { color: colors.error }]}>{negativePercent}%</Text>
            <Text style={[styles.statSub, { color: colors.textMuted }]}>публикаций</Text>
          </View>
        </View>

        {/* Wikipedia card — только для персон */}
        {type === 'persons' && (
          <WikipediaCard name={name} />
        )}

        {/* Line chart */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Динамика публикаций</Text>
          <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
            По дням · упоминания «{name}»
          </Text>
          <MetricLineChart data={dailyStats} />
        </View>

        {/* Negative topics Radar Chart */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Негативные тематики</Text>
              <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                Распределение по типам негатива · «{name}»
              </Text>
            </View>
            {negativeCount > 0 && (
              <View style={[styles.negBadge, { backgroundColor: colors.error + '22', borderColor: colors.error + '55' }]}>
                <Text style={[styles.negBadgeText, { color: colors.error }]}>{negativeCount} публ.</Text>
              </View>
            )}
          </View>
          <NegativeRadarChart
            labels={negativeRadarData.labels}
            values={negativeRadarData.values}
            counts={negativeRadarData.counts}
            total={negativeRadarData.total}
          />
        </View>

        {/* Word cloud */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Облако слов</Text>
          <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
            Из заголовков с упоминанием «{name}»
          </Text>
          <WordCloud words={wordCloud} />
        </View>

        {/* Top news */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Топ новостей</Text>
          <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
            С упоминанием «{name}» · по охвату
          </Text>
          <NewsTopList data={filteredData} limit={10} />
        </View>
      </ScrollView>

      <InsightsModal visible={insightsVisible} onClose={() => setInsightsVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
  },
  backIcon: {
    fontSize: 24,
    lineHeight: 28,
    marginTop: -2,
  },
  entityType: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  entityName: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexShrink: 0,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  iconBtnText: { fontSize: 16 },
  pdfBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.xl,
    minWidth: 60,
    alignItems: 'center',
  },
  insightsBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.xl,
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  scroll: { flex: 1 },
  content: { padding: Spacing.md, gap: Spacing.md },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
    marginTop: Spacing.xs,
  },
  resetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  resetText: { fontSize: 12, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: {
    flex: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderLeftWidth: 3,
  },
  statLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  statValue: { fontSize: 22, fontWeight: '700' },
  statSub: { fontSize: 10, marginTop: 2 },
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    gap: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  cardSub: { fontSize: 12, marginBottom: Spacing.sm },
  negBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  negBadgeText: { fontSize: 11, fontWeight: '700' },
});
