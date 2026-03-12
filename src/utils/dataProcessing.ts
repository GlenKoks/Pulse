import { NewsItem, DailyStats, TopicStats, PersonStats, PublisherStats, WordFrequency, Filters, EntityStats } from '../types';

export function parseList(value: string | null): string[] {
  if (!value || value === '[]' || value === 'None' || value === 'null') return [];
  // Comma-separated (mock data format)
  if (!value.startsWith('[')) {
    return value.split(',').map(s => s.trim()).filter(Boolean);
  }
  try {
    const cleaned = value.replace(/'/g, '"').replace(/None/g, 'null');
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === 'string' && item.length > 0);
    }
  } catch {
    const matches = value.match(/'([^']+)'/g);
    if (matches) return matches.map(m => m.replace(/'/g, '').trim()).filter(Boolean);
  }
  return [];
}

export function applyFilters(data: NewsItem[], filters: Filters): NewsItem[] {
  return data.filter(item => {
    if (filters.dateRange !== null) {
      if (!item.dt) return false;
      const itemDate = new Date(item.dt);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - filters.dateRange);
      cutoff.setHours(0, 0, 0, 0);
      if (itemDate < cutoff) return false;
    }
    if (filters.selectedTopic) {
      const itemTopics = parseList(item.topics_verdicts_list);
      if (!itemTopics.includes(filters.selectedTopic)) return false;
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

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
}
