/**
 * Browser-side Content Loader
 * Loads cached news and activities data for instant display
 * Falls back to API if cache is unavailable
 */

import {
  Activity,
  ActivityCategory,
  ActivitiesCache,
  ActivityFilters,
  EnhancedNewsArticle,
  NewsCache,
  NewsFilters,
  NewsSourceType,
} from './content-types';

// Cache storage
let newsCache: NewsCache | null = null;
let activitiesCache: ActivitiesCache | null = null;
let newsCachePromise: Promise<NewsCache | null> | null = null;
let activitiesCachePromise: Promise<ActivitiesCache | null> | null = null;

// ============================================
// Cache Loading
// ============================================

/**
 * Load news cache from API
 */
export async function loadNewsCache(): Promise<NewsCache | null> {
  // Return cached data if available
  if (newsCache) return newsCache;

  // Return existing promise if loading
  if (newsCachePromise) return newsCachePromise;

  newsCachePromise = (async () => {
    try {
      const response = await fetch('/api/news-cache');

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          newsCache = result.data;
          return newsCache;
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to load news cache:', error);
      return null;
    } finally {
      newsCachePromise = null;
    }
  })();

  return newsCachePromise;
}

/**
 * Load activities cache from API
 */
export async function loadActivitiesCache(): Promise<ActivitiesCache | null> {
  // Return cached data if available
  if (activitiesCache) return activitiesCache;

  // Return existing promise if loading
  if (activitiesCachePromise) return activitiesCachePromise;

  activitiesCachePromise = (async () => {
    try {
      const response = await fetch('/api/activities-cache');

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          activitiesCache = result.data;
          return activitiesCache;
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to load activities cache:', error);
      return null;
    } finally {
      activitiesCachePromise = null;
    }
  })();

  return activitiesCachePromise;
}

/**
 * Clear cached data (useful for manual refresh)
 */
export function clearCache(): void {
  newsCache = null;
  activitiesCache = null;
}

// ============================================
// News Filtering & Access
// ============================================

/**
 * Get all news articles
 */
export async function getAllNews(): Promise<EnhancedNewsArticle[]> {
  const cache = await loadNewsCache();
  return cache?.items || [];
}

/**
 * Get news article by ID
 */
export async function getNewsById(id: string): Promise<EnhancedNewsArticle | null> {
  const cache = await loadNewsCache();
  return cache?.items.find((article) => article.id === id) || null;
}

/**
 * Filter news articles
 */
export async function filterNews(filters: NewsFilters): Promise<EnhancedNewsArticle[]> {
  const cache = await loadNewsCache();
  if (!cache) return [];

  let articles = [...cache.items];

  // Filter by category
  if (filters.categories && filters.categories.length > 0) {
    const categoryIds = new Set<string>();
    for (const category of filters.categories) {
      const ids = cache.byCategory[category] || [];
      ids.forEach((id) => categoryIds.add(id));
    }
    articles = articles.filter((a) => categoryIds.has(a.id));
  }

  // Filter by neighborhood
  if (filters.neighborhoods && filters.neighborhoods.length > 0) {
    articles = articles.filter((a) =>
      a.neighborhoods?.some((n) => filters.neighborhoods!.includes(n))
    );
  }

  // Filter by source type
  if (filters.sourceTypes && filters.sourceTypes.length > 0) {
    articles = articles.filter((a) =>
      filters.sourceTypes!.includes(a.sourceType)
    );
  }

  // Filter by alerts only
  if (filters.alertsOnly) {
    articles = articles.filter((a) => a.hasAlert);
  }

  // Filter by date range
  if (filters.dateRange) {
    const start = new Date(filters.dateRange.start);
    const end = new Date(filters.dateRange.end);

    articles = articles.filter((a) => {
      const date = new Date(a.publishedDate);
      return date >= start && date <= end;
    });
  }

  // Filter by search text
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    articles = articles.filter(
      (a) =>
        a.title.toLowerCase().includes(searchLower) ||
        a.snippet.toLowerCase().includes(searchLower)
    );
  }

  return articles;
}

/**
 * Get news by neighborhood
 */
export async function getNewsByNeighborhood(
  neighborhood: string
): Promise<EnhancedNewsArticle[]> {
  const cache = await loadNewsCache();
  if (!cache) return [];

  const ids = cache.byNeighborhood[neighborhood] || [];
  return cache.items.filter((a) => ids.includes(a.id));
}

/**
 * Get news by category
 */
export async function getNewsByCategory(
  category: string
): Promise<EnhancedNewsArticle[]> {
  const cache = await loadNewsCache();
  if (!cache) return [];

  const ids = cache.byCategory[category] || [];
  return cache.items.filter((a) => ids.includes(a.id));
}

/**
 * Get alert news
 */
export async function getAlertNews(): Promise<EnhancedNewsArticle[]> {
  const cache = await loadNewsCache();
  if (!cache) return [];

  return cache.items.filter((a) => cache.alerts.includes(a.id));
}

/**
 * Get news cache stats
 */
export async function getNewsCacheStats() {
  const cache = await loadNewsCache();
  return cache?.stats || null;
}

// ============================================
// Activities Filtering & Access
// ============================================

/**
 * Get all activities
 */
export async function getAllActivities(): Promise<Activity[]> {
  const cache = await loadActivitiesCache();
  return cache?.items || [];
}

