import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WordFrequency } from '../types';
import { useTheme } from '../hooks/ThemeContext';
import { Spacing } from '../utils/theme';

interface WordCloudProps {
  words: WordFrequency[];
}

export function WordCloud({ words }: WordCloudProps) {
  const { colors } = useTheme();

  const displayWords = useMemo(() => {
    if (!words.length) return [];
    const maxVal = words[0]?.value || 1;
    const minVal = words[words.length - 1]?.value || 1;
    const range = maxVal - minVal || 1;
    return words.slice(0, 60).map((w, i) => {
      const normalized = (w.value - minVal) / range;
      const fontSize = Math.round(10 + normalized * 22);
      const opacity = 0.55 + normalized * 0.45;
      const colorIndex = i % colors.chartColors.length;
      return { ...w, fontSize, opacity, color: colors.chartColors[colorIndex] };
    });
  }, [words, colors]);

  if (!displayWords.length) {
    return (
      <View style={styles.empty}>
        <Text style={{ color: colors.textMuted }}>Нет данных</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cloud}>
        {displayWords.map((word, index) => (
          <View key={`${word.text}-${index}`} style={styles.wordWrapper}>
            <Text
              style={[
                styles.word,
                { fontSize: word.fontSize, color: word.color, opacity: word.opacity },
              ]}
            >
              {word.text}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { minHeight: 180 },
  cloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  wordWrapper: { paddingHorizontal: 4, paddingVertical: 2 },
  word: { fontWeight: '600' },
  empty: { height: 120, justifyContent: 'center', alignItems: 'center' },
});
