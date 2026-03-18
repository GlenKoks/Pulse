import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../hooks/ThemeContext';
import { useNewsDataContext } from '../hooks/NewsDataContext';
import { Spacing, BorderRadius } from '../utils/theme';

interface InsightsModalProps {
  visible: boolean;
  onClose: () => void;
}

const API_URL = 'https://pulseai-gcx9.onrender.com/insights';

const STUB_TEXT =
  'Выводы о состоянии новостей\n\n' +
  'За анализируемый период зафиксирован стабильный рост публикационной активности. ' +
  'Доминирующими тематиками остаются Политика и Экономика. ' +
  'Наибольший охват демонстрируют материалы, связанные с технологическим сектором. ' +
  'Уровень негативных вердиктов находится в пределах нормы. ' +
  'Рекомендуется усилить мониторинг публикаций с признаками манипуляции.';

export function InsightsModal({ visible, onClose }: InsightsModalProps) {
  const { colors } = useTheme();
  const { filteredData, topicStats, personStats, locationStats, companyStats, badVerdictStats, wordCloud, totalShows, filters } = useNewsDataContext();
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const [insightsText, setInsightsText] = useState(STUB_TEXT);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setReady(false);
      setCopied(false);
      setError(null);
      setLoading(true);
      fetchInsights();
    }
  }, [visible]);

  const fetchInsights = async () => {
    try {
      // Prepare period string
      const periodStr = filters.dateRange ? `Last ${filters.dateRange} days` : 'All time';

      // Prepare analytics data for API
      const payload = {
        period: periodStr,
        total_publications: filteredData.length,
        total_reach: totalShows,
        top_topics: topicStats.slice(0, 5).map(t => t.topic),
        top_persons: personStats.slice(0, 5).map(p => p.name),
        top_locations: locationStats.slice(0, 5).map(l => l.name),
        top_companies: companyStats.slice(0, 5).map(c => c.name),
        negative_analysis: badVerdictStats.slice(0, 5).map(v => v.topic),
        word_cloud: wordCloud.slice(0, 20).map(w => w.text),
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Extract insights from response
      // The API returns an object with insights field
      const insights = data.insights || JSON.stringify(data);
      setInsightsText(typeof insights === 'string' ? insights : JSON.stringify(insights, null, 2));
      setReady(true);
    } catch (err) {
      console.error('Error fetching insights:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch insights');
      // Fallback to stub text on error
      setInsightsText(STUB_TEXT);
      setReady(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(insightsText);
    } catch (_) {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal visible={visible} transparent={true as any} animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Анализируем данные…
              </Text>
            </View>
          ) : (
            <>
              <Text style={[styles.title, { color: colors.text }]}>
                Выводы о состоянии новостей
              </Text>
              {error && (
                <Text style={[styles.body, { color: colors.error, marginBottom: Spacing.md }]}>
                  ⚠️ {error}
                </Text>
              )}
              <Text style={[styles.body, { color: colors.textSecondary }]}>
                {insightsText.split('\n\n').slice(1).join('\n\n')}
              </Text>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: colors.primary }]}
                  onPress={handleCopy}
                >
                  <Text style={styles.btnText}>{copied ? '✓ Скопировано' : 'Скопировать'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.border }]}
                  onPress={onClose}
                >
                  <Text style={[styles.btnText, { color: colors.text }]}>Закрыть</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
