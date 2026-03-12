import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useNewsDataContext } from '../hooks/NewsDataContext';
import { useTheme } from '../hooks/ThemeContext';
import { MetricLineChart } from '../components/MetricLineChart';
import { WordCloud } from '../components/WordCloud';
import { NewsTopList } from '../components/NewsTopList';
import { DateFilter } from '../components/DateFilter';
import { InsightsModal } from '../components/InsightsModal';
import {
  filterByEntity, getDailyStats, getWordCloud, applyFilters, formatNumber,
} from '../utils/dataProcessing';
import { Filters } from '../types';
import { Spacing, BorderRadius } from '../utils/theme';

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

  // First filter by entity, then apply date/other filters
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
  const totalShows = filteredData.reduce((s, item) => s + (item.shows || 0), 0);

  const hasActiveFilters = filters.dateRange !== null;

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
          <View>
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
            style={[styles.insightsBtn, { backgroundColor: colors.primary }]}
            onPress={() => setInsightsVisible(true)}
          >
            <Text style={styles.insightsBtnText}>✦ Выводы</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
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
        </View>

        {/* Line chart */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Динамика публикаций</Text>
          <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
            По дням · упоминания «{name}»
          </Text>
          <MetricLineChart data={dailyStats} />
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
  insightsBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.xl,
  },
  insightsBtnText: {
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
  statValue: { fontSize: 24, fontWeight: '700' },
  statSub: { fontSize: 10, marginTop: 2 },
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    gap: 4,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  cardSub: { fontSize: 12, marginBottom: Spacing.sm },
});
