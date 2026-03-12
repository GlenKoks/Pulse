import React, { useState } from 'react';
import { ActivityIndicator } from 'react-native';
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
import WorldMapCard from '../components/WorldMapCard';
import { formatNumber } from '../utils/dataProcessing';
import { Spacing, BorderRadius } from '../utils/theme';
import { usePdfExport } from '../hooks/usePdfExport';

export function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { colors, mode, toggle } = useTheme();
  const {
    filteredData, filters, setFilters, resetFilters,
    dailyStats, topicStats, personStats, locationStats, companyStats,
    wordCloud, totalShows, geoStats,
  } = useNewsDataContext();

  const [insightsVisible, setInsightsVisible] = useState(false);
  const { exportPdf, loading: pdfLoading } = usePdfExport();

  const handleExportPdf = () => {
    const topTopics = topicStats.slice(0, 5).map(t => ({ label: t.topic, value: `${t.count} публ.` }));
    const topPersons = personStats.slice(0, 5).map(p => ({ label: p.name, value: `${formatNumber(p.totalShows)} охват` }));
    const topLocations = locationStats.slice(0, 5).map(l => ({ label: l.name, value: `${formatNumber(l.totalShows)} охват` }));
    const topGeo = geoStats.slice(0, 5).map(g => ({ label: g.name, value: `${g.count} упом.` }));
    const periodLabel = filters.dateRange === 2 ? '2 дня' : filters.dateRange === 7 ? '7 дней' : filters.dateRange === 30 ? '30 дней' : 'Все время';
    exportPdf({
      title: 'Дашборд — Аналитика новостей',
      subtitle: `Период: ${periodLabel} · ${filteredData.length} публикаций · Охват: ${formatNumber(totalShows)}`,
      sections: [
        {
          heading: 'Ключевые показатели',
          rows: [
            { label: 'Публикации', value: String(filteredData.length) },
            { label: 'Суммарный охват', value: formatNumber(totalShows) },
            { label: 'Период', value: periodLabel },
            ...(filters.selectedTopic ? [{ label: 'Фильтр по тематике', value: filters.selectedTopic }] : []),
            ...(filters.selectedGeo ? [{ label: 'Фильтр по стране', value: filters.selectedGeo }] : []),
          ],
        },
        { heading: 'Топ тематик', rows: topTopics },
        { heading: 'Топ персон по охвату', rows: topPersons },
        { heading: 'Топ локаций по охвату', rows: topLocations },
        { heading: 'Топ стран по упоминаниям', rows: topGeo },
      ],
    });
  };

  const hasActiveFilters =
    filters.dateRange !== null ||
    filters.selectedTopic !== null ||
    filters.selectedGeo !== null ||
    filters.topics.length > 0;

  const handleTopicSelect = (topic: string | null) => {
    setFilters({ ...filters, selectedTopic: topic });
  };

  const handleGeoSelect = (code: string | null) => {
    setFilters({ ...filters, selectedGeo: code });
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
            style={[styles.pdfBtn, { backgroundColor: colors.accentOrange }]}
            onPress={handleExportPdf}
            disabled={pdfLoading}
          >
            {pdfLoading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.insightsBtnText}>📄 PDF</Text>
            }
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.insightsBtn, { backgroundColor: colors.primary }]}
            onPress={() => setInsightsVisible(true)}
          >
            <Text style={styles.insightsBtnText}>❆ Выводы</Text>
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
                <Text style={[styles.resetText, { color: colors.error }]}>Сбросить все</Text>
              </TouchableOpacity>
            )}
          </View>
          {/* Активный гео-фильтр */}
          {filters.selectedGeo && (
            <View style={[styles.geoFilterBadge, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '44' }]}>
              <Text style={[styles.geoFilterText, { color: colors.primary }]}>
                🌍 Фильтр по стране: {filters.selectedGeo.toUpperCase()}
              </Text>
              <TouchableOpacity onPress={() => handleGeoSelect(null)}>
                <Text style={[styles.geoFilterClose, { color: colors.primary }]}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
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

        {/* World Map */}
        <WorldMapCard
          geoStats={geoStats}
          selectedGeo={filters.selectedGeo}
          onSelectGeo={handleGeoSelect}
        />

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
  pdfBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.xl, minWidth: 64, alignItems: 'center' },
  insightsBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  scroll: { flex: 1 },
  content: { padding: Spacing.md, gap: Spacing.md },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap', marginTop: Spacing.xs },
  resetBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.xl, borderWidth: 1 },
  resetText: { fontSize: 12, fontWeight: '600' },
  geoFilterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  geoFilterText: { fontSize: 13, fontWeight: '600' },
  geoFilterClose: { fontSize: 16, fontWeight: '700', paddingLeft: 8 },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: { flex: 1, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderLeftWidth: 3 },
  statLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  statValue: { fontSize: 24, fontWeight: '700' },
  card: { borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, gap: 4 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  cardSub: { fontSize: 12, marginBottom: Spacing.sm },
});
