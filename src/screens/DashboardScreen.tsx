import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNewsDataContext } from '../hooks/NewsDataContext';
import { LoadingScreen } from '../components/LoadingScreen';
import { StatCard } from '../components/StatCard';
import { SectionHeader } from '../components/SectionHeader';
import { DailyChart } from '../components/DailyChart';
import { PieChartView } from '../components/PieChartView';
import { PersonsRanking } from '../components/PersonsRanking';
import { PublishersChart } from '../components/PublishersChart';
import { BadVerdictsChart } from '../components/BadVerdictsChart';
import { WordCloud } from '../components/WordCloud';
import { FilterPanel } from '../components/FilterPanel';
import { Colors, Spacing, BorderRadius } from '../utils/theme';
import { formatNumber, parseList } from '../utils/dataProcessing';

export function DashboardScreen() {
  const {
    allData,
    filteredData,
    loading,
    error,
    progress,
    filters,
    setFilters,
    refetch,
    dailyStats,
    topicStats,
    personStats,
    publisherStats,
    badVerdictStats,
    wordCloud,
    totalShows,
    totalLikes,
    totalComments,
  } = useNewsDataContext();

  const availableTopics = useMemo(() => {
    const set = new Set<string>();
    allData.forEach(item => parseList(item.topics_verdicts_list).forEach(t => set.add(t)));
    return Array.from(set).sort();
  }, [allData]);

  const availablePublishers = useMemo(() => {
    const set = new Set<string>();
    allData.forEach(item => { if (item.publisher_name) set.add(item.publisher_name); });
    return Array.from(set).sort();
  }, [allData]);

  const availablePersons = useMemo(() => {
    const set = new Set<string>();
    allData.forEach(item => parseList(item.persons).forEach(p => { if (p.length > 2) set.add(p); }));
    return Array.from(set).sort();
  }, [allData]);

  if (loading) {
    return <LoadingScreen progress={progress} message="Загружаем новости..." />;
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Ошибка загрузки</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
          <Text style={styles.retryText}>Повторить</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isFiltered = filters.topics.length + filters.publishers.length + filters.persons.length > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>PULSE</Text>
          <Text style={styles.headerSub}>News Analytics Dashboard</Text>
        </View>
        <View style={styles.headerRight}>
          {isFiltered && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>Фильтр активен</Text>
            </View>
          )}
          <Text style={styles.totalCount}>{formatNumber(filteredData.length)} новостей</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refetch}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Filters */}
        <View style={styles.card}>
          <SectionHeader title="Фильтры" accent={Colors.accent} />
          <FilterPanel
            filters={filters}
            onFiltersChange={setFilters}
            availableTopics={availableTopics}
            availablePublishers={availablePublishers}
            availablePersons={availablePersons}
          />
        </View>

        {/* Summary stats */}
        <View style={styles.statsRow}>
          <StatCard label="Публикации" value={formatNumber(filteredData.length)} color={Colors.primary} />
          <StatCard label="Охват" value={formatNumber(totalShows)} color={Colors.accent} />
        </View>
        <View style={styles.statsRow}>
          <StatCard label="Лайки" value={formatNumber(totalLikes)} color={Colors.accentYellow} />
          <StatCard label="Комментарии" value={formatNumber(totalComments)} color={Colors.accentPink} />
        </View>

        {/* Daily chart */}
        <View style={styles.card}>
          <SectionHeader
            title="Публикации по дням"
            subtitle="Динамика публикаций и охвата"
            accent={Colors.primary}
          />
          <DailyChart data={dailyStats} />
        </View>

        {/* Topics pie chart */}
        <View style={styles.card}>
          <SectionHeader
            title="Тематики публикаций"
            subtitle="Распределение по темам"
            accent={Colors.accent}
          />
          <PieChartView data={topicStats} />
        </View>

        {/* Top persons */}
        <View style={styles.card}>
          <SectionHeader
            title="Топ персон"
            subtitle="По количеству упоминаний"
            accent={Colors.accentYellow}
          />
          <PersonsRanking data={personStats} limit={15} />
        </View>

        {/* Publishers */}
        <View style={styles.card}>
          <SectionHeader
            title="Топ изданий"
            subtitle="По публикациям и охвату"
            accent={Colors.accentOrange}
          />
          <PublishersChart data={publisherStats} limit={10} />
        </View>

        {/* Bad verdicts */}
        <View style={styles.card}>
          <SectionHeader
            title="Нарушения при модерации"
            subtitle="Выявленные негативные вердикты"
            accent={Colors.error}
          />
          <BadVerdictsChart data={badVerdictStats} />
        </View>

        {/* Word cloud */}
        <View style={styles.card}>
          <SectionHeader
            title="Облако слов"
            subtitle="Из заголовков публикаций"
            accent={Colors.accentBlue}
          />
          <WordCloud words={wordCloud} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Данные: {allData.length} записей · Pulse Analytics
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: 4,
  },
  headerSub: {
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerRight: { alignItems: 'flex-end', gap: 4 },
  filterBadge: {
    backgroundColor: Colors.primary + '33',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  filterBadgeText: { fontSize: 10, color: Colors.primary, fontWeight: '600' },
  totalCount: { fontSize: 12, color: Colors.textSecondary },
  scroll: { flex: 1 },
  content: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xl },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  errorTitle: { fontSize: 20, fontWeight: '700', color: Colors.error },
  errorText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryText: { color: Colors.text, fontWeight: '600', fontSize: 16 },
  footer: { alignItems: 'center', paddingTop: Spacing.md },
  footerText: { fontSize: 11, color: Colors.textMuted },
});
