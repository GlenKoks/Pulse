import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/ThemeContext';

export function WorldMapFallback() {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
      <Text style={[styles.icon, { color: colors.primary }]}>🌍</Text>
      <Text style={[styles.text, { color: colors.textSecondary }]}>
        Интерактивная карта доступна в веб-версии.{"\n"}Используйте список стран ниже для фильтрации.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 200,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  icon: {
    fontSize: 32,
    marginBottom: 12,
  },
  text: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
