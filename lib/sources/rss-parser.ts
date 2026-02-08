/**
 * RSS Parser for SF Standard and Mission Local
 * 
 * Parses RSS feeds from local SF news sources
 * No rate limiting - these are public RSS feeds
 */

import type { NewsArticle } from '../types';

interface RSSFeedConfig {
  name: string;
  url: string;
  defaultCategory: 'tech' | 'politics' | 'economy' | 'sf-local';
}

const RSS_FEEDS: RSSFeedConfig[] = [
  {
    name: 'SF Standard',
    url: 'https://sfstandard.com/feed/',
    defaultCategory: 'sf-local',
  },
  {
    name: 'Mission Local',
    url: 'https://missionlocal.org/feed/',
    defaultCategory: 'sf-local',
  },
];

/**
 * Category mapping based on RSS item categories/tags
 */
const CATEGORY_KEYWORDS: Record<string, 'tech' | 'politics' | 'economy' | 'sf-local'> = {
  // Tech keywords
  'technology': 'tech',
  'tech': 'tech',
  'ai': 'tech',
  'artificial intelligence': 'tech',
  'startup': 'tech',
  'startups': 'tech',
  'silicon valley': 'tech',
  'software': 'tech',
  'google': 'tech',
  'meta': 'tech',
  'openai': 'tech',
  'salesforce': 'tech',
  
  // Politics keywords
  'politics': 'politics',
  'government': 'politics',
  'election': 'politics',
  'mayor': 'politics',
  'supervisor': 'politics',
  'city hall': 'politics',
  'legislation': 'politics',
  'policy': 'politics',
  'board of supervisors': 'politics',
  
  // Economy keywords
  'economy': 'economy',
  'business': 'economy',
  'housing': 'economy',
  'real estate': 'economy',
  'jobs': 'economy',
  'employment': 'economy',
  'downtown': 'economy',
  'commercial': 'economy',
  'retail': 'economy',
  'development': 'economy',
};

/**
 * Parse a single RSS feed
 */
async function fetchWithRetry(url: string, options: RequestInit): Promise<Response> {
  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response;
  } catch (error) {
    console.warn(`⚠️ Fetch failed for ${url}, retrying in 1s...`, error instanceof Error ? error.message : error);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return fetch(url, options);
  }
}

async function parseFeed(config: RSSFeedConfig): Promise<NewsArticle[]> {
  try {
    console.log(`📡 Fetching RSS feed: ${config.name}...`);
    
    const response = await fetchWithRetry(config.url, {
      headers: {
        'User-Agent': 'SF-Narrative/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch ${config.name}: ${response.status}`);
      return [];
    }

    const xmlText = await response.text();
    
    // Parse RSS items
    const items = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];
    
    const articles: NewsArticle[] = items
      .slice(0, 20) // Take top 20 items
      .map(item => {
        // Extract fields with CDATA handling
        const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
        const linkMatch = item.match(/<link>([\s\S]*?)<\/link>/);
        const descMatch = item.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/);
        const pubDateMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
        const contentMatch = item.match(/<content:encoded>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content:encoded>/);
        const categoryMatches = item.match(/<category>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/category>/g);
        const creatorMatch = item.match(/<dc:creator>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/dc:creator>/);

        if (!titleMatch || !linkMatch) return null;

        // Clean HTML from description/content
        const rawDesc = descMatch?.[1] || contentMatch?.[1] || titleMatch[1];
        const cleanDesc = rawDesc
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .trim();

        // Parse categories from RSS
        const categories: string[] = categoryMatches
          ? categoryMatches.map(cat => {
              const match = cat.match(/<category>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/category>/);
              return match?.[1]?.toLowerCase().trim() || '';
            }).filter(Boolean)
          : [];

        // Parse publication date
        let publishedDate: string;
        if (pubDateMatch) {
          try {
            publishedDate = new Date(pubDateMatch[1].trim()).toISOString();
          } catch {
            publishedDate = new Date().toISOString();
          }
        } else {
          publishedDate = new Date().toISOString();
        }

        return {
          title: titleMatch[1].trim(),
          url: linkMatch[1].trim(),
          snippet: cleanDesc.substring(0, 300),
          publishedDate,
          source: config.name,
          _categories: categories, // Temporary field for category inference
        };
      })
      .filter((article): article is NewsArticle & { _categories: string[] } => article !== null);

    console.log(`✓ Parsed ${articles.length} articles from ${config.name}`);
    return articles;
  } catch (error) {
    console.error(`Error parsing RSS feed ${config.name}:`, error);
    return [];
  }
}

/**
 * Infer category from article content and RSS categories
 */
function inferCategory(
  article: NewsArticle & { _categories?: string[] }
): 'tech' | 'politics' | 'economy' | 'sf-local' {
  const categories = article._categories || [];
  const text = `${article.title} ${article.snippet}`.toLowerCase();
  
  // Check RSS categories first
  for (const cat of categories) {
    const lowerCat = cat.toLowerCase();
    if (CATEGORY_KEYWORDS[lowerCat]) {
      return CATEGORY_KEYWORDS[lowerCat];
    }
  }
  
  // Check text content
  for (const [keyword, category] of Object.entries(CATEGORY_KEYWORDS)) {
    if (text.includes(keyword)) {
      return category;
    }
  }
  
  return 'sf-local'; // Default
}

/**
 * Fetch all RSS articles grouped by category
 */
export async function fetchRSSArticles(): Promise<{
  tech: NewsArticle[];
  politics: NewsArticle[];
  economy: NewsArticle[];
  'sf-local': NewsArticle[];
}> {
  const results = {
    tech: [] as NewsArticle[],
    politics: [] as NewsArticle[],
    economy: [] as NewsArticle[],
    'sf-local': [] as NewsArticle[],
  };

  // Fetch all feeds in parallel
  const feedResults = await Promise.all(
    RSS_FEEDS.map(feed => parseFeed(feed))
  );

  // Combine and categorize
  for (const articles of feedResults) {
    for (const article of articles) {
      const category = inferCategory(article);
      // Remove temporary _categories field
      const { _categories, ...cleanArticle } = article as NewsArticle & { _categories?: string[] };
      results[category].push(cleanArticle);
    }
  }

  console.log(`📰 RSS totals - Tech: ${results.tech.length}, Politics: ${results.politics.length}, Economy: ${results.economy.length}, SF-Local: ${results['sf-local'].length}`);
  
  return results;
}

/**
 * Fetch RSS articles for a specific category
 */
export async function fetchRSSByCategory(
  category: 'tech' | 'politics' | 'economy' | 'sf-local'
): Promise<NewsArticle[]> {
  const all = await fetchRSSArticles();
  return all[category];
}

/**
 * Check if RSS sources are available
 */
export async function isRSSAvailable(): Promise<boolean> {
  try {
    const response = await fetch(RSS_FEEDS[0].url, {
      method: 'HEAD',
      headers: { 'User-Agent': 'SF-Narrative/1.0' },
    });
    return response.ok;
  } catch {
    return false;
  }
}
