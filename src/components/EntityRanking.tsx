import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { EntityStats } from '../types';
import { useTheme } from '../hooks/ThemeContext';
import { formatNumber } from '../utils/dataProcessing';
import { Spacing, BorderRadius } from '../utils/theme';

interface EntityRankingProps {
  persons: EntityStats[];
  locations: EntityStats[];
  companies: EntityStats[];
  onEntityPress: (type: 'persons' | 'locations' | 'companies', name: string) => void;
}

type Tab = 'persons' | 'locations' | 'companies';

const TAB_LABELS: Record<Tab, string> = {
  persons: 'Персоны',
  locations: 'Локации',
  companies: 'Компании',
};

export function EntityRanking({ persons, locations, companies, onEntityPress }: EntityRankingProps) {
  const { colors } = useTheme();
  const [tab, setTab] = useState<Tab>('persons');

  const data: EntityStats[] = tab === 'persons' ? persons : tab === 'locations' ? locations : companies;
  const top10 = data.slice(0, 10);

  return (
    <View>
      {/* Tab switcher */}
      <View style={[styles.tabs, { backgroundColor: colors.surfaceLight }]}>
        {(Object.keys(TAB_LABELS) as Tab[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && { backgroundColor: colors.primary }]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, { color: tab === t ? '#fff' : colors.textSecondary }]}>
              {TAB_LABELS[t]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <View style={styles.list}>
        {top10.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textMuted }]}>Нет данных</Text>
        ) : (
          top10.map((item, index) => (
            <TouchableOpacity
              key={item.name}
              style={[styles.row, { borderBottomColor: colors.border }]}
              onPress={() => onEntityPress(tab, item.name)}
              activeOpacity={0.7}
            >
              <View style={[styles.rank, { backgroundColor: colors.primary + '22' }]}>
                <Text style={[styles.rankText, { color: colors.primary }]}>{index + 1}</Text>
              </View>
              <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.stats}>
                <Text style={[styles.shows, { color: colors.accent }]}>
                  {formatNumber(item.totalShows)}
                </Text>
                <Text style={[styles.count, { color: colors.textMuted }]}>
                  {item.count} публ.
                </Text>
              </View>
              <Text style={[styles.arrow, { color: colors.textMuted }]}>›</Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    borderRadius: BorderRadius.sm,
    padding: 3,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  list: {
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  rank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rankText: {
    fontSize: 11,
    fontWeight: '700',
  },
  name: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  stats: {
    alignItems: 'flex-end',
  },
  shows: {
    fontSize: 13,
    fontWeight: '600',
  },
  count: {
    fontSize: 10,
  },
  arrow: {
    fontSize: 18,
    marginLeft: 4,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: Spacing.lg,
    fontSize: 14,
  },
});
