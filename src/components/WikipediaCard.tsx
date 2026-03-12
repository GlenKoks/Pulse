import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, Linking, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useTheme } from '../hooks/ThemeContext';
import { BorderRadius, Spacing } from '../utils/theme';

interface WikiSummary {
  title: string;
  extract: string;
  thumbnail?: string;
  pageUrl: string;
}

interface Props {
  name: string; // Имя персоны для поиска
}

// Нормализуем имя для Wikipedia URL: "Илон Маск" → "Илон_Маск"
function toWikiSlug(name: string): string {
  return encodeURIComponent(name.replace(/\s+/g, '_'));
}

async function fetchWikiSummary(name: string): Promise<WikiSummary | null> {
  const slug = toWikiSlug(name);
  const url = `https://ru.wikipedia.org/api/rest_v1/page/summary/${slug}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.type === 'disambiguation' || !data.extract) return null;
    return {
      title: data.title || name,
      extract: data.extract || '',
      thumbnail: data.thumbnail?.source,
      pageUrl: data.content_urls?.mobile?.page || `https://ru.wikipedia.org/wiki/${slug}`,
    };
  } catch {
    return null;
  }
}

export function WikipediaCard({ name }: Props) {
  const { colors } = useTheme();
  const [data, setData] = useState<WikiSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setLoading(true);
    setData(null);
    setExpanded(false);
    fetchWikiSummary(name).then(result => {
      setData(result);
      setLoading(false);
    });
  }, [name]);

  if (loading) {
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.header}>
          <Text style={[styles.wikiLabel, { color: colors.textMuted }]}>W</Text>
          <Text style={[styles.title, { color: colors.text }]}>Wikipedia</Text>
        </View>
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.header}>
          <Text style={[styles.wikiLabel, { color: colors.textMuted }]}>W</Text>
          <Text style={[styles.title, { color: colors.text }]}>Wikipedia</Text>
        </View>
        <Text style={[styles.notFound, { color: colors.textMuted }]}>
          Статья не найдена для «{name}»
        </Text>
      </View>
    );
  }

  const shortExtract = data.extract.length > 280
    ? data.extract.slice(0, 280).trim() + '...'
    : data.extract;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Заголовок */}
      <View style={styles.header}>
        <View style={[styles.wikiIcon, { backgroundColor: colors.surfaceLight }]}>
          <Text style={[styles.wikiLabel, { color: colors.text }]}>W</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>Wikipedia</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{data.title}</Text>
        </View>
      </View>

      {/* Контент */}
      <View style={styles.body}>
        {/* Фото */}
        {data.thumbnail ? (
          <Image
            source={{ uri: data.thumbnail }}
            style={[styles.photo, { borderColor: colors.border }]}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.photoPlaceholder, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
            <Text style={[styles.photoPlaceholderText, { color: colors.textMuted }]}>
              {name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        {/* Текст */}
        <View style={styles.textBlock}>
          <Text style={[styles.extract, { color: colors.textSecondary }]} numberOfLines={expanded ? undefined : 5}>
            {data.extract}
          </Text>
          {data.extract.length > 280 && (
            <TouchableOpacity onPress={() => setExpanded(!expanded)}>
              <Text style={[styles.expandBtn, { color: colors.primary }]}>
                {expanded ? 'Свернуть ↑' : 'Читать далее ↓'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Ссылка на Wikipedia */}
      <TouchableOpacity
        style={[styles.linkBtn, { borderColor: colors.border, backgroundColor: colors.surfaceLight }]}
        onPress={() => Linking.openURL(data.pageUrl)}
      >
        <Text style={[styles.linkText, { color: colors.primary }]}>
          Открыть статью в Wikipedia →
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  wikiIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wikiLabel: {
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  body: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  photo: {
    width: 80,
    height: 100,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    flexShrink: 0,
  },
  photoPlaceholder: {
    width: 80,
    height: 100,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  photoPlaceholderText: {
    fontSize: 32,
    fontWeight: '700',
  },
  textBlock: {
    flex: 1,
    gap: 6,
  },
  extract: {
    fontSize: 13,
    lineHeight: 19,
  },
  expandBtn: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  notFound: {
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  linkBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 4,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
