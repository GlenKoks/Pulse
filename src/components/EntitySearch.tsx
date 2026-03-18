import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  SafeAreaView,
} from 'react-native';
import { EntityStats } from '../types';
import { useTheme } from '../hooks/ThemeContext';
import { Spacing, BorderRadius } from '../utils/theme';
import { formatNumber } from '../utils/dataProcessing';

interface EntitySearchProps {
  type: 'persons' | 'locations' | 'companies';
  data: EntityStats[];
  onSelect: (name: string) => void;
  placeholder?: string;
}

export function EntitySearch({ type, data, onSelect, placeholder }: EntitySearchProps) {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  const filteredResults = useMemo(() => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return data
      .filter(item => item.name.toLowerCase().includes(lowerQuery))
      .sort((a, b) => (b.totalShows || 0) - (a.totalShows || 0))
      .slice(0, 20);
  }, [query, data]);

  const handleSelect = (name: string) => {
    onSelect(name);
    setIsVisible(false);
    setQuery('');
  };

  const typeLabels: Record<string, string> = {
    persons: 'персону',
    locations: 'локацию',
    companies: 'компанию',
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.searchTrigger, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}
        onPress={() => setIsVisible(true)}
      >
        <Text style={[styles.triggerText, { color: colors.textSecondary }]}>
          🔍 {placeholder || `Найти ${typeLabels[type]}...`}
        </Text>
      </TouchableOpacity>

      <Modal visible={isVisible} animationType="fade" transparent={false}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setIsVisible(false)} style={styles.closeBtn}>
              <Text style={[styles.closeText, { color: colors.text }]}>‹ Назад</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Поиск: {type === 'persons' ? 'Персоны' : type === 'locations' ? 'Локации' : 'Компании'}
            </Text>
          </View>

          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.primary }]}
              placeholder={`Введите имя или название...`}
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
              autoFocus
              clearButtonMode="while-editing"
            />
          </View>

          <FlatList
            data={filteredResults}
            keyExtractor={item => item.name}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  {query.trim() ? 'Ничего не найдено' : 'Начните вводить название...'}
                </Text>
              </View>
            )}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.resultItem, { borderBottomColor: colors.border }]}
                onPress={() => handleSelect(item.name)}
              >
                <View style={styles.resultMain}>
                  <Text style={[styles.resultName, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.resultSub, { color: colors.textMuted }]}>
                    {item.count} публикаций
                  </Text>
                </View>
                <View style={styles.resultStats}>
                  <Text style={[styles.resultShows, { color: colors.accent }]}>
                    {formatNumber(item.totalShows)}
                  </Text>
                  <Text style={styles.arrow}>›</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.sm,
  },
  searchTrigger: {
    height: 40,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  triggerText: {
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  closeBtn: {
    paddingRight: Spacing.md,
  },
  closeText: {
    fontSize: 24,
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  inputWrapper: {
    padding: Spacing.md,
  },
  input: {
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  resultMain: {
    flex: 1,
  },
  resultName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  resultSub: {
    fontSize: 12,
  },
  resultStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultShows: {
    fontSize: 14,
    fontWeight: '600',
  },
  arrow: {
    fontSize: 18,
    color: '#ccc',
  },
  emptyState: {
    paddingTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
});
