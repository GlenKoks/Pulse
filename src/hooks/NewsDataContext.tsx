import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { NewsItem, Filters } from '../types';
import {
  getDailyStats,
  getTopicStats,
  getPersonStats,
  getLocationStats,
  getCompanyStats,
  getPublisherStats,
  getBadVerdictStats,
  getWordCloud,
  getGeoStats,
  applyFilters,
} from '../utils/dataProcessing';
import { fetchAllNewsFromSupabase } from '../utils/supabaseQueries';

const DEFAULT_FILTERS: Filters = {
  topics: [],
  publishers: [],
  persons: [],
  dateRange: null,
  selectedTopic: null,
  selectedGeo: null,
  selectedPerson: null,
  selectedLocation: null,
  selectedCompany: null,
};

interface NewsDataContextType {
  allData: NewsItem[];
  filteredData: NewsItem[];
  loading: boolean;
  error: string | null;
  filters: Filters;
  setFilters: (f: Filters) => void;
  resetFilters: () => void;
  dailyStats: ReturnType<typeof getDailyStats>;
  topicStats: ReturnType<typeof getTopicStats>;
  personStats: ReturnType<typeof getPersonStats>;
  locationStats: ReturnType<typeof getLocationStats>;
  companyStats: ReturnType<typeof getCompanyStats>;
  publisherStats: ReturnType<typeof getPublisherStats>;
  badVerdictStats: ReturnType<typeof getBadVerdictStats>;
  wordCloud: ReturnType<typeof getWordCloud>;
  geoStats: ReturnType<typeof getGeoStats>;
  totalShows: number;
  totalLikes: number;
  totalComments: number;
}

const NewsDataContext = createContext<NewsDataContextType | null>(null);

/**
 * Трансформирует данные из новой таблицы total_data в формат NewsItem
 */
function transformTotalDataToNewsItem(item: any): NewsItem {
  // Собираем список негативных вердиктов из колонок bad_*
  const badVerdicts: string[] = [];
  if (item['bad_18+']) badVerdicts.push('18+');
  if (item['bad_Желтуха']) badVerdicts.push('Желтуха');
  if (item['bad_Конфликт']) badVerdicts.push('Конфликт');
  if (item['bad_Мат']) badVerdicts.push('Мат');
  if (item['bad_Мигранты']) badVerdicts.push('Мигранты');
  if (item['bad_Насилие']) badVerdicts.push('Насилие');
  if (item['bad_Политика']) badVerdicts.push('Политика');
  if (item['bad_Спам']) badVerdicts.push('Спам');
  if (item['bad_Трагическое']) badVerdicts.push('Трагическое');
  if (item['bad_Хейтспич']) badVerdicts.push('Хейтспич');

  return {
    bad_verdicts_list: badVerdicts.length > 0 ? badVerdicts.join(', ') : null,
    comments: String(item.comments || '0'),
    dt: item.dt || new Date().toISOString().split('T')[0],
    likes: String(item.likes || '0'),
    ndx: item.ndx || null,
    pub_url: item.pub_url || '',
    publication_title_name: item.publication_title_name || 'Без заголовка',
    publisher_name: item.publisher_name || 'Неизвестный источник',
    shows: Number(item.shows) || 0,
    topics_verdicts_list: item.topics_verdicts_list || null,
    persons: item.persons || null,
    organizations: item.organizations || null,
    locations: item.locations || null,
    country: item.country || null,
    geo: item.country_iso2 || null, // Используем iso2 для карты
  };
}

export function NewsDataProvider({ children }: { children: React.ReactNode }) {
  const [allData, setAllData] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Попытка загрузить из кэша (только для веба)
        const CACHE_KEY = 'pulse_news_cache';
        const CACHE_TIME_KEY = 'pulse_news_cache_time';
        const CACHE_TTL = 1000 * 60 * 30; // 30 минут

        try {
          const cached = localStorage.getItem(CACHE_KEY);
          const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
          
          if (cached && cachedTime) {
            const isExpired = Date.now() - parseInt(cachedTime, 10) > CACHE_TTL;
            if (!isExpired) {
              const parsed = JSON.parse(cached);
              if (Array.isArray(parsed) && parsed.length > 0) {
                console.log(`DEBUG: Loaded ${parsed.length} items from cache`);
                setAllData(parsed);
                setLoading(false);
                // Продолжаем загрузку в фоне для обновления данных
              }
            }
          }
        } catch (e) {
          console.warn('Cache load failed', e);
        }
        
        const rawData = await fetchAllNewsFromSupabase();
        
        if (!rawData || rawData.length === 0) {
          if (allData.length === 0) {
            setError('Supabase вернул пустой массив данных. Проверьте таблицу total_data.');
          }
          return;
        }
        
        const transformedData = rawData.map(transformTotalDataToNewsItem);
        
        // Сохранение в кэш
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(transformedData));
          localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
        } catch (e) {
          console.warn('Cache save failed', e);
        }
        
        setAllData(transformedData);
      } catch (err) {
        console.error('Supabase Fetch Error:', err);
        const errorMsg = err instanceof Error ? err.message : JSON.stringify(err);
        setError(`Ошибка загрузки данных: ${errorMsg}`);
        setAllData([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredData = useMemo(() => applyFilters(allData, filters), [allData, filters]);

  const value = useMemo(() => ({
    allData,
    filteredData,
    loading,
    error,
    filters,
    setFilters,
    resetFilters: () => setFilters(DEFAULT_FILTERS),
    dailyStats: getDailyStats(filteredData),
    topicStats: getTopicStats(filteredData),
    personStats: getPersonStats(filteredData),
    locationStats: getLocationStats(filteredData),
    companyStats: getCompanyStats(filteredData),
    publisherStats: getPublisherStats(filteredData),
    badVerdictStats: getBadVerdictStats(filteredData),
    wordCloud: getWordCloud(filteredData),
    geoStats: getGeoStats(filteredData), // Использовать filteredData для обновления карты
    totalShows: filteredData.reduce((sum, item) => sum + (item.shows || 0), 0),
    totalLikes: filteredData.reduce((sum, item) => sum + parseInt(item.likes || '0', 10), 0),
    totalComments: filteredData.reduce((sum, item) => sum + parseInt(item.comments || '0', 10), 0),
  }), [allData, filteredData, filters, loading, error]);

  return <NewsDataContext.Provider value={value}>{children}</NewsDataContext.Provider>;
}

export function useNewsDataContext() {
  const ctx = useContext(NewsDataContext);
  if (!ctx) throw new Error('useNewsDataContext must be used within NewsDataProvider');
  return ctx;
}
