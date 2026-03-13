import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { Filters } from '../types';
import { Colors, Spacing, BorderRadius } from '../utils/theme';

interface FilterPanelProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  availableTopics: string[];
  availablePublishers: string[];
  availablePersons: string[];
}

type FilterType = 'topics' | 'publishers' | 'persons';

const FILTER_LABELS: Record<FilterType, string> = {
  topics: 'Тематики',
  publishers: 'Издания',
  persons: 'Персоны',
};

export function FilterPanel({
  filters,
  onFiltersChange,
  availableTopics,
  availablePublishers,
  availablePersons,
}: FilterPanelProps) {
  const [modalType, setModalType] = useState<FilterType | null>(null);
  const [search, setSearch] = useState('');

  const totalActive =
    filters.topics.length + filters.publishers.length + filters.persons.length;

  const getOptions = (type: FilterType): string[] => {
    switch (type) {
      case 'topics': return availableTopics;
      case 'publishers': return availablePublishers;
      case 'persons': return availablePersons;
    }
  };

  const getSelected = (type: FilterType): string[] => filters[type];

  const toggleItem = (type: FilterType, item: string) => {
    const current = filters[type];
    const updated = current.includes(item)
      ? current.filter(i => i !== item)
      : [...current, item];
    onFiltersChange({ ...filters, [type]: updated });
  };

  const clearAll = () => {
    onFiltersChange({ topics: [], publishers: [], persons: [], dateRange: null, selectedTopic: null, selectedGeo: null });
  };

  const filteredOptions = (type: FilterType) =>
    getOptions(type).filter(o => o.toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
        {/* Clear button */}
        {totalActive > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={clearAll}>
            <Text style={styles.clearText}>✕ Сбросить ({totalActive})</Text>
          </TouchableOpacity>
        )}

        {(['topics', 'publishers', 'persons'] as FilterType[]).map(type => {
          const count = filters[type].length;
          return (
            <TouchableOpacity
              key={type}
              style={[styles.filterBtn, count > 0 && styles.filterBtnActive]}
              onPress={() => { setSearch(''); setModalType(type); }}
            >
              <Text style={[styles.filterText, count > 0 && styles.filterTextActive]}>
                {FILTER_LABELS[type]}
                {count > 0 ? ` (${count})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Active filter chips */}
      {totalActive > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
          {(['topics', 'publishers', 'persons'] as FilterType[]).flatMap(type =>
            filters[type].map(item => (
              <TouchableOpacity
                key={`${type}-${item}`}
                style={styles.chip}
                onPress={() => toggleItem(type, item)}
              >
                <Text style={styles.chipText} numberOfLines={1}>{item}</Text>
                <Text style={styles.chipRemove}>✕</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {/* Modal for filter selection */}
      <Modal
        visible={modalType !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setModalType(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalType ? FILTER_LABELS[modalType] : ''}
              </Text>
              <TouchableOpacity onPress={() => setModalType(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Поиск..."
              placeholderTextColor={Colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />

            <ScrollView style={styles.optionsList}>
              {modalType && filteredOptions(modalType).map(option => {
                const isSelected = getSelected(modalType).includes(option);
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.option, isSelected && styles.optionSelected]}
                    onPress={() => toggleItem(modalType, option)}
                  >
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() => setModalType(null)}
            >
              <Text style={styles.applyText}>Применить</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  scroll: {
    flexGrow: 0,
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.error + '22',
    borderWidth: 1,
    borderColor: Colors.error + '66',
    marginRight: 8,
  },
  clearText: {
    fontSize: 12,
    color: Colors.error,
    fontWeight: '600',
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  filterBtnActive: {
    backgroundColor: Colors.primary + '22',
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  chipsScroll: {
    flexGrow: 0,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primary + '33',
    borderWidth: 1,
    borderColor: Colors.primary + '66',
    marginRight: 6,
  },
  chipText: {
    fontSize: 11,
    color: Colors.primaryLight,
    maxWidth: 120,
  },
  chipRemove: {
    fontSize: 10,
    color: Colors.primaryLight,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  modalClose: {
    fontSize: 18,
    color: Colors.textSecondary,
    padding: 4,
  },
  searchInput: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    color: Colors.text,
    fontSize: 14,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionsList: {
    maxHeight: 350,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  optionSelected: {
    backgroundColor: Colors.primary + '11',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '700',
  },
  optionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  optionTextSelected: {
    color: Colors.text,
    fontWeight: '500',
  },
  applyBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  applyText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
});
