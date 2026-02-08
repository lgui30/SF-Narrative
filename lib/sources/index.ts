/**
 * Unified News Source Interface
 * 
 * Combines all news sources with automatic fallback and deduplication
 */

import type { NewsArticle } from '../types';
import { fetchRSSArticles, isRSSAvailable } from './rss-parser';
import { fetchRedditArticles, isRedditAvailable } from './reddit-client';
import { fetchHackerNewsArticles, isHNAvailable } from './hackernews-client';
import { fetchTheNewsAPIArticles, isTheNewsAPIAvailable, getRemainingRequests } from './thenewsapi-client';

export type NewsCategory = 'tech' | 'politics' | 'economy' | 'sf-local';

interface FetchOptions {
  category?: NewsCategory;
  limit?: number;
  fromDate?: Date;
  skipBackup?: boolean; // Skip backup API (TheNewsAPI) even if needed
}

interface SourceStatus {
  name: string;
  available: boolean;
  rateLimit?: { remaining: number };
}

/**
 * SF relevance keywords for scoring
 */
const SF_KEYWORDS = [
  { term: 'san francisco', score: 10 },
  { term: 'bay area', score: 8 },
  { term: 'sf ', score: 5 },
  { term: ' sf', score: 5 },
  { term: 'silicon valley', score: 6 },
  { term: 'oakland', score: 4 },
  { term: 'berkeley', score: 4 },
  { term: 'bart', score: 5 },
  { term: 'caltrain', score: 4 },
  { term: 'golden gate', score: 5 },
];

const SF_NEIGHBORHOODS = [
  'mission', 'soma', 'castro', 'tenderloin', 'haight', 'marina',
  'noe valley', 'potrero', 'dogpatch', 'sunset', 'richmond',
  'north beach', 'chinatown', 'financial district', 'embarcadero',
  'hayes valley', 'pacific heights', 'nob hill', 'russian hill',
];

/**
 * Calculate SF relevance score for an article
 */
export function scoreRelevance(article: NewsArticle): number {
  const text = `${article.title} ${article.snippet}`.toLowerCase();
  let score = 0;
  
  // Check SF keywords
  for (const { term, score: points } of SF_KEYWORDS) {
    if (text.includes(term)) {
      score += points;
    }
  }
  
  // Check neighborhoods
  for (const neighborhood of SF_NEIGHBORHOODS) {
    if (text.includes(neighborhood)) {
      score += 3;
    }
  }
  
  // Recency bonus (only for valid past dates)
  try {
    const pubDate = new Date(article.publishedDate);
    if (!isNaN(pubDate.getTime())) {
      const hoursAgo = (Date.now() - pubDate.getTime()) / 3600000;
      // Only give recency bonus for past dates (hoursAgo > 0)
      if (hoursAgo > 0 && hoursAgo < 6) score += 10;
      else if (hoursAgo > 0 && hoursAgo < 24) score += 5;
      else if (hoursAgo > 0 && hoursAgo < 72) score += 2;
      // Future dates or very old articles get no recency bonus
    }
  } catch {
    // Ignore date parsing errors
  }
  
  // Source bonus (local sources get boost)
  const localSources = ['sf standard', 'mission local', 'sfchronicle', 'sfgate'];
  if (localSources.some(s => article.source.toLowerCase().includes(s))) {
    score += 5;
  }
  
  return score;
}

/**
 * Normalize URL for deduplication
 * Removes tracking params but preserves meaningful query params
 */
function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    
    // Tracking params to remove
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'ref', 'source', 'fbclid', 'gclid', 'mc_cid', 'mc_eid',
    ];
    
    for (const param of trackingParams) {
      parsed.searchParams.delete(param);
    }
    
    // Sort remaining params for consistent comparison
    parsed.searchParams.sort();
    
    // Build normalized URL: hostname (without www) + pathname (without trailing slash) + sorted query string
    const hostname = parsed.hostname.replace(/^www\./, '');
    const pathname = parsed.pathname.replace(/\/$/, '');
    const queryString = parsed.searchParams.toString();
    
    return queryString ? `${hostname}${pathname}?${queryString}` : `${hostname}${pathname}`;
  } catch {
    // Fallback for invalid URLs - just lowercase and remove fragments
    return url.toLowerCase().replace(/#.*$/, '');
  }
}

