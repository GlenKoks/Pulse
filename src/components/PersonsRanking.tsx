import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PersonStats } from '../types';
import { Colors, Spacing, BorderRadius } from '../utils/theme';

interface PersonsRankingProps {
  data: PersonStats[];
  limit?: number;
}

export function PersonsRanking({ data, limit = 10 }: PersonsRankingProps) {
  const displayData = data.slice(0, limit);
  const maxCount = displayData[0]?.count || 1;

  if (!displayData.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Нет данных</Text>
      </View>
    );
  }

  const rankColors = [Colors.accentYellow, Colors.textSecondary, Colors.accentOrange];

  return (
    <View style={styles.container}>
      {displayData.map((person, index) => {
        const barWidth = (person.count / maxCount) * 100;
        const rankColor = index < 3 ? rankColors[index] : Colors.textMuted;
        return (
          <View key={person.name} style={styles.row}>
            <Text style={[styles.rank, { color: rankColor }]}>
              {String(index + 1).padStart(2, '0')}
            </Text>
            <View style={styles.info}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>
                  {person.name}
                </Text>
                <Text style={styles.count}>{person.count}</Text>
              </View>
              <View style={styles.barBg}>
                <View
                  style={[
                    styles.bar,
                    {
                      width: `${barWidth}%`,
                      backgroundColor: index < 3 ? rankColor : Colors.primary,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  rank: {
    fontSize: 12,
    fontWeight: '700',
    width: 24,
    textAlign: 'right',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  count: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  barBg: {
    height: 4,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 2,
    opacity: 0.8,
  },
  empty: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
});
