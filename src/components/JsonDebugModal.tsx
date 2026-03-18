import React, { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../hooks/ThemeContext';
import { Spacing, BorderRadius } from '../utils/theme';

interface JsonDebugModalProps {
  visible: boolean;
  onClose: () => void;
  jsonData: any;
}

export function JsonDebugModal({ visible, onClose, jsonData }: JsonDebugModalProps) {
  const { colors } = useTheme();
  const [copied, setCopied] = useState(false);

  const jsonString = JSON.stringify(jsonData, null, 2);

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(jsonString);
    } catch (_) {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal visible={visible} transparent={true as any} animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            JSON для API
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Данные, отправляемые на /insights
          </Text>
          
          <ScrollView 
            style={[styles.jsonContainer, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}
            showsVerticalScrollIndicator={true}
          >
            <Text style={[styles.jsonText, { color: colors.text }]}>
              {jsonString}
            </Text>
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.primary }]}
              onPress={handleCopy}
            >
              <Text style={styles.btnText}>{copied ? '✓ Скопировано' : 'Копировать JSON'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.border }]}
              onPress={onClose}
            >
              <Text style={[styles.btnText, { color: colors.text }]}>Закрыть</Text>
            </TouchableOpacity>
          </View>
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
    maxHeight: '90%',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  jsonContainer: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    maxHeight: 400,
  },
  jsonText: {
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 16,
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