/**
 * Deduplicate articles by URL
 */
export function deduplicateByUrl(articles: NewsArticle[]): NewsArticle[] {
  const seen = new Set<string>();
  const deduped: NewsArticle[] = [];
  
  for (const article of articles) {
    const key = normalizeUrl(article.url);
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(article);
    }
  }
  
  return deduped;
}

/**
 * Filter articles by date
 */
function filterByDate(articles: NewsArticle[], fromDate?: Date): NewsArticle[] {
  if (!fromDate) return articles;
  
  return articles.filter(article => {
    try {
      const pubDate = new Date(article.publishedDate);
      return pubDate >= fromDate;
    } catch {
      return true; // Include if date parsing fails
    }
  });
}

/**
 * Check availability of all sources
 */
export async function getSourceStatus(): Promise<SourceStatus[]> {
  const [rss, reddit, hn, newsapi] = await Promise.all([
    isRSSAvailable(),
    isRedditAvailable(),
    isHNAvailable(),
    isTheNewsAPIAvailable(),
  ]);
  
  return [
    { name: 'RSS (SF Standard, Mission Local)', available: rss },
    { name: 'Reddit (r/sanfrancisco, r/bayarea)', available: reddit },
    { name: 'Hacker News', available: hn },
    { 
      name: 'TheNewsAPI', 
      available: newsapi, 
      rateLimit: { remaining: getRemainingRequests() } 
    },
  ];
}

/**
 * Fetch articles from all sources for a specific category
 */
export async function fetchFromAllSources(
  category: NewsCategory,
  options: FetchOptions = {}
): Promise<NewsArticle[]> {
  const { limit = 10, fromDate, skipBackup = false } = options;
  const allArticles: NewsArticle[] = [];
  
  console.log(`\n📰 Fetching ${category} from all sources...`);
  
  // 1. Fetch from RSS feeds (primary, no rate limits)
  try {
    const rssArticles = await fetchRSSArticles();
    allArticles.push(...rssArticles[category]);
    console.log(`  RSS: ${rssArticles[category].length} articles`);
  } catch (error) {
    console.error('  RSS fetch failed:', error);
  }
  
  // 2. Fetch from Reddit
  try {
    const redditArticles = await fetchRedditArticles();
    allArticles.push(...redditArticles[category]);
    console.log(`  Reddit: ${redditArticles[category].length} articles`);
  } catch (error) {
    console.error('  Reddit fetch failed:', error);
  }
  
  // 3. Fetch from Hacker News (tech only)
  if (category === 'tech') {
    try {
      const hnArticles = await fetchHackerNewsArticles();
      allArticles.push(...hnArticles);
      console.log(`  Hacker News: ${hnArticles.length} articles`);
    } catch (error) {
      console.error('  Hacker News fetch failed:', error);
    }
  }
  
  // 4. Use TheNewsAPI as backup if needed
  if (!skipBackup && allArticles.length < 5) {
    console.log(`  Only ${allArticles.length} articles, fetching from backup API...`);
    try {
      const backupArticles = await fetchTheNewsAPIArticles(category, 10);
      allArticles.push(...backupArticles);
      console.log(`  TheNewsAPI: ${backupArticles.length} articles`);
    } catch (error) {
      console.error('  TheNewsAPI fetch failed:', error);
    }
  }
  
  // Filter by date
  let filtered = filterByDate(allArticles, fromDate);
  
  // Deduplicate
  filtered = deduplicateByUrl(filtered);
  
  // Score and sort by relevance
  const scored = filtered.map(article => ({
    article,
    score: scoreRelevance(article),
  }));
  scored.sort((a, b) => b.score - a.score);
  
  // Take top N
  const result = scored.slice(0, limit).map(s => s.article);
  
  console.log(`  Total: ${result.length} unique articles for ${category}`);
  return result;
}

/**
 * Fetch articles for all categories
 */
