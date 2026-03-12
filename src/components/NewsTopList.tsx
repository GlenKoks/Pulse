import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { NewsItem } from '../types';
import { useTheme } from '../hooks/ThemeContext';
import { formatNumber } from '../utils/dataProcessing';
import { Spacing, BorderRadius } from '../utils/theme';

interface NewsTopListProps {
  data: NewsItem[];
  limit?: number;
}

export function NewsTopList({ data, limit = 10 }: NewsTopListProps) {
  const { colors } = useTheme();
  const top = [...data]
    .sort((a, b) => (b.shows || 0) - (a.shows || 0))
    .slice(0, limit);

  if (!top.length) {
    return (
      <View style={styles.empty}>
        <Text style={{ color: colors.textMuted }}>Нет новостей</Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {top.map((item, index) => (
        <View
          key={item.ndx ?? index}
          style={[styles.row, { borderBottomColor: colors.border }]}
        >
          <View style={[styles.rank, { backgroundColor: colors.primary + '22' }]}>
            <Text style={[styles.rankText, { color: colors.primary }]}>{index + 1}</Text>
          </View>
          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
              {item.publication_title_name || 'Без заголовка'}
            </Text>
            <View style={styles.meta}>
              {item.publisher_name && (
                <Text style={[styles.publisher, { color: colors.textMuted }]}>
                  {item.publisher_name}
                </Text>
              )}
              {item.dt && (
                <Text style={[styles.date, { color: colors.textMuted }]}>
                  {item.dt.substring(0, 10)}
                </Text>
              )}
              <Text style={[styles.shows, { color: colors.accent }]}>
                👁 {formatNumber(item.shows || 0)}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {},
  row: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  rank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  rankText: {
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  publisher: {
    fontSize: 11,
  },
  date: {
    fontSize: 11,
  },
  shows: {
    fontSize: 11,
    fontWeight: '600',
  },
  empty: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
