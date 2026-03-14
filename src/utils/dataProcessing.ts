import { NewsItem, DailyStats, TopicStats, PersonStats, PublisherStats, WordFrequency, Filters, EntityStats, GeoStats } from '../types';
import { GEO_CODE_TO_NAME } from '../data/mockData';

export function parseList(value: string | null): string[] {
  if (!value || value === '[]' || value === 'None' || value === 'null') return [];
  
  // Если это уже похоже на JSON массив (начинается с [)
  if (value.trim().startsWith('[')) {
    try {
      // Supabase может возвращать массивы в формате JSON.
      // Сначала пробуем стандартный JSON.parse
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map(String).filter(s => s.length > 0);
      }
    } catch {
      // Если не вышло, пробуем очистить от одинарных кавычек (часто в Python/SQL логах)
      try {
        const cleaned = value.replace(/'/g, '"').replace(/None/g, 'null');
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed)) {
          return parsed.map(String).filter(s => s.length > 0);
        }
      } catch {
        // Последний шанс - регулярка для извлечения строк в кавычках
        const matches = value.match(/'([^']+)'/g);
        if (matches) return matches.map(m => m.replace(/'/g, '').trim()).filter(Boolean);
      }
    }
  }

  // Если это строка через запятую (наш текущий формат из transformSupabaseToNewsItem)
  return value.split(',').map(s => s.trim()).filter(Boolean);
}

export function applyFilters(data: NewsItem[], filters: Filters): NewsItem[] {
  return data.filter(item => {
    if (filters.dateRange !== null) {
      if (!item.dt) return false;
      // Парсим дату из строки YYYY-MM-DD
      // Получаем дату публикации в формате YYYY-MM-DD
      const itemDateStr = item.dt.substring(0, 10);
      
      // Вычисляем дату отсечения (cutoff) в формате YYYY-MM-DD
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - filters.dateRange);
      const cutoffDateStr = cutoffDate.toISOString().substring(0, 10);
      
      // Сравниваем даты как строки YYYY-MM-DD
      if (itemDateStr < cutoffDateStr) return false;
    }
    if (filters.selectedTopic) {
      const itemTopics = parseList(item.topics_verdicts_list);
      if (!itemTopics.includes(filters.selectedTopic)) return false;
    }
    if (filters.selectedGeo) {
      const itemGeo = parseList(item.geo);
      if (!itemGeo.includes(filters.selectedGeo)) return false;
    }
    if (filters.topics.length > 0) {
      const itemTopics = parseList(item.topics_verdicts_list);
      if (!filters.topics.some(t => itemTopics.includes(t))) return false;
    }
    if (filters.publishers.length > 0) {
      if (!item.publisher_name || !filters.publishers.includes(item.publisher_name)) return false;
    }
    if (filters.persons.length > 0) {
      const itemPersons = parseList(item.persons);
      if (!filters.persons.some(p => itemPersons.includes(p))) return false;
    }
    return true;
  });
}

export function filterByEntity(
  data: NewsItem[],
  entityType: 'persons' | 'locations' | 'companies',
  entityName: string
): NewsItem[] {
  return data.filter(item => {
    let field: string | null = null;
    if (entityType === 'persons') field = item.persons;
    else if (entityType === 'locations') field = item.locations;
    else if (entityType === 'companies') field = item.organizations;
    return parseList(field).includes(entityName);
  });
}