/**
 * Get activity by ID
 */
export async function getActivityById(id: string): Promise<Activity | null> {
  const cache = await loadActivitiesCache();
  return cache?.items.find((activity) => activity.id === id) || null;
}

/**
 * Filter activities
 */
export async function filterActivities(
  filters: ActivityFilters
): Promise<Activity[]> {
  const cache = await loadActivitiesCache();
  if (!cache) return [];

  let activities = [...cache.items];

  // Filter by category
  if (filters.categories && filters.categories.length > 0) {
    activities = activities.filter((a) =>
      filters.categories!.includes(a.category)
    );
  }

  // Filter by neighborhood
  if (filters.neighborhoods && filters.neighborhoods.length > 0) {
    activities = activities.filter(
      (a) => a.neighborhood && filters.neighborhoods!.includes(a.neighborhood)
    );
  }

  // Filter by date range
  if (filters.dateRange) {
    activities = activities.filter((a) => {
      return a.date >= filters.dateRange!.start && a.date <= filters.dateRange!.end;
    });
  }

  // Filter by price range
  if (filters.priceRange) {
    activities = activities.filter(
      (a) =>
        a.price.min >= filters.priceRange!.min &&
        a.price.max <= filters.priceRange!.max
    );
  }

  // Filter by free only
  if (filters.freeOnly) {
    activities = activities.filter((a) => a.price.isFree);
  }

  // Filter by tags
  if (filters.tags && filters.tags.length > 0) {
    activities = activities.filter((a) =>
      filters.tags!.some((tag) => a.tags.includes(tag))
    );
  }

  // Filter by search text
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    activities = activities.filter(
      (a) =>
        a.title.toLowerCase().includes(searchLower) ||
        a.description.toLowerCase().includes(searchLower) ||
        a.venue.toLowerCase().includes(searchLower)
    );
  }

  return activities;
}

/**
 * Get activities by neighborhood
 */
export async function getActivitiesByNeighborhood(
  neighborhood: string
): Promise<Activity[]> {
  const cache = await loadActivitiesCache();
  if (!cache) return [];

  const ids = cache.byNeighborhood[neighborhood] || [];
  return cache.items.filter((a) => ids.includes(a.id));
}

/**
 * Get activities by category
 */
export async function getActivitiesByCategory(
  category: ActivityCategory
): Promise<Activity[]> {
  const cache = await loadActivitiesCache();
  if (!cache) return [];

  return cache.items.filter((a) => a.category === category);
}

/**
 * Get weekend activities
 */
export async function getWeekendActivities(): Promise<Activity[]> {
  const cache = await loadActivitiesCache();
  if (!cache) return [];

  return cache.items.filter((a) => cache.thisWeekend.includes(a.id));
}

/**
 * Get free activities today
 */
export async function getFreeToday(): Promise<Activity[]> {
  const cache = await loadActivitiesCache();
  if (!cache) return [];

  return cache.items.filter((a) => cache.freeToday.includes(a.id));
}

/**
 * Get featured activities
 */
export async function getFeaturedActivities(): Promise<Activity[]> {
  const cache = await loadActivitiesCache();
  if (!cache) return [];

  return cache.items.filter((a) => cache.featured.includes(a.id));
}

/**
 * Get activities cache stats
 */
export async function getActivitiesCacheStats() {
  const cache = await loadActivitiesCache();
  return cache?.stats || null;
}

// ============================================
// Utility Functions
// ============================================

/**
 * Get activities for a specific date
 */
export async function getActivitiesForDate(date: string): Promise<Activity[]> {
  const cache = await loadActivitiesCache();
  if (!cache) return [];

  return cache.items.filter((a) => a.date === date);
}

/**
 * Get activities for date range
 */
export async function getActivitiesForDateRange(
  startDate: string,
  endDate: string
): Promise<Activity[]> {
  return filterActivities({
    dateRange: { start: startDate, end: endDate },
  });
}

/**
 * Search both news and activities
 */
export async function searchContent(
  query: string
): Promise<{
  news: EnhancedNewsArticle[];
  activities: Activity[];
}> {
  const [news, activities] = await Promise.all([
    filterNews({ search: query }),
    filterActivities({ search: query }),
  ]);

  return { news, activities };
}

/**
 * Get content by neighborhood
 */
export async function getContentByNeighborhood(
  neighborhood: string
): Promise<{
  news: EnhancedNewsArticle[];
  activities: Activity[];
}> {
  const [news, activities] = await Promise.all([
    getNewsByNeighborhood(neighborhood),
    getActivitiesByNeighborhood(neighborhood),
  ]);

  return { news, activities };
}

/**
 * Get cache freshness info
 */
export async function getCacheFreshness(): Promise<{
  news: { lastUpdated: string | null; articleCount: number };
  activities: { lastUpdated: string | null; activityCount: number };
}> {
  const [newsCache, activitiesCache] = await Promise.all([
    loadNewsCache(),
    loadActivitiesCache(),
  ]);

  return {
    news: {
      lastUpdated: newsCache?.lastUpdated || null,
      articleCount: newsCache?.items.length || 0,
    },
    activities: {
      lastUpdated: activitiesCache?.lastUpdated || null,
      activityCount: activitiesCache?.items.length || 0,
    },
  };
}