export async function fetchAllCategories(
  options: FetchOptions = {}
): Promise<{
  tech: NewsArticle[];
  politics: NewsArticle[];
  economy: NewsArticle[];
  'sf-local': NewsArticle[];
}> {
  const { limit = 10, fromDate, skipBackup = false } = options;
  
  console.log('\n🔄 Starting multi-source news aggregation...');
  console.log(`📅 From date: ${fromDate?.toISOString().split('T')[0] || 'any'}`);
  
  // Fetch all sources in parallel first to minimize API calls
  const [rssAll, redditAll, hnArticles] = await Promise.all([
    fetchRSSArticles().catch(() => ({ tech: [], politics: [], economy: [], 'sf-local': [] })),
    fetchRedditArticles().catch(() => ({ tech: [], politics: [], economy: [], 'sf-local': [] })),
    fetchHackerNewsArticles().catch(() => []),
  ]);
  
  // Combine by category
  const combined = {
    tech: [...rssAll.tech, ...redditAll.tech, ...hnArticles],
    politics: [...rssAll.politics, ...redditAll.politics],
    economy: [...rssAll.economy, ...redditAll.economy],
    'sf-local': [...rssAll['sf-local'], ...redditAll['sf-local']],
  };
  
  // Check which categories need backup
  const needsBackup: NewsCategory[] = [];
  for (const [cat, articles] of Object.entries(combined)) {
    if (articles.length < 3) {
      needsBackup.push(cat as NewsCategory);
    }
  }
  
  // Fetch backup for categories that need it
  if (!skipBackup && needsBackup.length > 0) {
    console.log(`📡 Categories needing backup: ${needsBackup.join(', ')}`);
    for (const cat of needsBackup) {
      try {
        const backup = await fetchTheNewsAPIArticles(cat, 10);
        combined[cat].push(...backup);
      } catch (error) {
        console.error(`Backup fetch failed for ${cat}:`, error);
      }
    }
  }
  
  // Process each category (filter by date, dedupe within category, score and sort)
  const processCategory = (articles: NewsArticle[]): NewsArticle[] => {
    let filtered = filterByDate(articles, fromDate);
    filtered = deduplicateByUrl(filtered);
    
    // Score and sort
    const scored = filtered.map(article => ({
      article,
      score: scoreRelevance(article),
    }));
    scored.sort((a, b) => b.score - a.score);
    
    return scored.slice(0, limit).map(s => s.article);
  };
  
  const result = {
    tech: processCategory(combined.tech),
    politics: processCategory(combined.politics),
    economy: processCategory(combined.economy),
    'sf-local': processCategory(combined['sf-local']),
  };
  
  // Cross-category deduplication: remove articles that appear in multiple categories
  // Priority order: sf-local > politics > economy > tech (local news gets priority)
  const seenUrls = new Set<string>();
  const categoryOrder: (keyof typeof result)[] = ['sf-local', 'politics', 'economy', 'tech'];
  
  for (const category of categoryOrder) {
    result[category] = result[category].filter(article => {
      const normalizedUrl = normalizeUrlForDedup(article.url);
      if (seenUrls.has(normalizedUrl)) {
        return false; // Already seen in a higher-priority category
      }
      seenUrls.add(normalizedUrl);
      return true;
    });
  }
  
  console.log('\n📊 Final article counts:');
  console.log(`  Tech: ${result.tech.length}`);
  console.log(`  Politics: ${result.politics.length}`);
  console.log(`  Economy: ${result.economy.length}`);
  console.log(`  SF-Local: ${result['sf-local'].length}`);
  
  return result;
}

/**
 * Helper for cross-category deduplication (uses same logic as normalizeUrl)
 */
function normalizeUrlForDedup(url: string): string {
  try {
    const parsed = new URL(url);
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'ref', 'source', 'fbclid', 'gclid', 'mc_cid', 'mc_eid',
    ];
    for (const param of trackingParams) {
      parsed.searchParams.delete(param);
    }
    parsed.searchParams.sort();
    const hostname = parsed.hostname.replace(/^www\./, '');
    const pathname = parsed.pathname.replace(/\/$/, '');
    const queryString = parsed.searchParams.toString();
    return queryString ? `${hostname}${pathname}?${queryString}` : `${hostname}${pathname}`;
  } catch {
    return url.toLowerCase().replace(/#.*$/, '');
  }
}

// Re-export individual source functions for testing/debugging
export { fetchRSSArticles } from './rss-parser';
export { fetchRedditArticles } from './reddit-client';
export { fetchHackerNewsArticles } from './hackernews-client';
export { fetchTheNewsAPIArticles } from './thenewsapi-client';
