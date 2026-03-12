import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useNewsDataContext } from '../hooks/NewsDataContext';
import { useTheme } from '../hooks/ThemeContext';
import { MetricLineChart } from '../components/MetricLineChart';
import { DonutChart } from '../components/DonutChart';
import { WordCloud } from '../components/WordCloud';
import { EntityRanking } from '../components/EntityRanking';
import { DateFilter } from '../components/DateFilter';
import { InsightsModal } from '../components/InsightsModal';
import { formatNumber } from '../utils/dataProcessing';
import { Spacing, BorderRadius } from '../utils/theme';

export function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { colors, mode, toggle } = useTheme();
  const {
    filteredData, filters, setFilters, resetFilters,
    dailyStats, topicStats, personStats, locationStats, companyStats,
    wordCloud, totalShows,
  } = useNewsDataContext();

  const [insightsVisible, setInsightsVisible] = useState(false);

  const hasActiveFilters =
    filters.dateRange !== null ||
    filters.selectedTopic !== null ||
    filters.topics.length > 0;

  const handleTopicSelect = (topic: string | null) => {
    setFilters({ ...filters, selectedTopic: topic });
  };

  const handleEntityPress = (type: 'persons' | 'locations' | 'companies', name: string) => {
    navigation.navigate('Entity', { type, name });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.primary }]}>PULSE</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>Аналитика новостей</Text>
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
                onPress={resetFilters}
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
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: colors.accent }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>ОХВАТ</Text>
            <Text style={[styles.statValue, { color: colors.accent }]}>{formatNumber(totalShows)}</Text>
          </View>
        </View>

        {/* Line chart */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Динамика публикаций</Text>
          <Text style={[styles.cardSub, { color: colors.textSecondary }]}>По дням</Text>
          <MetricLineChart data={dailyStats} />
        </View>

        {/* Donut chart */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Тематики</Text>
          <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
            {filters.selectedTopic ? 'Фильтр: ' + filters.selectedTopic : 'Распределение публикаций'}
          </Text>
          <DonutChart
            data={topicStats}
            onTopicSelect={handleTopicSelect}
            selectedTopic={filters.selectedTopic}
          />
        </View>

        {/* Word cloud */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Облако слов</Text>
          <Text style={[styles.cardSub, { color: colors.textSecondary }]}>Из заголовков новостей</Text>
          <WordCloud words={wordCloud} />
        </View>

        {/* Entity ranking */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Топ сущностей</Text>
          <Text style={[styles.cardSub, { color: colors.textSecondary }]}>По суммарному охвату · нажмите для перехода</Text>
          <EntityRanking
            persons={personStats}
            locations={locationStats}
            companies={companyStats}
            onEntityPress={handleEntityPress}
          />
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
  },
  headerTitle: { fontSize: 20, fontWeight: '900', letterSpacing: 4 },
  headerSub: { fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  iconBtnText: { fontSize: 16 },
  insightsBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.xl },
  insightsBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  scroll: { flex: 1 },
  content: { padding: Spacing.md, gap: Spacing.md },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap', marginTop: Spacing.xs },
  resetBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.xl, borderWidth: 1 },
  resetText: { fontSize: 12, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: { flex: 1, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderLeftWidth: 3 },
  statLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  statValue: { fontSize: 24, fontWeight: '700' },
  card: { borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, gap: 4 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  cardSub: { fontSize: 12, marginBottom: Spacing.sm },
});
