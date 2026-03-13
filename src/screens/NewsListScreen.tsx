import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNewsDataContext } from '../hooks/NewsDataContext';
import { LoadingScreen } from '../components/LoadingScreen';
import { NewsItem } from '../types';
import { Colors, Spacing, BorderRadius } from '../utils/theme';
import { formatNumber, parseList } from '../utils/dataProcessing';

export function NewsListScreen() {
  const { filteredData, loading } = useNewsDataContext();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'shows' | 'dt' | 'likes'>('shows');

  const displayData = useMemo(() => {
    let data = filteredData;
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        item =>
          item.publication_title_name?.toLowerCase().includes(q) ||
          item.publisher_name?.toLowerCase().includes(q)
      );
    }
    return [...data].sort((a, b) => {
      if (sortBy === 'shows') return (b.shows || 0) - (a.shows || 0);
      if (sortBy === 'likes') return parseInt(b.likes || '0') - parseInt(a.likes || '0');
      if (sortBy === 'dt') return (b.dt || '').localeCompare(a.dt || '');
      return 0;
    });
  }, [filteredData, search, sortBy]);

  if (loading) return <LoadingScreen />;

  const renderItem = ({ item }: { item: NewsItem }) => {
    const topics = parseList(item.topics_verdicts_list);
    const badVerdicts = parseList(item.bad_verdicts_list);

    return (
      <TouchableOpacity
        style={styles.newsCard}
        onPress={() => item.pub_url && Linking.openURL(item.pub_url)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.publisher} numberOfLines={1}>
            {item.publisher_name || 'Неизвестное издание'}
          </Text>
          <Text style={styles.date}>{item.dt || ''}</Text>
        </View>

        <Text style={styles.title} numberOfLines={3}>
          {item.publication_title_name || 'Без заголовка'}
        </Text>

        {topics.length > 0 && (
          <View style={styles.tagsRow}>
            {topics.slice(0, 3).map(t => (
              <View key={t} style={styles.topicTag}>
                <Text style={styles.topicText}>{t}</Text>
              </View>
            ))}
          </View>
        )}

        {badVerdicts.length > 0 && (
          <View style={styles.tagsRow}>
            {badVerdicts.slice(0, 2).map(v => (
              <View key={v} style={styles.verdictTag}>
                <Text style={styles.verdictText}>⚠ {v}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.metrics}>
          <Text style={styles.metric}>👁 {formatNumber(item.shows || 0)}</Text>
          <Text style={styles.metric}>❤ {item.likes || '0'}</Text>
          <Text style={styles.metric}>💬 {item.comments || '0'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Новости</Text>
        <Text style={styles.headerCount}>{formatNumber(displayData.length)}</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск по заголовку или изданию..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>Сортировка:</Text>
        {(['shows', 'dt', 'likes'] as const).map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.sortBtn, sortBy === s && styles.sortBtnActive]}
            onPress={() => setSortBy(s)}
          >
            <Text style={[styles.sortText, sortBy === s && styles.sortTextActive]}>
              {s === 'shows' ? 'Охват' : s === 'dt' ? 'Дата' : 'Лайки'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={displayData}
        keyExtractor={item => item.pub_url}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        initialNumToRender={15}
        maxToRenderPerBatch={20}
        windowSize={5}
      />
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
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  headerCount: { fontSize: 14, color: Colors.textSecondary },
  searchContainer: { padding: Spacing.md, paddingBottom: Spacing.sm },
  searchInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    color: Colors.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: 8,
  },
  sortLabel: { fontSize: 12, color: Colors.textMuted },
  sortBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortBtnActive: { backgroundColor: Colors.primary + '33', borderColor: Colors.primary },
  sortText: { fontSize: 12, color: Colors.textSecondary },
  sortTextActive: { color: Colors.primary, fontWeight: '600' },
  list: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.xl },
  newsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  publisher: { fontSize: 11, color: Colors.primary, fontWeight: '600', flex: 1, marginRight: 8 },
  date: { fontSize: 11, color: Colors.textMuted },
  title: { fontSize: 14, color: Colors.text, fontWeight: '500', lineHeight: 20 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  topicTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primary + '22',
    borderWidth: 1,
    borderColor: Colors.primary + '44',
  },
  topicText: { fontSize: 10, color: Colors.primaryLight },
  verdictTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.error + '22',
    borderWidth: 1,
    borderColor: Colors.error + '44',
  },
  verdictText: { fontSize: 10, color: Colors.error },
  metrics: { flexDirection: 'row', gap: Spacing.md },
  metric: { fontSize: 12, color: Colors.textSecondary },
});
