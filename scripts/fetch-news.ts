#!/usr/bin/env npx tsx
/**
 * News Fetching Script
 * Fetches SF news from 40+ sources across 5 tiers
 * Includes deduplication, alert detection, and neighborhood tagging
 *
 * Usage:
 *   npx tsx scripts/fetch-news.ts
 *   npm run fetch-news
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import {
  EnhancedNewsArticle,
  NewsCache,
  NewsCacheStats,
  NewsSourceConfig,
  NewsSourceType,
  SF_NEIGHBORHOODS,
  ALERT_KEYWORDS,
} from '../lib/content-types';
import { fetchRedditNews } from '../lib/sources/reddit';

// ============================================
// News Source Configuration
// ============================================

const NEWS_SOURCES: NewsSourceConfig[] = [
  // Tier 1: Official Sources (Priority 10)
  {
    name: 'SF.gov News',
    type: 'official',
    priority: 10,
    url: 'https://news.google.com/rss/search?q=site:sf.gov+San+Francisco&hl=en-US&gl=US&ceid=US:en',
    parseType: 'rss',
    enabled: true,
  },
  {
    name: 'SFMTA News',
    type: 'official',
    priority: 10,
    url: 'https://news.google.com/rss/search?q=SFMTA+San+Francisco&hl=en-US&gl=US&ceid=US:en',
    parseType: 'rss',
    enabled: true,
  },
  {
    name: 'BART News',
    type: 'official',
    priority: 10,
    url: 'https://news.google.com/rss/search?q=BART+Bay+Area&hl=en-US&gl=US&ceid=US:en',
    parseType: 'rss',
    enabled: true,
  },
  {
    name: 'SF Police',
    type: 'official',
    priority: 10,
    url: 'https://news.google.com/rss/search?q=SFPD+San+Francisco+police&hl=en-US&gl=US&ceid=US:en',
    parseType: 'rss',
    enabled: true,
  },
  {
    name: 'SF Fire Dept',
    type: 'official',
    priority: 10,
    url: 'https://news.google.com/rss/search?q=SFFD+San+Francisco+fire&hl=en-US&gl=US&ceid=US:en',
    parseType: 'rss',
    enabled: true,
  },

  // Tier 2: Premium Local News (Priority 9)
  {
    name: 'SF Chronicle',
    type: 'premium_local',
    priority: 9,
    url: 'https://news.google.com/rss/search?q=site:sfchronicle.com&hl=en-US&gl=US&ceid=US:en',
    parseType: 'rss',
    enabled: true,
  },
  {
    name: 'SF Standard',
    type: 'premium_local',
    priority: 9,
    url: 'https://news.google.com/rss/search?q=site:sfstandard.com&hl=en-US&gl=US&ceid=US:en',
    parseType: 'rss',
    enabled: true,
  },
  {
    name: 'Mission Local',
    type: 'premium_local',
    priority: 9,
    url: 'https://missionlocal.org/feed/',
    parseType: 'rss',
    enabled: true,
  },
  {
    name: 'Hoodline',
    type: 'premium_local',
    priority: 9,
    url: 'https://news.google.com/rss/search?q=site:hoodline.com+San+Francisco&hl=en-US&gl=US&ceid=US:en',
    parseType: 'rss',
    enabled: true,
  },
  {
    name: 'SF Examiner',
    type: 'premium_local',
    priority: 9,
    url: 'https://news.google.com/rss/search?q=site:sfexaminer.com&hl=en-US&gl=US&ceid=US:en',
    parseType: 'rss',
    enabled: true,
  },

  // Tier 3: Community Sources (Priority 8) - Reddit handled separately

  // Tier 4: Google News Category Searches (Priority 7)
  {
    name: 'SF Tech News',
    type: 'google_news',
    priority: 7,
    url: 'https://news.google.com/rss/search?q=San+Francisco+tech+startup&hl=en-US&gl=US&ceid=US:en',
    parseType: 'rss',
    category: 'tech',
    rateLimit: 60,
    enabled: true,
  },
  {
    name: 'SF AI News',
    type: 'google_news',
    priority: 7,
    url: 'https://news.google.com/rss/search?q=San+Francisco+artificial+intelligence+AI&hl=en-US&gl=US&ceid=US:en',
    parseType: 'rss',
    category: 'tech',
    rateLimit: 60,
    enabled: true,
  },
  {
    name: 'SF Layoffs',
    type: 'google_news',
    priority: 7,
    url: 'https://news.google.com/rss/search?q=San+Francisco+layoffs+tech&hl=en-US&gl=US&ceid=US:en',
    parseType: 'rss',
    category: 'tech',
    rateLimit: 60,
    enabled: true,
  },
  {
    name: 'SF Politics',
    type: 'google_news',
    priority: 7,
    url: 'https://news.google.com/rss/search?q=San+Francisco+mayor+politics&hl=en-US&gl=US&ceid=US:en',
    parseType: 'rss',
    category: 'politics',
    rateLimit: 60,
    enabled: true,
  },
  {
    name: 'SF Board of Supervisors',
    type: 'google_news',
    priority: 7,
    url: 'https://news.google.com/rss/search?q=San+Francisco+Board+of+Supervisors&hl=en-US&gl=US&ceid=US:en',
    parseType: 'rss',
    category: 'politics',
    rateLimit: 60,
    enabled: true,
  },
  {
    name: 'SF Elections',
    type: 'google_news',
    priority: 7,
    url: 'https://news.google.com/rss/search?q=San+Francisco+election+vote&hl=en-US&gl=US&ceid=US:en',
    parseType: 'rss',
    category: 'politics',
    rateLimit: 60,
    enabled: true,
  },
  {
    name: 'SF Housing',
    type: 'google_news',
    priority: 7,
    url: 'https://news.google.com/rss/search?q=San+Francisco+housing+rent&hl=en-US&gl=US&ceid=US:en',
    parseType: 'rss',
    category: 'economy',
    rateLimit: 60,
    enabled: true,
  },
  {
    name: 'SF Real Estate',
    type: 'google_news',
    priority: 7,
    url: 'https://news.google.com/rss/search?q=San+Francisco+real+estate+property&hl=en-US&gl=US&ceid=US:en',
    parseType: 'rss',
    category: 'economy',
    rateLimit: 60,
    enabled: true,
  },
  {
    name: 'SF Economy',
    type: 'google_news',
    priority: 7,
    url: 'https://news.google.com/rss/search?q=San+Francisco+economy+business&hl=en-US&gl=US&ceid=US:en',
    parseType: 'rss',
    category: 'economy',
    rateLimit: 60,
    enabled: true,
  },
  {
    name: 'SF Jobs',
    type: 'google_news',
    priority: 7,
    url: 'https://news.google.com/rss/search?q=San+Francisco+jobs+employment&hl=en-US&gl=US&ceid=US:en',
    parseType: 'rss',
    category: 'economy',
    rateLimit: 60,
    enabled: true,
  },
  {
    name: 'SF Crime',
    type: 'google_news',
    priority: 7,
    url: 'https://news.google.com/rss/search?q=San+Francisco+crime&hl=en-US&gl=US&ceid=US:en',
    parseType: 'rss',
    category: 'sf-local',
    rateLimit: 60,
    enabled: true,
  },
  {
    name: 'SF Transportation',
    type: 'google_news',
    priority: 7,
    url: 'https://news.google.com/rss/search?q=San+Francisco+Muni+BART+transit&hl=en-US&gl=US&ceid=US:en',
    parseType: 'rss',
    category: 'sf-local',
    rateLimit: 60,
    enabled: true,
  },
  {
    name: 'SF Homeless',
    type: 'google_news',
    priority: 7,
    url: 'https://news.google.com/rss/search?q=San+Francisco+homeless+homelessness&hl=en-US&gl=US&ceid=US:en',
    parseType: 'rss',
    category: 'sf-local',
    rateLimit: 60,
    enabled: true,
  },
  {
    name: 'SF Weather',
    type: 'google_news',
    priority: 7,
    url: 'https://news.google.com/rss/search?q=San+Francisco+weather+storm&hl=en-US&gl=US&ceid=US:en',
    parseType: 'rss',
    category: 'sf-local',
    rateLimit: 60,
    enabled: true,
  },
  {
    name: 'SF Food',
    type: 'google_news',
    priority: 7,
    url: 'https://news.google.com/rss/search?q=San+Francisco+restaurant+food&hl=en-US&gl=US&ceid=US:en',
    parseType: 'rss',
    category: 'sf-local',
    rateLimit: 60,
    enabled: true,
  },
  {
    name: 'SF Events',
    type: 'google_news',
    priority: 7,
    url: 'https://news.google.com/rss/search?q=San+Francisco+event+festival&hl=en-US&gl=US&ceid=US:en',
    parseType: 'rss',
    category: 'sf-local',
    rateLimit: 60,
    enabled: true,
  },

  // Tier 5: Aggregators (Priority 6)
  {
    name: 'SFist',
    type: 'aggregator',
    priority: 6,
    url: 'https://news.google.com/rss/search?q=site:sfist.com&hl=en-US&gl=US&ceid=US:en',
    parseType: 'rss',
    enabled: true,
  },
  {
    name: 'Curbed SF',
    type: 'aggregator',
    priority: 6,
    url: 'https://news.google.com/rss/search?q=site:sf.curbed.com+OR+%22Curbed+SF%22&hl=en-US&gl=US&ceid=US:en',
    parseType: 'rss',
    enabled: true,
  },
  {
    name: 'Eater SF',
    type: 'aggregator',
    priority: 6,
    url: 'https://news.google.com/rss/search?q=site:sf.eater.com+OR+%22Eater+SF%22&hl=en-US&gl=US&ceid=US:en',
    parseType: 'rss',
    enabled: true,
  },
  {
    name: 'KQED',
    type: 'aggregator',
    priority: 6,
    url: 'https://news.google.com/rss/search?q=site:kqed.org+San+Francisco&hl=en-US&gl=US&ceid=US:en',
    parseType: 'rss',
    enabled: true,
  },
  {
    name: 'ABC7 SF',
    type: 'aggregator',
    priority: 6,
    url: 'https://news.google.com/rss/search?q=site:abc7news.com+San+Francisco&hl=en-US&gl=US&ceid=US:en',
    parseType: 'rss',
    enabled: true,
  },
  {
    name: 'NBC Bay Area',
    type: 'aggregator',
    priority: 6,
    url: 'https://news.google.com/rss/search?q=site:nbcbayarea.com+San+Francisco&hl=en-US&gl=US&ceid=US:en',
    parseType: 'rss',
    enabled: true,
  },
  {
    name: 'KTVU',
    type: 'aggregator',
    priority: 6,
    url: 'https://news.google.com/rss/search?q=site:ktvu.com+San+Francisco&hl=en-US&gl=US&ceid=US:en',
    parseType: 'rss',
    enabled: true,
  },

  // Neighborhood-specific searches
  {
    name: 'Mission District',
    type: 'google_news',
    priority: 6,
    url: 'https://news.google.com/rss/search?q=%22Mission+District%22+San+Francisco&hl=en-US&gl=US&ceid=US:en',
    parseType: 'rss',
    category: 'sf-local',
    rateLimit: 60,
    enabled: true,
  },
  {
    name: 'Castro District',
    type: 'google_news',
    priority: 6,
    url: 'https://news.google.com/rss/search?q=%22Castro%22+San+Francisco&hl=en-US&gl=US&ceid=US:en',
    parseType: 'rss',
    category: 'sf-local',
    rateLimit: 60,
    enabled: true,
  },
  {
    name: 'Tenderloin',
    type: 'google_news',
    priority: 6,
    url: 'https://news.google.com/rss/search?q=%22Tenderloin%22+San+Francisco&hl=en-US&gl=US&ceid=US:en',
    parseType: 'rss',
    category: 'sf-local',
    rateLimit: 60,
    enabled: true,
  },
  {
    name: 'SoMa',
    type: 'google_news',
    priority: 6,
    url: 'https://news.google.com/rss/search?q=%22SoMa%22+OR+%22South+of+Market%22+San+Francisco&hl=en-US&gl=US&ceid=US:en',
    parseType: 'rss',
    category: 'sf-local',
    rateLimit: 60,
    enabled: true,
  },
  {
    name: 'Chinatown',
    type: 'google_news',
    priority: 6,
    url: 'https://news.google.com/rss/search?q=%22Chinatown%22+San+Francisco&hl=en-US&gl=US&ceid=US:en',
    parseType: 'rss',
    category: 'sf-local',
    rateLimit: 60,
    enabled: true,
  },
];

// ============================================
// RSS Parsing
// ============================================

interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source?: string;
}

/**
 * Parse RSS XML to items
 */
