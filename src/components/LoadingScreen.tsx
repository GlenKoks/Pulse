import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Spacing } from '../utils/theme';

interface LoadingScreenProps {
  progress?: number;
  message?: string;
}

export function LoadingScreen({ progress = 0, message = 'Загрузка данных...' }: LoadingScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>PULSE</Text>
        <Text style={styles.subtitle}>News Analytics</Text>

        <ActivityIndicator size="large" color={Colors.primary} style={styles.spinner} />

        <Text style={styles.message}>{message}</Text>

        {progress > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBg}>
              <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{progress}%</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  logo: {
    fontSize: 42,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  spinner: {
    marginTop: Spacing.xl,
  },
  message: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  progressContainer: {
    width: 200,
    gap: 6,
    alignItems: 'center',
  },
  progressBg: {
    width: '100%',
    height: 4,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
