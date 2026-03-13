import { supabase } from './supabase';
import type { NewsItemFromSupabase } from '../types/supabase';

/**
 * Получить все публикации за последние N дней с метриками и связанными сущностями
 */
export async function fetchPublicationsWithMetrics(daysBack: number = 30): Promise<NewsItemFromSupabase[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);
  const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

  // Получаем публикации с метриками и издателем одним запросом
  const { data: publications, error: pubError } = await supabase
    .from('publications')
    .select(`
      id,
      url,
      title,
      published_at,
      publisher:publishers(name),
      metrics:publication_metrics(shows, likes, comments)
    `)
    .gte('published_at', cutoffDateStr)
    .order('published_at', { ascending: false })
    .limit(500); // Ограничим для стабильности

  if (pubError) {
    console.error('Error fetching publications:', pubError);
    throw pubError;
  }

  if (!publications || publications.length === 0) {
    return [];
  }

  const pubIds = publications.map((p: any) => p.id);

  // Получаем связанные сущности для каждой публикации
  const { data: pubPersons, error: personsError } = await supabase
    .from('publication_persons')
    .select('publication_id, person:persons(name)')
    .in('publication_id', pubIds);

  const { data: pubOrgs, error: orgsError } = await supabase
    .from('publication_organizations')
    .select('publication_id, organization:organizations(name)')
    .in('publication_id', pubIds);

  const { data: pubLocs, error: locsError } = await supabase
    .from('publication_locations')
    .select('publication_id, location:locations(name)')
    .in('publication_id', pubIds);

  const { data: pubCountries, error: countriesError } = await supabase
    .from('publication_countries')
    .select('publication_id, country:countries(name)')
    .in('publication_id', pubIds);

  const { data: pubTopics, error: topicsError } = await supabase
    .from('publication_topics')
    .select('publication_id, topic:topics(name)')
    .in('publication_id', pubIds);

  const { data: pubVerdicts, error: verdictsError } = await supabase
    .from('publication_bad_verdicts')
    .select('publication_id, verdict:bad_verdicts(name)')
    .in('publication_id', pubIds);

  if (personsError || orgsError || locsError || countriesError || topicsError || verdictsError) {
    console.error('Error fetching relations:', {
      personsError,
      orgsError,
      locsError,
      countriesError,
      topicsError,
      verdictsError,
    });
  }

  // Создаем карты для быстрого доступа
  const personsMap = new Map<string, string[]>();
  const orgsMap = new Map<string, string[]>();
  const locsMap = new Map<string, string[]>();
  const countriesMap = new Map<string, string[]>();
  const topicsMap = new Map<string, string[]>();
  const verdictsMap = new Map<string, string[]>();

  pubPersons?.forEach((item: any) => {
    const pubId = item.publication_id;
    if (!personsMap.has(pubId)) personsMap.set(pubId, []);
    if (item.person?.name) personsMap.get(pubId)!.push(item.person.name);
  });

  pubOrgs?.forEach((item: any) => {
    const pubId = item.publication_id;
    if (!orgsMap.has(pubId)) orgsMap.set(pubId, []);
    if (item.organization?.name) orgsMap.get(pubId)!.push(item.organization.name);
  });

  pubLocs?.forEach((item: any) => {
    const pubId = item.publication_id;
    if (!locsMap.has(pubId)) locsMap.set(pubId, []);
    if (item.location?.name) locsMap.get(pubId)!.push(item.location.name);
  });

  pubCountries?.forEach((item: any) => {
    const pubId = item.publication_id;
    if (!countriesMap.has(pubId)) countriesMap.set(pubId, []);
    if (item.country?.name) countriesMap.get(pubId)!.push(item.country.name);
  });

  pubTopics?.forEach((item: any) => {
    const pubId = item.publication_id;
    if (!topicsMap.has(pubId)) topicsMap.set(pubId, []);
    if (item.topic?.name) topicsMap.get(pubId)!.push(item.topic.name);
  });

  pubVerdicts?.forEach((item: any) => {
    const pubId = item.publication_id;
    if (!verdictsMap.has(pubId)) verdictsMap.set(pubId, []);
    if (item.verdict?.name) verdictsMap.get(pubId)!.push(item.verdict.name);
  });

  // Трансформируем в формат приложения
  const result: NewsItemFromSupabase[] = publications.map((pub: any) => {
    const m = (pub.metrics && pub.metrics[0]) || { shows: 0, likes: 0, comments: 0 };
    return {
      id: pub.id,
      pub_url: pub.url,
      publication_title_name: pub.title,
      publisher_name: pub.publisher?.name || 'Unknown',
      dt: pub.published_at,
      shows: m.shows || 0,
      likes: m.likes || 0,
      comments: m.comments || 0,
      persons: personsMap.get(pub.id) || [],
      organizations: orgsMap.get(pub.id) || [],
      locations: locsMap.get(pub.id) || [],
      countries: countriesMap.get(pub.id) || [],
      topics_verdicts_list: topicsMap.get(pub.id) || [],
      bad_verdicts_list: verdictsMap.get(pub.id) || [],
    };
  });

  return result;
}

/**
 * Получить уникальные значения для фильтров
 */
export async function fetchFilterOptions() {
  const { data: persons } = await supabase.from('persons').select('name').order('name');
  const { data: orgs } = await supabase.from('organizations').select('name').order('name');
  const { data: locations } = await supabase.from('locations').select('name').order('name');
  const { data: topics } = await supabase.from('topics').select('name').order('name');
  const { data: verdicts } = await supabase.from('bad_verdicts').select('name').order('name');

  return {
    persons: persons?.map((p: any) => p.name) || [],
    organizations: orgs?.map((o: any) => o.name) || [],
    locations: locations?.map((l: any) => l.name) || [],
    topics: topics?.map((t: any) => t.name) || [],
    verdicts: verdicts?.map((v: any) => v.name) || [],
  };
}