function parseRSS(xml: string): RSSItem[] {
  const items: RSSItem[] = [];
  const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

  for (const itemXml of itemMatches) {
    const title = extractTag(itemXml, 'title');
    const link = extractTag(itemXml, 'link');
    const description = extractTag(itemXml, 'description');
    const pubDate = extractTag(itemXml, 'pubDate');
    const source = extractTag(itemXml, 'source');

    if (title && link) {
      items.push({ title, link, description, pubDate, source });
    }
  }

  return items;
}

/**
 * Extract tag content from XML
 */
function extractTag(xml: string, tag: string): string {
  // Handle CDATA
  const cdataPattern = new RegExp(
    `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`,
    'i'
  );
  const cdataMatch = xml.match(cdataPattern);
  if (cdataMatch) return decodeHTMLEntities(cdataMatch[1].trim());

  const pattern = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = xml.match(pattern);
  return match ? decodeHTMLEntities(match[1].trim()) : '';
}

/**
 * Decode HTML entities
 */
function decodeHTMLEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'",
    '&nbsp;': ' ',
    '&#39;': "'",
    '&#x27;': "'",
  };

  let result = text;
  for (const [entity, char] of Object.entries(entities)) {
    result = result.replace(new RegExp(entity, 'g'), char);
  }

  return result.replace(/&#(\d+);/g, (_, code) =>
    String.fromCharCode(parseInt(code))
  );
}

