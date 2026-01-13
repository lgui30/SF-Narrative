/**
 * NewsAPI Integration Module
 * 
 * Uses NewsAPI.org to fetch real-time news with accurate published dates
 * Free tier: 100 requests/day, 1 month of history
 * 
 * To use: Sign up at https://newsapi.org/ and add NEWSAPI_KEY to .env
 */

import { z } from 'zod';
import type { NewsArticle } from './types';

// Schema for NewsAPI response
const NewsAPIArticleSchema = z.object({
  source: z.object({
    id: z.string().nullable(),
    name: z.string(),
  }),
  author: z.string().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  url: z.string(),
  urlToImage: z.string().nullable(),
  publishedAt: z.string(),
  content: z.string().nullable(),
});

const NewsAPIResponseSchema = z.object({
  status: z.string(),
  totalResults: z.number(),
  articles: z.array(NewsAPIArticleSchema),
});

type NewsAPIResponse = z.infer<typeof NewsAPIResponseSchema>;

/**
 * Fetch news from NewsAPI for a specific category and date range
 * @param category - News category
 * @param fromDate - Start date (ISO string or Date)
 * @param toDate - End date (ISO string or Date)
 * @returns Array of news articles
 */
export async function fetchNewsFromAPI(
  category: 'tech' | 'politics' | 'economy' | 'sf-local',
  fromDate: string | Date = '2025-10-20',
  toDate?: string | Date
): Promise<NewsArticle[]> {
  const apiKey = process.env.NEWSAPI_KEY;

  if (!apiKey) {
    console.warn('NEWSAPI_KEY not configured, skipping NewsAPI fetch');
    return [];
  }

  // Convert dates to ISO strings
  const from = typeof fromDate === 'string' ? fromDate : fromDate.toISOString().split('T')[0];
  const to = toDate 
    ? (typeof toDate === 'string' ? toDate : toDate.toISOString().split('T')[0])
    : new Date().toISOString().split('T')[0];

  // Map categories to NewsAPI queries - ALL filtered for San Francisco
  const categoryQueries = {
    tech: {
      q: '("San Francisco" OR "Bay Area" OR "SF") AND (AI OR technology OR startup OR "artificial intelligence" OR tech OR "tech company")',
      domains: 'techcrunch.com,theverge.com,sfchronicle.com,sfstandard.com,bloomberg.com,wired.com,sfgate.com',
      category: 'technology',
    },
    politics: {
      q: '("San Francisco" OR "Bay Area" OR "SF" OR California) AND (politics OR election OR legislation OR government OR policy OR mayor OR supervisor)',
      domains: 'sfchronicle.com,sfstandard.com,sfgate.com,reuters.com,nytimes.com,politico.com',
      category: 'politics',
    },
    economy: {
      q: '("San Francisco" OR "Bay Area" OR "SF") AND (economy OR market OR business OR startup OR "real estate" OR housing OR jobs OR unemployment)',
      domains: 'sfchronicle.com,sfstandard.com,bloomberg.com,wsj.com,sfgate.com,bizjournals.com',
      category: 'business',
    },
    'sf-local': {
      q: '"San Francisco" OR "Bay Area" OR SF OR BART OR "Golden Gate" OR Oakland OR Berkeley OR "Silicon Valley"',
      domains: 'sfchronicle.com,sfstandard.com,sfgate.com,mercurynews.com,oaklandside.org',
      category: 'general',
    },
  };

  const config = categoryQueries[category];

  try {
    console.log(`Fetching ${category} news from NewsAPI (${from} to ${to})...`);
    
    // Build query parameters
    const params = new URLSearchParams({
      q: config.q,
      from: from,
      to: to,
      language: 'en',
      sortBy: 'publishedAt',
      pageSize: '10',
      apiKey: apiKey,
    });

    if (config.domains) {
      params.append('domains', config.domains);
    }

    const response = await fetch(`https://newsapi.org/v2/everything?${params.toString()}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`NewsAPI error: ${response.status} - ${errorText}`);
      throw new Error(`NewsAPI request failed: ${response.status}`);
    }

    const data: unknown = await response.json();
    const validatedData = NewsAPIResponseSchema.parse(data);

    if (validatedData.status !== 'ok') {
      throw new Error(`NewsAPI returned status: ${validatedData.status}`);
    }

    // Convert to our NewsArticle format
    const articles: NewsArticle[] = validatedData.articles
      .filter(article => article.title && article.url && article.title !== '[Removed]')
      .map(article => ({
        title: article.title,
        url: article.url,
        snippet: article.description || article.content?.substring(0, 200) || article.title,
        publishedDate: article.publishedAt,
        source: article.source.name,
      }));

    console.log(`✓ Fetched ${articles.length} articles from NewsAPI for ${category}`);
    return articles;
  } catch (error) {
    console.error(`Error fetching from NewsAPI for ${category}:`, error);
    
    if (error instanceof z.ZodError) {
      console.error('NewsAPI validation error:', error.message);
    }
    
    // Don't throw - return empty array to allow fallback to other methods
    return [];
  }
}

/**
 * Fetch news from Google News RSS feed (free, no API key required)
 * All queries filtered for San Francisco relevance
 * @param category - News category
 * @returns Array of news articles
 */
export async function fetchNewsFromGoogleRSS(
  category: 'tech' | 'politics' | 'economy' | 'sf-local'
): Promise<NewsArticle[]> {
  // ALL queries now include San Francisco terms
  const categoryQueries = {
    tech: '("San Francisco" OR "Bay Area" OR SF) AND (technology OR AI OR startup OR tech)',
    politics: '("San Francisco" OR "Bay Area" OR California) AND (politics OR election OR government OR mayor)',
    economy: '("San Francisco" OR "Bay Area" OR SF) AND (economy OR business OR startup OR housing OR "real estate")',
    'sf-local': '"San Francisco" OR "Bay Area" OR SF OR BART OR "Golden Gate" OR Oakland OR Berkeley',
  };

  try {
    console.log(`Fetching ${category} news from Google News RSS...`);
    
    const query = encodeURIComponent(categoryQueries[category]);
    const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;

    const response = await fetch(rssUrl);
    
    if (!response.ok) {
      throw new Error(`Google News RSS request failed: ${response.status}`);
    }

    const xmlText = await response.text();
    
    // Simple XML parsing for RSS feed
    const items = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];
    
    const articles: NewsArticle[] = items
      .slice(0, 10) // Limit to 10 articles
      .map(item => {
        // Try with and without CDATA (using [\s\S] for compatibility)
        const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
        const linkMatch = item.match(/<link>(.*?)<\/link>/);
        const descMatch = item.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/);
        const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
        const sourceMatch = item.match(/<source url=".*?">(.*?)<\/source>/);

        if (!titleMatch || !linkMatch) return null;

        // Clean HTML from description
        const cleanDesc = descMatch ? descMatch[1].replace(/<[^>]*>/g, '').trim() : titleMatch[1];

        return {
          title: titleMatch[1].trim(),
          url: linkMatch[1].trim(),
          snippet: cleanDesc.substring(0, 200),
          publishedDate: pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString(),
          source: sourceMatch ? sourceMatch[1].trim() : 'Google News',
        };
      })
      .filter((article): article is NewsArticle => article !== null);

    console.log(`✓ Fetched ${articles.length} articles from Google News RSS for ${category}`);
    return articles;
  } catch (error) {
    console.error(`Error fetching from Google News RSS for ${category}:`, error);
    return [];
  }
}

/**
 * Check if an article is SF-relevant by examining title and snippet
 * @param article - News article to check
 * @returns true if article mentions SF/Bay Area
 */
function isSFRelevant(article: NewsArticle): boolean {
  const sfKeywords = [
    'san francisco',
    'sf ',
    ' sf',
    'bay area',
    'silicon valley',
    'oakland',
    'berkeley',
    'bart',
    'golden gate',
    'soma',
    'mission district',
    'financial district',
    'tenderloin',
    'castro',
    'haight',
    'presidio',
    'marin',
    'peninsula',
    'east bay',
    'south bay',
    'california',
    'ca ',
  ];
  
  const searchText = `${article.title} ${article.snippet}`.toLowerCase();
  
  return sfKeywords.some(keyword => searchText.includes(keyword));
}

/**
 * Fetch news with automatic fallback (tries NewsAPI first, then Google RSS)
 * All results filtered for SF relevance
 * @param category - News category
 * @param fromDate - Start date
 * @returns Array of news articles (SF-relevant only)
 */
export async function fetchNewsWithFallback(
  category: 'tech' | 'politics' | 'economy' | 'sf-local',
  fromDate: string | Date = '2025-10-20'
): Promise<NewsArticle[]> {
  // Try NewsAPI first
  let articles = await fetchNewsFromAPI(category, fromDate);
  
  // If NewsAPI fails or returns no results, try Google RSS
  if (articles.length === 0) {
    console.log(`NewsAPI returned no results for ${category}, trying Google RSS...`);
    articles = await fetchNewsFromGoogleRSS(category);
  }

  // Filter to ensure dates are from the specified week
  const fromDateObj = new Date(fromDate);
  let filteredArticles = articles.filter(article => {
    const publishedDate = new Date(article.publishedDate);
    return publishedDate >= fromDateObj;
  });

  // Additional filter: Ensure articles are SF-relevant
  filteredArticles = filteredArticles.filter(article => isSFRelevant(article));

  console.log(`✓ Total ${filteredArticles.length} SF-relevant articles for ${category} from ${fromDate}`);
  return filteredArticles;
}

/**
 * Priority SF neighborhoods for targeted news fetching
 */
const PRIORITY_NEIGHBORHOODS = [
  { name: 'Mission', query: 'Mission District San Francisco' },
  { name: 'Castro/Upper Market', query: 'Castro San Francisco' },
  { name: 'South of Market', query: 'SOMA San Francisco OR "South of Market" San Francisco' },
  { name: 'Financial District', query: 'Financial District San Francisco OR FiDi San Francisco' },
  { name: 'Haight Ashbury', query: 'Haight Ashbury San Francisco OR Haight-Ashbury' },
  { name: 'Chinatown', query: 'Chinatown San Francisco' },
  { name: 'North Beach', query: 'North Beach San Francisco' },
  { name: 'Marina', query: 'Marina District San Francisco' },
  { name: 'Tenderloin', query: 'Tenderloin San Francisco' },
  { name: 'Potrero Hill', query: 'Potrero Hill San Francisco' },
  { name: 'Mission Bay', query: 'Mission Bay San Francisco' },
  { name: 'Noe Valley', query: 'Noe Valley San Francisco' },
];

/**
 * Fetch neighborhood-specific news for each major SF neighborhood
 * Each neighborhood gets 5 unique articles
 * @param fromDate - Start date for articles
 * @returns Map of neighborhood name to articles
 */
export async function fetchNeighborhoodSpecificNews(
  fromDate: string | Date = '2025-10-20'
): Promise<Map<string, NewsArticle[]>> {
  const neighborhoodNews = new Map<string, NewsArticle[]>();

  console.log('📍 Fetching neighborhood-specific news for', PRIORITY_NEIGHBORHOODS.length, 'neighborhoods...');

  // Fetch news for each neighborhood
  for (const neighborhood of PRIORITY_NEIGHBORHOODS) {
    try {
      const articles = await fetchNewsFromGoogleRSS('sf-local', neighborhood.query);

      // Filter by date and SF relevance
      const fromDateObj = new Date(fromDate);
      const filtered = articles
        .filter(article => {
          const publishedDate = new Date(article.publishedDate);
          return publishedDate >= fromDateObj;
        })
        .filter(article => isSFRelevant(article))
        .slice(0, 5); // Take top 5 articles per neighborhood

      if (filtered.length > 0) {
        // Tag articles with the specific neighborhood
        const tagged = filtered.map(article => ({
          ...article,
          neighborhoods: [neighborhood.name]
        }));

        neighborhoodNews.set(neighborhood.name, tagged);
        console.log(`  ✓ ${neighborhood.name}: ${filtered.length} articles`);
      } else {
        console.log(`  ⚠ ${neighborhood.name}: No articles found`);
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`  ✗ Error fetching news for ${neighborhood.name}:`, error);
    }
  }

  const totalArticles = Array.from(neighborhoodNews.values()).reduce((sum, articles) => sum + articles.length, 0);
  console.log(`✓ Fetched ${totalArticles} neighborhood-specific articles across ${neighborhoodNews.size} neighborhoods`);

  return neighborhoodNews;
}

