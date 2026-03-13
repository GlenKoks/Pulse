import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { WorldMap } from 'react-native-simple-worldmap';
import { GeoStats } from '../types';
import { useTheme } from '../hooks/ThemeContext';
import { formatNumber } from '../utils/dataProcessing';

interface Props {
  geoStats: GeoStats[];
  selectedGeo: string | null;
  onSelectGeo: (code: string | null) => void;
}

// Градации тепловой карты: 4 уровня интенсивности
// Цвет базируется на основном акцентном цвете (#6C63FF → светлее)
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

  // Группируем страны по уровням интенсивности для WorldMap
  const heatGroups = useMemo(() => {
    const groups: { countries: string[]; color: string }[] = [
      { countries: [], color: (isDark ? HEAT_LEVELS_DARK : HEAT_LEVELS)[0].color },
      { countries: [], color: (isDark ? HEAT_LEVELS_DARK : HEAT_LEVELS)[1].color },
      { countries: [], color: (isDark ? HEAT_LEVELS_DARK : HEAT_LEVELS)[2].color },
      { countries: [], color: (isDark ? HEAT_LEVELS_DARK : HEAT_LEVELS)[3].color },
    ];
    for (const stat of geoStats) {
      const level = getLevelIndex(stat.count, maxCount);
      groups[level].countries.push(stat.code);
    }
    return groups;
  }, [geoStats, maxCount, isDark]);

  // Цвет базовой карты (не упомянутые страны)
  const baseMapColor = isDark ? '#2A2A3E' : '#D8D8E8';
  const selectedCountryColor = '#FF6B6B';

  // Для выбранной страны — красная подсветка поверх тепловой
  // WorldMap принимает UPPERCASE коды (RU, US, CN...)
  const selectedCountries = selectedGeo ? [selectedGeo.toUpperCase()] : [];

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

      {/* Карта — несколько слоёв WorldMap для тепловой подсветки */}
      <View style={styles.mapContainer}>
        {/* Базовая карта (все страны серым) */}
        <View style={StyleSheet.absoluteFill}>
          <WorldMap
            color={baseMapColor}
            isSelectable={false}
          />
        </View>

        {/* Тепловые слои: от самого бледного к насыщенному */}
        {[...heatGroups].reverse().map((group, idx) =>
          group.countries.length > 0 ? (
            <View key={idx} style={StyleSheet.absoluteFill} pointerEvents="none">
              <WorldMap
                color="transparent"
                countries={group.countries}
                selectedColor={group.color}
                isSelectable={false}
              />
            </View>
          ) : null
        )}

        {/* Слой выбранной страны (красный) */}
        {selectedCountries.length > 0 && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <WorldMap
              color="transparent"
              countries={selectedCountries}
              selectedColor={selectedCountryColor}
              isSelectable={false}
            />
          </View>
        )}

        {/* Интерактивный прозрачный слой для кликов */}
        <View style={StyleSheet.absoluteFill}>
          <WorldMap
            color="transparent"
            isSelectable={true}
            selectedColor="transparent"
          />
        </View>
      </View>

      {/* Легенда градаций */}
      <View style={styles.legend}>
        {(isDark ? HEAT_LEVELS_DARK : HEAT_LEVELS).map((level, i) => (
          <View key={i} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: level.color }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>{level.label}</Text>
          </View>
        ))}
        {selectedGeo && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: selectedCountryColor }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Выбрано</Text>
          </View>
        )}
      </View>

      {/* Кнопка показа списка стран */}
      <TouchableOpacity
        style={[styles.toggleBtn, { borderColor: colors.border }]}
        onPress={() => setShowList(v => !v)}
      >
        <Text style={[styles.toggleBtnText, { color: colors.primary }]}>
          {showList ? '▲ Скрыть список' : '▼ Топ стран по упоминаниям'}
        </Text>
      </TouchableOpacity>

      {/* Список стран с кликом для фильтра */}
      {showList && (
        <ScrollView style={styles.list} nestedScrollEnabled>
          {geoStats.slice(0, 15).map((stat, i) => {
            const isSelected = selectedGeo === stat.code;
            const heatColor = getHeatColor(stat.count, maxCount, isDark);
            return (
              <TouchableOpacity
                key={stat.code}
                style={[
                  styles.listItem,
                  {
                    backgroundColor: isSelected
                      ? selectedCountryColor + '22'
                      : colors.background,
                    borderColor: isSelected ? selectedCountryColor : colors.border,
                  },
                ]}
                onPress={() => onSelectGeo(isSelected ? null : stat.code)}
              >
                {/* Цветная полоска интенсивности */}
                <View style={[styles.heatBar, { backgroundColor: heatColor }]} />

                <Text style={[styles.listRank, { color: colors.textSecondary }]}>
                  {i + 1}
                </Text>
                <Text style={[styles.listName, { color: isSelected ? selectedCountryColor : colors.text }]}>
                  {stat.name}
                </Text>
                <Text style={[styles.listCode, { color: colors.textSecondary }]}>
                  {stat.code.toUpperCase()}
                </Text>
                <View style={styles.listStats}>
                  <Text style={[styles.listCount, { color: isSelected ? selectedCountryColor : colors.primary }]}>
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
  mapContainer: {
    width: '100%',
    aspectRatio: 2.0,
    position: 'relative',
    paddingHorizontal: 8,
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
    maxHeight: 280,
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