/**
 * Strip HTML tags
 */
function stripHTML(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================
// News Processing
// ============================================

/**
 * Extract neighborhoods from text
 */
function extractNeighborhoods(text: string): string[] {
  const lowerText = text.toLowerCase();
  const found: string[] = [];

  // Check for SF neighborhoods
  for (const neighborhood of SF_NEIGHBORHOODS) {
    if (lowerText.includes(neighborhood.toLowerCase())) {
      found.push(neighborhood);
    }
  }

  // Additional aliases
  const aliases: Record<string, string> = {
    'tenderloin': 'Civic Center/Tenderloin',
    'the castro': 'Castro/Upper Market',
    'fidi': 'Financial District',
    'the mission': 'Mission',
    'pac heights': 'Pacific Heights',
    'soma': 'SoMa',
    'south of market': 'SoMa',
    'hunters point': 'Bayview/Hunters Point',
  };

  for (const [alias, neighborhood] of Object.entries(aliases)) {
    if (lowerText.includes(alias) && !found.includes(neighborhood)) {
      found.push(neighborhood);
    }
  }

  return [...new Set(found)];
}

/**
 * Check for alert keywords
 */
function checkForAlerts(text: string): { hasAlert: boolean; keywords: string[] } {
  const lowerText = text.toLowerCase();
  const foundKeywords: string[] = [];

  for (const keyword of ALERT_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      foundKeywords.push(keyword);
    }
  }

  return {
    hasAlert: foundKeywords.length > 0,
    keywords: foundKeywords,
  };
}

