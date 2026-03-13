/**
 * Supabase Database Types
 * Автоматически сгенерированные типы для работы с базой данных Pulse
 */

export interface Publisher {
  id: string;
  name: string;
}

export interface Publication {
  id: string;
  url: string;
  title: string;
  publisher_id: string;
  published_at: string; // ISO 8601 date
  publisher?: Publisher;
  metrics?: PublicationMetrics;
  persons?: Person[];
  organizations?: Organization[];
  locations?: Location[];
  countries?: Country[];
  topics?: Topic[];
  bad_verdicts?: BadVerdict[];
}

export interface PublicationMetrics {
  publication_id: string;
  shows: number | null;
  likes: number | null;
  comments: number | null;
}

export interface Person {
  id: string;
  name: string;
}

export interface Organization {
  id: string;
  name: string;
}

export interface Location {
  id: string;
  name: string;
}

export interface Country {
  id: string;
  name: string;
}

export interface Topic {
  id: string;
  name: string;
}

export interface BadVerdict {
  id: string;
  name: string;
}

// Relation tables
export interface PublicationPerson {
  publication_id: string;
  person_id: string;
}

export interface PublicationOrganization {
  publication_id: string;
  organization_id: string;
}

export interface PublicationLocation {
  publication_id: string;
  location_id: string;
}

export interface PublicationCountry {
  publication_id: string;
  country_id: string;
}

export interface PublicationTopic {
  publication_id: string;
  topic_id: string;
}

export interface PublicationBadVerdict {
  publication_id: string;
  verdict_id: string;
}

/**
 * Transformed types for analytics
 * Используются для преобразования данных Supabase в формат приложения
 */

export interface NewsItemFromSupabase {
  id: string;
  pub_url: string;
  publication_title_name: string;
  publisher_name: string;
  dt: string; // ISO 8601 date
  shows: number;
  likes: number;
  comments: number;
  persons: string[]; // Array of person names
  organizations: string[]; // Array of organization names
  locations: string[]; // Array of location names
  countries: string[]; // Array of country names
  topics_verdicts_list: string[]; // Array of topic names
  bad_verdicts_list: string[]; // Array of bad verdict names
}
