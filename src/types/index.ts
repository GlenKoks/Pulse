export interface NewsItem {
  bad_verdicts_list: string | null;
  comments: string | null;
  dt: string | null;
  likes: string | null;
  ndx: number | null;
  pub_url: string;
  publication_title_name: string | null;
  publisher_name: string | null;
  shows: number | null;
  topics_verdicts_list: string | null;
  persons: string | null;
  organizations: string | null;
  locations: string | null;
  country: string | null;
}

export interface DailyStats {
  date: string;
  count: number;
  totalShows: number;
}

export interface TopicStats {
  topic: string;
  count: number;
  totalShows: number;
}

export interface PersonStats {
  name: string;
  count: number;
  totalShows: number;
}

export interface PublisherStats {
  name: string;
  count: number;
  totalShows: number;
}

export interface WordFrequency {
  text: string;
  value: number;
}

export interface Filters {
  topics: string[];
  publishers: string[];
  persons: string[];
  dateRange: 2 | 7 | 30 | null;
  selectedTopic: string | null;
}

export type EntityType = 'persons' | 'locations' | 'companies';

export interface EntityStats {
  name: string;
  count: number;
  totalShows: number;
}