/**
 * Determine article category from source and content
 */
function determineCategory(source: NewsSourceConfig, text: string): string {
  if (source.category) return source.category;

  const lowerText = text.toLowerCase();

  // Tech indicators
  if (
    lowerText.includes('tech') ||
    lowerText.includes('startup') ||
    lowerText.includes('software') ||
    lowerText.includes('ai ') ||
    lowerText.includes('artificial intelligence')
  ) {
    return 'tech';
  }

  // Politics indicators
  if (
    lowerText.includes('mayor') ||
    lowerText.includes('supervisor') ||
    lowerText.includes('election') ||
    lowerText.includes('vote') ||
    lowerText.includes('politics')
  ) {
    return 'politics';
  }

  // Economy indicators
  if (
    lowerText.includes('housing') ||
    lowerText.includes('rent') ||
    lowerText.includes('economy') ||
    lowerText.includes('job') ||
    lowerText.includes('business')
  ) {
    return 'economy';
  }

  return 'sf-local';
}

/**
 * Check if article is SF-relevant
 */
function isSFRelevant(text: string): boolean {
  const lowerText = text.toLowerCase();
  const sfKeywords = [
    'san francisco',
    'sf',
    'bay area',
    'muni',
    'bart',
    'sfmta',
    'tenderloin',
    'mission district',
    'castro',
    'soma',
    'chinatown',
    'north beach',
    'haight',
    'marina',
    'presidio',
    'golden gate',
    'fisherman',
  ];

  return sfKeywords.some((keyword) => lowerText.includes(keyword));
}

