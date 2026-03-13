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
  parseList,
} from '../utils/dataProcessing';
import { fetchPublicationsWithMetrics } from '../utils/supabaseQueries';
import type { NewsItemFromSupabase } from '../types/supabase';

const DEFAULT_FILTERS: Filters = {
  topics: [],
  publishers: [],
  persons: [],
  dateRange: null,
  selectedTopic: null,
  selectedGeo: null,
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
 * Трансформирует данные из Supabase в формат приложения
 */
function transformSupabaseToNewsItem(item: NewsItemFromSupabase): NewsItem {
  // Помощник для безопасного объединения массивов в строку
  const joinList = (list: string[] | undefined) => {
    if (!list || !Array.isArray(list) || list.length === 0) return null;
    return list.filter(Boolean).join(', ');
  };

  return {
    bad_verdicts_list: joinList(item.bad_verdicts_list),
    comments: item.comments?.toString() || '0',
    dt: item.dt,
    likes: item.likes?.toString() || '0',
    ndx: null,
    pub_url: item.pub_url,
    publication_title_name: item.publication_title_name,
    publisher_name: item.publisher_name,
    shows: item.shows || 0,
    topics_verdicts_list: joinList(item.topics_verdicts_list),
    persons: joinList(item.persons),
    organizations: joinList(item.organizations),
    locations: joinList(item.locations),
    country: item.countries.length > 0 ? item.countries[0] : null,
    geo: item.countries.length > 0 ? item.countries[0] : null,
  };
}

export function NewsDataProvider({ children }: { children: React.ReactNode }) {
  const [allData, setAllData] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  // Загружаем данные из Supabase при монтировании компонента
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const supabaseData = await fetchPublicationsWithMetrics(30);
        const transformedData = supabaseData.map(transformSupabaseToNewsItem);
        setAllData(transformedData);
      } catch (err) {
        console.error('Full Supabase Error Context:', err);
        const errorMsg = err instanceof Error ? `${err.name}: ${err.message}` : JSON.stringify(err);
        setError(`Supabase Error: ${errorMsg}`);
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
    // geoStats считается по ВСЕМ данным (без geo-фильтра) чтобы карта всегда
    // показывала полную тепловую картину, а не схлопывалась при выборе страны
    geoStats: getGeoStats(allData),
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
