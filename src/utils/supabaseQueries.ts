import { supabase } from './supabase';
import type { NewsItemFromSupabase } from '../types/supabase';

/**
 * Получить все публикации за последние N дней с метриками и связанными сущностями
 * Используем надежный метод с отдельными запросами для стабильности в браузере
 */
export async function fetchPublicationsWithMetrics(daysBack: number = 30): Promise<NewsItemFromSupabase[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);
  const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

  console.log('--- FETCHING FROM SUPABASE ---');

  // 1. Получаем публикации
  const { data: publications, error: pubError } = await supabase
    .from('publications')
    .select(`
      id,
      url,
      title,
      published_at,
      publisher:publishers(name)
    `)
    .gte('published_at', cutoffDateStr)
    .order('published_at', { ascending: false });

  if (pubError) throw pubError;
  if (!publications || publications.length === 0) return [];

  const pubIds = publications.map((p: any) => p.id);

  // 2. Получаем метрики (отдельно)
  const { data: metrics, error: metricsError } = await supabase
    .from('publication_metrics')
    .select('publication_id, shows, likes, comments')
    .in('publication_id', pubIds);

  const metricsMap = new Map(metrics?.map((m: any) => [m.publication_id, m]) || []);

  // 3. Получаем связанные сущности (отдельно для каждой таблицы)
  // Мы используем плоский селект, чтобы избежать проблем с именованием джойнов в браузере
  const fetchRelation = async (table: string, entityTable: string) => {
    const { data, error } = await supabase
      .from(table)
      .select(`publication_id, ${entityTable}(name)`)
      .in('publication_id', pubIds);
    if (error) console.error(`Error fetching ${table}:`, error);
    return data || [];
  };

  const [relPersons, relOrgs, relLocs, relCountries, relTopics, relVerdicts] = await Promise.all([
    fetchRelation('publication_persons', 'persons'),
    fetchRelation('publication_organizations', 'organizations'),
    fetchRelation('publication_locations', 'locations'),
    fetchRelation('publication_countries', 'countries'),
    fetchRelation('publication_topics', 'topics'),
    fetchRelation('publication_bad_verdicts', 'bad_verdicts')
  ]);

  // 4. Группируем связи по publication_id
  const groupByPubId = (relations: any[], entityKey: string) => {
    const map = new Map<string, string[]>();
    relations.forEach(item => {
      const pubId = item.publication_id;
      const name = item[entityKey]?.name;
      if (name) {
        if (!map.has(pubId)) map.set(pubId, []);
        map.get(pubId)!.push(name);
      }
    });
    return map;
  };

  const personsMap = groupByPubId(relPersons, 'persons');
  const orgsMap = groupByPubId(relOrgs, 'organizations');
  const locsMap = groupByPubId(relLocs, 'locations');
  const countriesMap = groupByPubId(relCountries, 'countries');
  const topicsMap = groupByPubId(relTopics, 'topics');
  const verdictsMap = groupByPubId(relVerdicts, 'bad_verdicts');

  // Маппинг ISO-3 в ISO-2 для карты
  const iso3to2: Record<string, string> = {
    'AFG': 'AF', 'ALB': 'AL', 'DZA': 'DZ', 'AND': 'AD', 'AGO': 'AO', 'ARG': 'AR', 'ARM': 'AM', 'AUS': 'AU', 'AUT': 'AT', 'AZE': 'AZ',
    'BHS': 'BS', 'BHR': 'BH', 'BGD': 'BD', 'BRB': 'BB', 'BLR': 'BY', 'BEL': 'BE', 'BLZ': 'BZ', 'BEN': 'BJ', 'BTN': 'BT', 'BOL': 'BO',
    'BIH': 'BA', 'BWA': 'BW', 'BRA': 'BR', 'BRN': 'BN', 'BGR': 'BG', 'BFA': 'BF', 'BDI': 'BI', 'CPV': 'CV', 'KHM': 'KH', 'CMR': 'CM',
    'CAN': 'CA', 'CAF': 'CF', 'TCD': 'TD', 'CHL': 'CL', 'CHN': 'CN', 'COL': 'CO', 'COM': 'KM', 'COG': 'CG', 'COD': 'CD', 'CRI': 'CR',
    'CIV': 'CI', 'HRV': 'HR', 'CUB': 'CU', 'CYP': 'CY', 'CZE': 'CZ', 'DNK': 'DK', 'DJI': 'DJ', 'DMA': 'DM', 'DOM': 'DO', 'ECU': 'EC',
    'EGY': 'EG', 'SLV': 'SV', 'GNQ': 'GQ', 'ERI': 'ER', 'EST': 'EE', 'SWZ': 'SZ', 'ETH': 'ET', 'FJI': 'FJ', 'FIN': 'FI', 'FRA': 'FR',
    'GAB': 'GA', 'GMB': 'GM', 'GEO': 'GE', 'DEU': 'DE', 'GHA': 'GH', 'GRC': 'GR', 'GRD': 'GD', 'GTM': 'GT', 'GIN': 'GN', 'GNB': 'GW',
    'GUY': 'GY', 'HTI': 'HT', 'HND': 'HN', 'HUN': 'HU', 'ISL': 'IS', 'IND': 'IN', 'IDN': 'ID', 'IRN': 'IR', 'IRQ': 'IQ', 'IRL': 'IE',
    'ISR': 'IL', 'ITA': 'IT', 'JAM': 'JM', 'JPN': 'JP', 'JOR': 'JO', 'KAZ': 'KZ', 'KEN': 'KE', 'KIR': 'KI', 'PRK': 'KP', 'KOR': 'KR',
    'KWT': 'KW', 'KGZ': 'KG', 'LAO': 'LA', 'LVA': 'LV', 'LBN': 'LB', 'LSO': 'LS', 'LBR': 'LR', 'LBY': 'LY', 'LIE': 'LI', 'LTU': 'LT',
    'LUX': 'LU', 'MDG': 'MG', 'MWI': 'MW', 'MYS': 'MY', 'MDV': 'MV', 'MLI': 'ML', 'MLT': 'MT', 'MHL': 'MH', 'MRT': 'MR', 'MUS': 'MU',
    'MEX': 'MX', 'FSM': 'FM', 'MDA': 'MD', 'MCO': 'MC', 'MNG': 'MN', 'MNE': 'ME', 'MAR': 'MA', 'MOZ': 'MZ', 'MMR': 'MM', 'NAM': 'NA',
    'NRU': 'NR', 'NPL': 'NP', 'NLD': 'NL', 'NZL': 'NZ', 'NIC': 'NI', 'NER': 'NE', 'NGA': 'NG', 'NOR': 'NO', 'OMN': 'OM', 'PAK': 'PK',
    'PLW': 'PW', 'PAN': 'PA', 'PNG': 'PG', 'PRY': 'PY', 'PER': 'PE', 'PHL': 'PH', 'POL': 'PL', 'PRT': 'PT', 'QAT': 'QA', 'ROU': 'RO',
    'RUS': 'RU', 'RWA': 'RW', 'KNA': 'KN', 'LCA': 'LC', 'VCG': 'VC', 'WSM': 'WS', 'SMR': 'SM', 'STP': 'ST', 'SAU': 'SA', 'SEN': 'SN',
    'SRB': 'RS', 'SYC': 'SC', 'SLE': 'SL', 'SGP': 'SG', 'SVK': 'SK', 'SVN': 'SI', 'SLB': 'SB', 'SOM': 'SO', 'ZAF': 'ZA', 'SSD': 'SS',
    'ESP': 'ES', 'LKA': 'LK', 'SDN': 'SD', 'SUR': 'SR', 'SWE': 'SE', 'CHE': 'CH', 'SYR': 'SY', 'TJK': 'TJ', 'TZA': 'TZ', 'THA': 'TH',
    'TLS': 'TL', 'TGO': 'TG', 'TON': 'TO', 'TTO': 'TT', 'TUN': 'TN', 'TUR': 'TR', 'TKM': 'TM', 'TUV': 'TV', 'UGA': 'UG', 'UKR': 'UA',
    'ARE': 'AE', 'GBR': 'GB', 'USA': 'US', 'URY': 'UY', 'UZB': 'UZ', 'VUT': 'VU', 'VEN': 'VE', 'VNM': 'VN', 'YEM': 'YE', 'ZMB': 'ZM',
    'ZWE': 'ZW'
  };

  // 5. Финальная сборка данных
  return publications.map((pub: any) => {
    const m = metricsMap.get(pub.id) || { shows: 0, likes: 0, comments: 0 };
    const rawCountries = countriesMap.get(pub.id) || [];
    const iso2Countries = rawCountries.map(c => iso3to2[c] || c);

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
      countries: iso2Countries,
      topics_verdicts_list: topicsMap.get(pub.id) || [],
      bad_verdicts_list: verdictsMap.get(pub.id) || [],
    };
  });
}

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