/**
 * Convert RSS item to EnhancedNewsArticle
 */
function rssItemToArticle(
  item: RSSItem,
  source: NewsSourceConfig
): EnhancedNewsArticle {
  const combinedText = `${item.title} ${item.description}`;
  const neighborhoods = extractNeighborhoods(combinedText);
  const alertInfo = checkForAlerts(combinedText);

  // Generate unique ID
  const id = `${source.type}-${Buffer.from(item.link).toString('base64').slice(0, 20)}`;

  return {
    id,
    title: item.title,
    url: item.link,
    snippet: stripHTML(item.description).slice(0, 300),
    publishedDate: item.pubDate
      ? new Date(item.pubDate).toISOString()
      : new Date().toISOString(),
    source: item.source || source.name,
    sourceType: source.type,
    priority: source.priority,
    hasAlert: alertInfo.hasAlert,
    alertKeywords: alertInfo.keywords.length > 0 ? alertInfo.keywords : undefined,
    neighborhoods: neighborhoods.length > 0 ? neighborhoods : undefined,
  };
}

// ============================================
// Fetching
// ============================================

/**
 * Fetch RSS feed
 */
async function fetchRSSFeed(
  source: NewsSourceConfig
): Promise<{ articles: EnhancedNewsArticle[]; error?: string }> {
  try {
    const response = await fetch(source.url, {
      headers: {
        'User-Agent': 'SF-Narrative/1.0 (news aggregator)',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      return { articles: [], error: `HTTP ${response.status}` };
    }

    const xml = await response.text();
    const items = parseRSS(xml);

    const articles = items
      .map((item) => rssItemToArticle(item, source))
      .filter((article) => isSFRelevant(`${article.title} ${article.snippet}`));

    return { articles };
  } catch (error) {
    return { articles: [], error: String(error) };
  }
}

/**
 * Deduplicate articles by URL similarity
 */
function deduplicateArticles(
  articles: EnhancedNewsArticle[]
): EnhancedNewsArticle[] {
  const seen = new Map<string, EnhancedNewsArticle>();

  // Sort by priority (highest first) so we keep the best source
  const sorted = [...articles].sort((a, b) => b.priority - a.priority);

  for (const article of sorted) {
    // Normalize URL for comparison
    const normalizedUrl = article.url
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '')
      .replace(/[?#].*$/, '');

    // Check for similar titles (basic dedup)
    const normalizedTitle = article.title
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .trim();

    // Use a combination of URL and title as key
    const key = `${normalizedUrl.slice(0, 50)}_${normalizedTitle.slice(0, 30)}`;

    if (!seen.has(key)) {
      seen.set(key, article);
    }
  }

  return Array.from(seen.values());
}

// ============================================
// Main Script
// ============================================

async function main() {
  console.log('Starting news fetch...');
  console.log(`Total sources configured: ${NEWS_SOURCES.length}`);

  const startTime = Date.now();
  const allArticles: EnhancedNewsArticle[] = [];
  let feedsSucceeded = 0;
  let feedsFailed = 0;
  const errors: string[] = [];

  // Fetch from all RSS sources
  const enabledSources = NEWS_SOURCES.filter((s) => s.enabled);
  console.log(`\nFetching from ${enabledSources.length} RSS sources...`);

  // Process sources in batches to avoid overwhelming the system
  const batchSize = 5;
  for (let i = 0; i < enabledSources.length; i += batchSize) {
    const batch = enabledSources.slice(i, i + batchSize);

    const results = await Promise.all(
      batch.map(async (source) => {
        const result = await fetchRSSFeed(source);

        if (result.error) {
          feedsFailed++;
          errors.push(`${source.name}: ${result.error}`);
          console.log(`  ✗ ${source.name}: ${result.error}`);
        } else {
          feedsSucceeded++;
          console.log(`  ✓ ${source.name}: ${result.articles.length} articles`);
        }

        return result.articles;
      })
    );

    allArticles.push(...results.flat());

    // Small delay between batches
    if (i + batchSize < enabledSources.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  // Fetch from Reddit
  console.log('\nFetching from Reddit...');
  try {
    const redditResult = await fetchRedditNews();
    allArticles.push(...redditResult.articles);
    feedsSucceeded += 4; // 4 subreddits
    console.log(`  ✓ Reddit: ${redditResult.articles.length} posts`);

    if (redditResult.errors.length > 0) {
      errors.push(...redditResult.errors);
    }
  } catch (error) {
    feedsFailed++;
    errors.push(`Reddit: ${error}`);
    console.log(`  ✗ Reddit: ${error}`);
  }

  // Deduplicate
  const articlesBeforeDedup = allArticles.length;
  console.log(`\nDeduplicating ${articlesBeforeDedup} articles...`);

  const deduplicatedArticles = deduplicateArticles(allArticles);
  console.log(`After dedup: ${deduplicatedArticles.length} articles`);

  // Sort by date (newest first)
  deduplicatedArticles.sort(
    (a, b) =>
      new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime()
  );

  // Filter to last 7 days
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentArticles = deduplicatedArticles.filter(
    (a) => new Date(a.publishedDate) >= oneWeekAgo
  );
  console.log(`After date filter (7 days): ${recentArticles.length} articles`);

  // Build indexes
  const byNeighborhood: Record<string, string[]> = {};
  const byCategory: Record<string, string[]> = {
    tech: [],
    politics: [],
    economy: [],
    'sf-local': [],
  };
  const alerts: string[] = [];

  for (const article of recentArticles) {
    // Index by neighborhood
    if (article.neighborhoods) {
      for (const neighborhood of article.neighborhoods) {
        if (!byNeighborhood[neighborhood]) {
          byNeighborhood[neighborhood] = [];
        }
        byNeighborhood[neighborhood].push(article.id);
      }
    }

    // Index by category
    const category = determineCategory(
      { type: article.sourceType, priority: article.priority } as NewsSourceConfig,
      `${article.title} ${article.snippet}`
    );
    if (byCategory[category]) {
      byCategory[category].push(article.id);
    }

    // Track alerts
    if (article.hasAlert) {
      alerts.push(article.id);
    }
  }

  // Build cache object
  const stats: NewsCacheStats = {
    totalFeeds: enabledSources.length + 4, // +4 for Reddit subreddits
    feedsSucceeded,
    feedsFailed,
    articlesBeforeDedup,
    articlesAfterDedup: recentArticles.length,
    alertCount: alerts.length,
  };

  const cache: NewsCache = {
    lastUpdated: new Date().toISOString(),
    stats,
    items: recentArticles,
    byNeighborhood,
    byCategory,
    alerts,
  };

  // Write cache file
  const dataDir = join(process.cwd(), 'data');
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  const cachePath = join(dataDir, 'news-cache.json');
  writeFileSync(cachePath, JSON.stringify(cache, null, 2));

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n=== News Fetch Complete ===');
  console.log(`Duration: ${duration}s`);
  console.log(`Sources: ${feedsSucceeded} succeeded, ${feedsFailed} failed`);
  console.log(`Articles: ${recentArticles.length} (from ${articlesBeforeDedup} before dedup)`);
  console.log(`Alerts: ${alerts.length}`);
  console.log(`Cache written to: ${cachePath}`);

  if (errors.length > 0) {
    console.log(`\nErrors (${errors.length}):`);
    errors.slice(0, 10).forEach((e) => console.log(`  - ${e}`));
    if (errors.length > 10) {
      console.log(`  ... and ${errors.length - 10} more`);
    }
  }
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
