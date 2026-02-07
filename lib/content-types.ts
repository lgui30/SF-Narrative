/**
 * Content Pipeline Types
 * Types for the dual-pipeline system: news fetching and activities
 */

import { NewsArticle } from './types';

// ============================================
// Activity Types
// ============================================

export type ActivityCategory =
  | 'events'
  | 'outdoor'
  | 'food'
  | 'community'
  | 'nightlife'
  | 'free';

export type RecurringType = 'daily' | 'weekly' | 'monthly' | 'once';

export interface PriceInfo {
  min: number;
  max: number;
  isFree: boolean;
  currency?: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  category: ActivityCategory;
  subcategory?: string;
  date: string; // ISO date string
  time?: string; // HH:mm format
  endTime?: string; // HH:mm format
  venue: string;
  address?: string;
  neighborhood?: string;
  price: PriceInfo;
  url: string;
  source: string;
  tags: string[];
  imageUrl?: string;
  recurring?: RecurringType;
  coordinates?: Coordinates;
}

// ============================================
// Enhanced News Article Types
// ============================================

export type NewsSourceType =
  | 'official'
  | 'premium_local'
  | 'community'
  | 'google_news'
  | 'aggregator';

export type SentimentType = 'positive' | 'negative' | 'neutral';

export interface EnhancedNewsArticle extends NewsArticle {
  id: string;
  sourceType: NewsSourceType;
  priority: number; // 1-10, higher = more important
  hasAlert: boolean;
  sentiment?: SentimentType;
  alertKeywords?: string[]; // Keywords that triggered alert
}

// ============================================
// Cache Structures
// ============================================

export interface NewsCacheStats {
  totalFeeds: number;
  feedsSucceeded: number;
  feedsFailed: number;
  articlesBeforeDedup: number;
  articlesAfterDedup: number;
  alertCount: number;
}

export interface NewsCache {
  lastUpdated: string;
  stats: NewsCacheStats;
  items: EnhancedNewsArticle[];
  byNeighborhood: Record<string, string[]>; // neighborhood -> article IDs
  byCategory: Record<string, string[]>; // category -> article IDs
  alerts: string[]; // article IDs with alerts
}

export interface ActivitiesCacheStats {
  totalActivities: number;
  byCategory: Record<ActivityCategory, number>;
}

export interface ActivitiesCache {
  lastUpdated: string;
  stats: ActivitiesCacheStats;
  items: Activity[];
  featured: string[]; // activity IDs
  thisWeekend: string[]; // activity IDs
  freeToday: string[]; // activity IDs
  byNeighborhood: Record<string, string[]>; // neighborhood -> activity IDs
}

// ============================================
// News Source Configuration
// ============================================

export interface NewsSourceConfig {
  name: string;
  type: NewsSourceType;
  priority: number;
  url: string;
  parseType: 'rss' | 'json' | 'html';
  category?: string;
  rateLimit?: number; // requests per minute
  enabled: boolean;
}

export interface NewsFeedResult {
  source: NewsSourceConfig;
  articles: EnhancedNewsArticle[];
  success: boolean;
  error?: string;
  fetchedAt: string;
}

// ============================================
// Activity Source Configuration
// ============================================

export interface ActivitySourceConfig {
  name: string;
  url: string;
  parseType: 'api' | 'rss' | 'json';
  category: ActivityCategory;
  apiKey?: string;
  rateLimit?: number;
  enabled: boolean;
}

export interface ActivityFeedResult {
  source: ActivitySourceConfig;
  activities: Activity[];
  success: boolean;
  error?: string;
  fetchedAt: string;
}

// ============================================
// Filter Types
// ============================================

export interface ActivityFilters {
  categories?: ActivityCategory[];
  neighborhoods?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  priceRange?: {
    min: number;
    max: number;
  };
  freeOnly?: boolean;
  search?: string;
  tags?: string[];
}

export interface NewsFilters {
  categories?: string[];
  neighborhoods?: string[];
  sourceTypes?: NewsSourceType[];
  alertsOnly?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
}

// ============================================
// SF Neighborhoods
// ============================================

export const SF_NEIGHBORHOODS = [
  'Bayview/Hunters Point',
  'Bernal Heights',
  'Castro/Upper Market',
  'Chinatown',
  'Civic Center/Tenderloin',
  'Cole Valley',
  'Dogpatch',
  'Downtown/Union Square',
  'Excelsior',
  'Financial District',
  'Fisherman\'s Wharf',
  'Glen Park',
  'Golden Gate Park',
  'Haight-Ashbury',
  'Hayes Valley',
  'Ingleside',
  'Inner Richmond',
  'Inner Sunset',
  'Japantown',
  'Lakeshore',
  'Marina',
  'Mission',
  'Mission Bay',
  'Nob Hill',
  'Noe Valley',
  'North Beach',
  'Ocean View',
  'Outer Mission',
  'Outer Richmond',
  'Outer Sunset',
  'Pacific Heights',
  'Parkside',
  'Portola',
  'Potrero Hill',
  'Presidio',
  'Russian Hill',
  'Sea Cliff',
  'SoMa',
  'South Beach',
  'Sunset',
  'Twin Peaks',
  'Visitacion Valley',
  'West Portal',
  'Western Addition',
] as const;

export type SFNeighborhood = typeof SF_NEIGHBORHOODS[number];

// ============================================
// Alert Keywords
// ============================================

export const ALERT_KEYWORDS = [
  // Transit
  'bart delay', 'muni delay', 'muni shutdown', 'transit emergency',
  'caltrain delay', 'ferry delay',
  // Emergency
  'fire', 'earthquake', 'evacuation', 'emergency alert',
  'tsunami warning', 'shelter in place',
  // Safety
  'shooting', 'stabbing', 'homicide', 'robbery', 'assault',
  'police activity', 'standoff',
  // Traffic
  'road closure', 'bridge closure', 'traffic alert',
  'accident', 'collision',
  // Protest/Events
  'protest', 'demonstration', 'march', 'rally',
  // Weather
  'flood warning', 'storm warning', 'power outage',
  // Infrastructure
  'water main break', 'gas leak', 'building collapse',
] as const;

export type AlertKeyword = typeof ALERT_KEYWORDS[number];

// ============================================
// Unified Feed Types
// ============================================

export interface NewsStory {
  id: string;
  title: string;
  summary: string;
  bullets?: string[];
  sources?: { title: string; url: string }[];
  category: 'tech' | 'politics' | 'economy' | 'sf-local';
  neighborhood?: string;
  publishedAt: string;
  keywords?: string[];
}

export type FeedItem =
  | { type: 'event'; data: Activity }
  | { type: 'news'; data: NewsStory }
  | { type: 'digest'; data: { neighborhood: string; summary: string; date: string } };
