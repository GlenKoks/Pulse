import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../hooks/ThemeContext';
import { Spacing, BorderRadius } from '../utils/theme';

interface InsightsModalProps {
  visible: boolean;
  onClose: () => void;
}

const STUB_TEXT =
  'Выводы о состоянии новостей\n\n' +
  'За анализируемый период зафиксирован стабильный рост публикационной активности. ' +
  'Доминирующими тематиками остаются Политика и Экономика. ' +
  'Наибольший охват демонстрируют материалы, связанные с технологическим сектором. ' +
  'Уровень негативных вердиктов находится в пределах нормы. ' +
  'Рекомендуется усилить мониторинг публикаций с признаками манипуляции.';

export function InsightsModal({ visible, onClose }: InsightsModalProps) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (visible) {
      setReady(false);
      setCopied(false);
      setLoading(true);
      const delay = 1500 + Math.random() * 500;
      const t = setTimeout(() => {
        setLoading(false);
        setReady(true);
      }, delay);
      return () => clearTimeout(t);
    }
  }, [visible]);

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(STUB_TEXT);
    } catch (_) {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
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
              <Text style={[styles.body, { color: colors.textSecondary }]}>
                {STUB_TEXT.split('\n\n').slice(1).join('\n\n')}
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
