import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { NewsItem } from '../types';
import { useTheme } from '../hooks/ThemeContext';
import { formatNumber } from '../utils/dataProcessing';
import { Spacing, BorderRadius } from '../utils/theme';

interface NewsTopListProps {
  data: NewsItem[];
  limit?: number;
}

const RADAR_VERDICTS = ['Желтуха', 'Насилие', 'Трагическое', 'Политика', 'Конфликт'];
const verdictIcons: Record<string, string> = {
  'Желтуха': '📰',
  'Насилие': '⚠️',
  'Трагическое': '😭',
  'Политика': '📝',
  'Конфликт': '⚔️',
};

export function NewsTopList({ data, limit = 10 }: NewsTopListProps) {
  const { colors } = useTheme();
  const [selectedVerdict, setSelectedVerdict] = useState<string | null>(null);

  const parseVerdicts = (verdictStr: string | null): string[] => {
    if (!verdictStr) return [];
    return verdictStr.split(',').map(v => v.trim()).filter(Boolean);
  };

  const filteredData = useMemo(() => {
    let result = [...data];
    if (selectedVerdict) {
      result = result.filter(item => {
        const itemVerdicts = parseVerdicts(item.bad_verdicts_list);
        return itemVerdicts.includes(selectedVerdict);
      });
    }
    return result.sort((a, b) => (b.shows || 0) - (a.shows || 0)).slice(0, limit);
  }, [data, selectedVerdict, limit]);

  const handleTitlePress = (url: string) => {
    if (url) {
      Linking.openURL(url).catch(err => console.log('Ошибка открытия ссылки:', err));
    }
  };

  const toggleVerdict = (verdict: string) => {
    setSelectedVerdict(prev => prev === verdict ? null : verdict);
  };

  if (!data.length) {
    return (
      <View style={styles.empty}>
        <Text style={{ color: colors.textMuted }}>Нет новостей</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Фильтры по негативным вердиктам */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {RADAR_VERDICTS.map(v => (
            <TouchableOpacity
              key={v}
              onPress={() => toggleVerdict(v)}
              style={[
                styles.filterChip,
                { 
                  backgroundColor: selectedVerdict === v ? '#FFD93D' + '44' : colors.surfaceLight,
                  borderColor: selectedVerdict === v ? '#FFD93D' : colors.border
                }
              ]}
            >
              <Text style={[styles.filterIcon]}>{verdictIcons[v]}</Text>
              <Text style={[
                styles.filterText, 
                { color: selectedVerdict === v ? '#FFD93D' : colors.textSecondary }
              ]}>
                {v}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.list}>
        {filteredData.length > 0 ? (
          filteredData.map((item, index) => (
            <View
              key={item.ndx ?? index}
              style={[styles.row, { borderBottomColor: colors.border }]}
            >
              <View style={[styles.rank, { backgroundColor: colors.primary + '22' }]}>
                <Text style={[styles.rankText, { color: colors.primary }]}>{index + 1}</Text>
              </View>
              <View style={styles.content}>
                <TouchableOpacity
                  onPress={() => handleTitlePress(item.pub_url)}
                  disabled={!item.pub_url}
                  style={styles.titleContainer}
                >
                  <Text
                    style={[
                      styles.title,
                      {
                        color: colors.text,
                      },
                    ]}
                    numberOfLines={2}
                  >
                    {item.publication_title_name || 'Без заголовка'}
                  </Text>
                </TouchableOpacity>
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
                </View>
                {/* Негативные вердикты (уменьшенные) */}
                {item.bad_verdicts_list && parseVerdicts(item.bad_verdicts_list).filter(v => RADAR_VERDICTS.includes(v)).length > 0 && (
                  <View style={styles.verdicts}>
                    {parseVerdicts(item.bad_verdicts_list)
                      .filter(v => RADAR_VERDICTS.includes(v))
                      .map((verdict, idx) => (
                        <View key={idx} style={[styles.verdictBadge, { backgroundColor: '#FFD93D' + '15', borderColor: '#FFD93D' + '33' }]}>
                          <Text style={styles.verdictIcon}>{verdictIcons[verdict] || '💢'}</Text>
                          <Text style={[styles.verdictText, { color: '#FFD93D' }]}>{verdict}</Text>
                        </View>
                      ))}
                  </View>
                )}
                <View style={styles.metrics}>
                  <Text style={[styles.metric, { color: colors.accent }]}>
                    👁 {formatNumber(item.shows || 0)}
                  </Text>
                  <Text style={[styles.metric, { color: colors.accent }]}>
                    ❤️ {formatNumber(parseInt(item.likes || '0', 10))}
                  </Text>
                  <Text style={[styles.metric, { color: colors.accent }]}>
                    💬 {formatNumber(parseInt(item.comments || '0', 10))}
                  </Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.empty}>
            <Text style={{ color: colors.textMuted }}>Нет новостей с таким вердиктом</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  filterRow: {
    marginBottom: 4,
  },
  filterScroll: {
    gap: 8,
    paddingRight: Spacing.md,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: 4,
  },
  filterIcon: {
    fontSize: 12,
  },
  filterText: {
    fontSize: 11,
    fontWeight: '600',
  },
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
  titleContainer: {
    paddingRight: 8,
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
    marginBottom: 2,
  },
  verdicts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 4,
  },
  verdictBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  verdictIcon: {
    fontSize: 10,
  },
  verdictText: {
    fontSize: 9,
    fontWeight: '600',
  },
  metrics: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  metric: {
    fontSize: 11,
    fontWeight: '600',
  },
  publisher: {
    fontSize: 11,
  },
  date: {
    fontSize: 11,
  },
  empty: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
