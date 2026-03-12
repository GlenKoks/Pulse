import React, { createContext, useContext, useState, useMemo } from 'react';
import { NewsItem, Filters } from '../types';
import { MOCK_DATA } from '../data/mockData';
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

export function NewsDataProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const filteredData = useMemo(() => applyFilters(MOCK_DATA, filters), [filters]);

  const value = useMemo(() => ({
    allData: MOCK_DATA,
    filteredData,
    loading: false,
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
    geoStats: getGeoStats(MOCK_DATA),
    totalShows: filteredData.reduce((sum, item) => sum + (item.shows || 0), 0),
    totalLikes: filteredData.reduce((sum, item) => sum + parseInt(item.likes || '0', 10), 0),
    totalComments: filteredData.reduce((sum, item) => sum + parseInt(item.comments || '0', 10), 0),
  }), [filteredData, filters]);

  return <NewsDataContext.Provider value={value}>{children}</NewsDataContext.Provider>;
}

export function useNewsDataContext() {
  const ctx = useContext(NewsDataContext);
  if (!ctx) throw new Error('useNewsDataContext must be used within NewsDataProvider');
  return ctx;
}
