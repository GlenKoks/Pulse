import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { NewsItem, Filters } from '../types';
import {
  getDailyStats,
  getTopicStats,
  getPersonStats,
  getPublisherStats,
  getBadVerdictStats,
  getWordCloud,
  applyFilters,
} from '../utils/dataProcessing';

const PAGE_SIZE = 1000;

interface NewsDataContextType {
  allData: NewsItem[];
  filteredData: NewsItem[];
  loading: boolean;
  error: string | null;
  progress: number;
  filters: Filters;
  setFilters: (f: Filters) => void;
  refetch: () => void;
  dailyStats: ReturnType<typeof getDailyStats>;
  topicStats: ReturnType<typeof getTopicStats>;
  personStats: ReturnType<typeof getPersonStats>;
  publisherStats: ReturnType<typeof getPublisherStats>;
  badVerdictStats: ReturnType<typeof getBadVerdictStats>;
  wordCloud: ReturnType<typeof getWordCloud>;
  totalShows: number;
  totalLikes: number;
  totalComments: number;
}

const NewsDataContext = createContext<NewsDataContextType | null>(null);

export function NewsDataProvider({ children }: { children: React.ReactNode }) {
  const [allData, setAllData] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [filters, setFilters] = useState<Filters>({ topics: [], publishers: [], persons: [] });

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setProgress(0);
    try {
      const { count } = await supabase
        .from('news_data')
        .select('*', { count: 'exact', head: true });

      const total = count || 0;
      const pages = Math.ceil(total / PAGE_SIZE);
      const results: NewsItem[] = [];

      for (let page = 0; page < pages; page++) {
        const { data, error: fetchError } = await supabase
          .from('news_data')
          .select('*')
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (fetchError) throw fetchError;
        if (data) results.push(...(data as NewsItem[]));
        setProgress(Math.round(((page + 1) / pages) * 100));
      }

      setAllData(results);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const filteredData = useMemo(() => applyFilters(allData, filters), [allData, filters]);

  const value = useMemo(() => ({
    allData,
    filteredData,
    loading,
    error,
    progress,
    filters,
    setFilters,
    refetch: fetchAllData,
    dailyStats: getDailyStats(filteredData),
    topicStats: getTopicStats(filteredData),
    personStats: getPersonStats(filteredData),
    publisherStats: getPublisherStats(filteredData),
    badVerdictStats: getBadVerdictStats(filteredData),
    wordCloud: getWordCloud(filteredData),
    totalShows: filteredData.reduce((sum, item) => sum + (item.shows || 0), 0),
    totalLikes: filteredData.reduce((sum, item) => sum + parseInt(item.likes || '0', 10), 0),
    totalComments: filteredData.reduce((sum, item) => sum + parseInt(item.comments || '0', 10), 0),
  }), [allData, filteredData, loading, error, progress, filters, fetchAllData]);

  return <NewsDataContext.Provider value={value}>{children}</NewsDataContext.Provider>;
}

export function useNewsDataContext() {
  const ctx = useContext(NewsDataContext);
  if (!ctx) throw new Error('useNewsDataContext must be used within NewsDataProvider');
  return ctx;
}