export function getDailyStats(data: NewsItem[]): DailyStats[] {
  const map = new Map<string, { count: number; totalShows: number }>();
  for (const item of data) {
    if (!item.dt) continue;
    const date = item.dt.substring(0, 10);
    const existing = map.get(date) || { count: 0, totalShows: 0 };
    map.set(date, { count: existing.count + 1, totalShows: existing.totalShows + (item.shows || 0) });
  }
  return Array.from(map.entries())
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getTopicStats(data: NewsItem[]): TopicStats[] {
  const map = new Map<string, { count: number; totalShows: number }>();
  for (const item of data) {
    for (const topic of parseList(item.topics_verdicts_list)) {
      const e = map.get(topic) || { count: 0, totalShows: 0 };
      map.set(topic, { count: e.count + 1, totalShows: e.totalShows + (item.shows || 0) });
    }
  }
  return Array.from(map.entries())
    .map(([topic, stats]) => ({ topic, ...stats }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
}

export function getPersonStats(data: NewsItem[]): PersonStats[] {
  const map = new Map<string, { count: number; totalShows: number }>();
  for (const item of data) {
    for (const person of parseList(item.persons)) {
      const n = person.trim();
      if (n.length < 2) continue;
      const e = map.get(n) || { count: 0, totalShows: 0 };
      map.set(n, { count: e.count + 1, totalShows: e.totalShows + (item.shows || 0) });
    }
  }
  return Array.from(map.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.totalShows - a.totalShows)
    .slice(0, 20);
}

export function getLocationStats(data: NewsItem[]): EntityStats[] {
  const map = new Map<string, { count: number; totalShows: number }>();
  for (const item of data) {
    for (const loc of parseList(item.locations)) {
      const n = loc.trim();
      if (n.length < 2) continue;
      const e = map.get(n) || { count: 0, totalShows: 0 };
      map.set(n, { count: e.count + 1, totalShows: e.totalShows + (item.shows || 0) });
    }
  }
  return Array.from(map.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.totalShows - a.totalShows)
    .slice(0, 20);
}

export function getCompanyStats(data: NewsItem[]): EntityStats[] {
  const map = new Map<string, { count: number; totalShows: number }>();
  for (const item of data) {
    for (const company of parseList(item.organizations)) {
      const n = company.trim();
      if (n.length < 2) continue;
      const e = map.get(n) || { count: 0, totalShows: 0 };
      map.set(n, { count: e.count + 1, totalShows: e.totalShows + (item.shows || 0) });
    }
  }
  return Array.from(map.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.totalShows - a.totalShows)
    .slice(0, 20);
}

export function getPublisherStats(data: NewsItem[]): PublisherStats[] {
  const map = new Map<string, { count: number; totalShows: number }>();
  for (const item of data) {
    if (!item.publisher_name) continue;
    const e = map.get(item.publisher_name) || { count: 0, totalShows: 0 };
    map.set(item.publisher_name, { count: e.count + 1, totalShows: e.totalShows + (item.shows || 0) });
  }
  return Array.from(map.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
}

export function getBadVerdictStats(data: NewsItem[]): TopicStats[] {
  const map = new Map<string, { count: number; totalShows: number }>();
  for (const item of data) {
    for (const verdict of parseList(item.bad_verdicts_list)) {
      const e = map.get(verdict) || { count: 0, totalShows: 0 };
      map.set(verdict, { count: e.count + 1, totalShows: e.totalShows + (item.shows || 0) });
    }
  }
  return Array.from(map.entries())
    .map(([topic, stats]) => ({ topic, ...stats }))
    .sort((a, b) => b.count - a.count);
}

export function getWordCloud(data: NewsItem[]): WordFrequency[] {
  const stopWords = new Set([
    'в', 'на', 'и', 'с', 'по', 'за', 'из', 'от', 'до', 'для', 'к', 'о', 'об',
    'при', 'под', 'над', 'как', 'что', 'это', 'не', 'но', 'а', 'или', 'то',
    'же', 'бы', 'ли', 'уже', 'ещё', 'еще', 'так', 'вот', 'все', 'всё', 'он',
    'она', 'они', 'мы', 'вы', 'я', 'его', 'её', 'их', 'нас', 'вас', 'им',
    'ему', 'ей', 'был', 'была', 'были', 'будет', 'есть', 'нет', 'да',
    'со', 'во', 'без', 'через', 'между', 'после', 'перед',
    'которые', 'который', 'которая', 'которое', 'когда', 'если', 'чтобы',
    'потому', 'поэтому', 'однако', 'также', 'только', 'очень', 'более', 'менее',
    'свой', 'своя', 'свои', 'своё', 'этот', 'эта', 'эти', 'того', 'тому',
    'тем', 'том', 'той', 'ту', 'те', 'тех', 'теми',
    'новый', 'новые', 'новая', 'новое', 'рассказал', 'заявил', 'объявил',
    'представил', 'сообщил', 'стал', 'стала', 'стали',
  ]);
  const wordMap = new Map<string, number>();
  for (const item of data) {
    if (!item.publication_title_name) continue;
    const words = item.publication_title_name
      .toLowerCase()
      .replace(/[«»""„"''\-—–:;,\.!\?()[\]{}<>\/\\|@#$%^&*+=~`]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopWords.has(w) && !/^\d+$/.test(w));
    for (const word of words) {
      wordMap.set(word, (wordMap.get(word) || 0) + 1);
    }
  }
  return Array.from(wordMap.entries())
    .map(([text, value]) => ({ text, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 80);
}

export function getNegativeTopicRadarData(
  data: NewsItem[],
  negativeTopics: readonly string[] = ['Желтуха', 'Насилие', 'Трагическое', 'Политика', 'Конфликт']
): { labels: string[]; values: number[]; counts: number[]; total: number } {
  const countMap: Record<string, number> = {};
  for (const topic of negativeTopics) countMap[topic] = 0;
  const total = data.length;
  
  for (const item of data) {
    if (!item.bad_verdicts_list) continue;
    // Используем parseList для корректного парсинга bad_verdicts_list
    const verdicts = parseList(item.bad_verdicts_list);
    for (const verdict of verdicts) {
      const v = verdict.trim();
      if (v in countMap) countMap[v]++;
    }
  }
  
  // Значения в процентах (0–100) от общего числа публикаций сущности
  const absoluteCounts = negativeTopics.map(t => countMap[t] || 0);
  const percentValues = absoluteCounts.map(c =>
    total > 0 ? Math.round((c / total) * 100) : 0
  );
  
  console.log('DEBUG RadarChart Data:', { countMap, absoluteCounts, percentValues, total, dataLength: data.length });
  
  return {
    labels: [...negativeTopics],
    values: percentValues,   // проценты для RadarChart (0–100)
    counts: absoluteCounts,  // абсолютные числа для легенды
    total,
  };
}

export function getGeoStats(data: NewsItem[]): GeoStats[] {
  const map = new Map<string, { count: number; totalShows: number }>();
  for (const item of data) {
    for (const code of parseList(item.geo)) {
      const c = code.trim().toUpperCase();
      if (!c) continue;
      const e = map.get(c) || { count: 0, totalShows: 0 };
      map.set(c, { count: e.count + 1, totalShows: e.totalShows + (item.shows || 0) });
    }
  }
  return Array.from(map.entries())
    .map(([code, stats]) => ({
      code,
      name: GEO_CODE_TO_NAME[code] || code.toUpperCase(),
      ...stats,
    }))
    .sort((a, b) => b.count - a.count);
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
}
