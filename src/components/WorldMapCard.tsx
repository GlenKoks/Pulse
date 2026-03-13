import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { GeoStats } from '../types';
import { useTheme } from '../hooks/ThemeContext';
import { formatNumber } from '../utils/dataProcessing';

interface Props {
  geoStats: GeoStats[];
  selectedGeo: string | null;
  onSelectGeo: (code: string | null) => void;
}

// Градации тепловой карты: 4 уровня интенсивности
const HEAT_LEVELS = [
  { color: '#6C63FF', label: 'Очень много' },  // топ 25%
  { color: '#9B94FF', label: 'Много' },          // 25–50%
  { color: '#C4C0FF', label: 'Средне' },         // 50–75%
  { color: '#E8E6FF', label: 'Мало' },           // нижние 25%
];

const HEAT_LEVELS_DARK = [
  { color: '#6C63FF', label: 'Очень много' },
  { color: '#8B82FF', label: 'Много' },
  { color: '#A89EFF', label: 'Средне' },
  { color: '#C4BEFF', label: 'Мало' },
];

function getHeatColor(count: number, maxCount: number, isDark: boolean): string {
  const levels = isDark ? HEAT_LEVELS_DARK : HEAT_LEVELS;
  if (maxCount === 0) return levels[3].color;
  const ratio = count / maxCount;
  if (ratio >= 0.75) return levels[0].color;
  if (ratio >= 0.50) return levels[1].color;
  if (ratio >= 0.25) return levels[2].color;
  return levels[3].color;
}

function getLevelIndex(count: number, maxCount: number): number {
  if (maxCount === 0) return 3;
  const ratio = count / maxCount;
  if (ratio >= 0.75) return 0;
  if (ratio >= 0.50) return 1;
  if (ratio >= 0.25) return 2;
  return 3;
}

export default function WorldMapCard({ geoStats, selectedGeo, onSelectGeo }: Props) {
  const { colors, isDark } = useTheme();
  const [showList, setShowList] = useState(false);

  const maxCount = useMemo(
    () => (geoStats.length > 0 ? geoStats[0].count : 1),
    [geoStats]
  );

  // Вместо визуальной карты мира используем сетку стран с тепловой подсветкой
  const topCountries = useMemo(() => {
    return geoStats.slice(0, 12);
  }, [geoStats]);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Заголовок */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>География упоминаний</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {geoStats.length} стран · нажмите для фильтра
          </Text>
        </View>
        {selectedGeo && (
          <TouchableOpacity
            style={[styles.resetBtn, { backgroundColor: colors.primary + '22', borderColor: colors.primary }]}
            onPress={() => onSelectGeo(null)}
          >
            <Text style={[styles.resetBtnText, { color: colors.primary }]}>✕ Сбросить</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Сетка стран вместо карты */}
      <View style={styles.gridContainer}>
        {topCountries.map((stat) => {
          const isSelected = selectedGeo === stat.code;
          const heatColor = getHeatColor(stat.count, maxCount, isDark);
          return (
            <TouchableOpacity
              key={stat.code}
              style={[
                styles.countryCard,
                {
                  backgroundColor: isSelected ? '#FF6B6B' + '22' : heatColor + '33',
                  borderColor: isSelected ? '#FF6B6B' : heatColor,
                  borderWidth: isSelected ? 2 : 1,
                },
              ]}
              onPress={() => onSelectGeo(isSelected ? null : stat.code)}
            >
              <Text style={[styles.countryCode, { color: isSelected ? '#FF6B6B' : heatColor }]}>
                {stat.code.toUpperCase()}
              </Text>
              <Text style={[styles.countryName, { color: colors.text }]}>
                {stat.name}
              </Text>
              <Text style={[styles.countryCount, { color: colors.textSecondary }]}>
                {stat.count} публ.
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Легенда градаций */}
      <View style={styles.legend}>
        {(isDark ? HEAT_LEVELS_DARK : HEAT_LEVELS).map((level, i) => (
          <View key={i} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: level.color }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>{level.label}</Text>
          </View>
        ))}
      </View>

      {/* Кнопка показа полного списка стран */}
      <TouchableOpacity
        style={[styles.toggleBtn, { borderColor: colors.border }]}
        onPress={() => setShowList(v => !v)}
      >
        <Text style={[styles.toggleBtnText, { color: colors.primary }]}>
          {showList ? '▲ Скрыть список' : '▼ Все страны по упоминаниям'}
        </Text>
      </TouchableOpacity>

      {/* Полный список стран с кликом для фильтра */}
      {showList && (
        <ScrollView style={styles.list} nestedScrollEnabled>
          {geoStats.map((stat, i) => {
            const isSelected = selectedGeo === stat.code;
            const heatColor = getHeatColor(stat.count, maxCount, isDark);
            return (
              <TouchableOpacity
                key={stat.code}
                style={[
                  styles.listItem,
                  {
                    backgroundColor: isSelected
                      ? '#FF6B6B' + '22'
                      : colors.background,
                    borderColor: isSelected ? '#FF6B6B' : colors.border,
                  },
                ]}
                onPress={() => onSelectGeo(isSelected ? null : stat.code)}
              >
                {/* Цветная полоска интенсивности */}
                <View style={[styles.heatBar, { backgroundColor: heatColor }]} />

                <Text style={[styles.listRank, { color: colors.textSecondary }]}>
                  {i + 1}
                </Text>
                <Text style={[styles.listName, { color: isSelected ? '#FF6B6B' : colors.text }]}>
                  {stat.name}
                </Text>
                <Text style={[styles.listCode, { color: colors.textSecondary }]}>
                  {stat.code.toUpperCase()}
                </Text>
                <View style={styles.listStats}>
                  <Text style={[styles.listCount, { color: isSelected ? '#FF6B6B' : colors.primary }]}>
                    {stat.count} публ.
                  </Text>
                  <Text style={[styles.listShows, { color: colors.textSecondary }]}>
                    {formatNumber(stat.totalShows)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  resetBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
    justifyContent: 'space-between',
  },
  countryCard: {
    width: '31%',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 1,
  },
  countryCode: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  countryName: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  countryCount: {
    fontSize: 10,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
  },
  toggleBtn: {
    borderTopWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    maxHeight: 400,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  heatBar: {
    width: 4,
    height: 28,
    borderRadius: 2,
  },
  listRank: {
    fontSize: 12,
    width: 20,
    textAlign: 'right',
  },
  listName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  listCode: {
    fontSize: 11,
    width: 28,
  },
  listStats: {
    alignItems: 'flex-end',
  },
  listCount: {
    fontSize: 13,
    fontWeight: '700',
  },
  listShows: {
    fontSize: 11,
  },
});
