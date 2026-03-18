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
  // Опциональные пропсы для передачи контекста сущности
  entityType?: 'persons' | 'locations' | 'companies';
  entityName?: string;
  // Опциональные пропсы для передачи отфильтрованных данных (если не из контекста)
  overrideData?: {
    filteredData: any[];
    totalShows: number;
    dailyStats?: any[];
    wordCloud?: any[];
    negativeRadarData?: any;
    filters?: any;
  };
}

const API_URL = 'https://pulseai-gcx9.onrender.com/insights';

const STUB_TEXT =
  'Выводы о состоянии новостей\n\n' +
  'За анализируемый период зафиксирован стабильный рост публикационной активности. ' +
  'Доминирующими тематиками остаются Политика и Экономика. ' +
  'Наибольший охват демонстрируют материалы, связанные с технологическим сектором. ' +
  'Уровень негативных вердиктов находится в пределах нормы. ' +
  'Рекомендуется усилить мониторинг публикаций с признаками манипуляции.';

export function InsightsModal({ 
  visible, 
  onClose, 
  entityType, 
  entityName,
  overrideData 
}: InsightsModalProps) {
  const { colors } = useTheme();
  const contextData = useNewsDataContext();
  
  // Используем либо переданные данные (для экрана сущности), либо данные из глобального контекста
  const data = overrideData || contextData;
  const { filteredData, totalShows, wordCloud } = data;
  
  // Для глобального контекста у нас есть готовые агрегаты, для overrideData (Entity) нужно брать из пропсов
  const topicStats = (data as any).topicStats || [];
  const personStats = (data as any).personStats || [];
  const locationStats = (data as any).locationStats || [];
  const companyStats = (data as any).companyStats || [];
  const badVerdictStats = (data as any).badVerdictStats || (overrideData?.negativeRadarData ? 
    overrideData.negativeRadarData.labels.map((l: string, i: number) => ({ topic: l, count: overrideData.negativeRadarData.counts[i] })) : []);
  const filters = data.filters || {};

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
  }, [visible, entityName, filters.dateRange]);

  const fetchInsights = async () => {
    try {
      // Prepare period string
      const periodStr = filters.dateRange ? `Last ${filters.dateRange} days` : 'All time';

      // Prepare analytics data for API
      const payload: any = {
        period: periodStr,
        total_publications: filteredData.length,
        total_reach: totalShows,
        word_cloud: wordCloud?.slice(0, 20).map((w: any) => w.text) || [],
      };

      if (entityName) {
        // Режим сущности
        payload.entity = {
          name: entityName,
          type: entityType
        };
        payload.negative_analysis = badVerdictStats.map((v: any) => ({ topic: v.topic, count: v.count }));
        payload.top_news = filteredData
          .sort((a, b) => (b.shows || 0) - (a.shows || 0))
          .slice(0, 5)
          .map(item => ({
            title: item.publication_title_name,
            publisher: item.publisher_name,
            shows: item.shows
          }));
      } else {
        // Режим дашборда
        payload.top_topics = topicStats.slice(0, 5).map((t: any) => t.topic);
        payload.top_persons = personStats.slice(0, 5).map((p: any) => p.name);
        payload.top_locations = locationStats.slice(0, 5).map((l: any) => l.name);
        payload.top_companies = companyStats.slice(0, 5).map((c: any) => c.name);
        payload.negative_analysis = badVerdictStats.slice(0, 5).map((v: any) => v.topic);
      }

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
