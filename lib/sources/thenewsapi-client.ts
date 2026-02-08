/**
 * TheNewsAPI Client (Backup Source)
 * 
 * Used as backup when primary sources don't have enough articles
 * Free tier: 100 requests/day
 */

import type { NewsArticle } from '../types';

interface TheNewsAPIArticle {
  uuid: string;
  title: string;
  description: string;
  keywords: string;
  snippet: string;
  url: string;
  image_url: string;
  language: string;
  published_at: string;
  source: string;
  categories: string[];
  relevance_score: number | null;
}

interface TheNewsAPIResponse {
  meta: {
    found: number;
    returned: number;
    limit: number;
    page: number;
  };
  data: TheNewsAPIArticle[];
}

/**
 * Category to search query mapping
 */
const CATEGORY_QUERIES: Record<string, string> = {
  tech: '"San Francisco" OR "Bay Area" AND (technology OR AI OR startup OR tech)',
  politics: '"San Francisco" OR "California" AND (politics OR election OR government OR mayor)',
  economy: '"San Francisco" OR "Bay Area" AND (economy OR business OR housing OR "real estate")',
  'sf-local': '"San Francisco" OR "Bay Area" OR SF OR BART OR "Golden Gate"',
};

/**
 * Track API usage to avoid hitting limits
 */
let dailyUsage = 0;
let usageResetDate = new Date().toDateString();

function checkAndResetUsage(): void {
  const today = new Date().toDateString();
  if (today !== usageResetDate) {
    dailyUsage = 0;
    usageResetDate = today;
  }
}

/**
 * Get remaining requests for today
 */
export function getRemainingRequests(): number {
  checkAndResetUsage();
  return Math.max(0, 100 - dailyUsage);
}

/**
 * Fetch articles from TheNewsAPI
 */
export async function fetchTheNewsAPIArticles(
  category: 'tech' | 'politics' | 'economy' | 'sf-local',
  limit: number = 10
): Promise<NewsArticle[]> {
  const apiKey = process.env.THENEWSAPI_KEY;
  
  if (!apiKey) {
    console.log('⚠️ THENEWSAPI_KEY not configured, skipping TheNewsAPI');
    return [];
  }
  
  checkAndResetUsage();
  
  if (dailyUsage >= 95) {
    console.log('⚠️ TheNewsAPI daily limit nearly reached, skipping');
    return [];
  }
  
  try {
    console.log(`📡 Fetching from TheNewsAPI for ${category}...`);
    
    const query = encodeURIComponent(CATEGORY_QUERIES[category]);
    const url = `https://api.thenewsapi.com/v1/news/all?api_token=${apiKey}&search=${query}&language=en&limit=${limit}`;
    
    const response = await fetch(url);
    dailyUsage++;
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`TheNewsAPI error: ${response.status} - ${errorText}`);
      return [];
    }
    
    const data: TheNewsAPIResponse = await response.json();
    
    const articles: NewsArticle[] = data.data.map(article => ({
      title: article.title,
      url: article.url,
      snippet: article.snippet || article.description || article.title,
      publishedDate: article.published_at,
      source: article.source || 'TheNewsAPI',
    }));
    
    console.log(`✓ Got ${articles.length} articles from TheNewsAPI for ${category}`);
    return articles;
  } catch (error) {
    console.error('Error fetching from TheNewsAPI:', error);
    return [];
  }
}

/**
 * Fetch articles for all categories
 */
export async function fetchAllTheNewsAPIArticles(): Promise<{
  tech: NewsArticle[];
  politics: NewsArticle[];
  economy: NewsArticle[];
  'sf-local': NewsArticle[];
}> {
  // Only fetch if we have enough requests remaining
  if (getRemainingRequests() < 4) {
    console.log('⚠️ TheNewsAPI: Not enough requests remaining');
    return { tech: [], politics: [], economy: [], 'sf-local': [] };
  }
  
  const [tech, politics, economy, sfLocal] = await Promise.all([
    fetchTheNewsAPIArticles('tech'),
    fetchTheNewsAPIArticles('politics'),
    fetchTheNewsAPIArticles('economy'),
    fetchTheNewsAPIArticles('sf-local'),
  ]);
  
  return { tech, politics, economy, 'sf-local': sfLocal };
}

/**
 * Check if TheNewsAPI is available
 */
export async function isTheNewsAPIAvailable(): Promise<boolean> {
  const apiKey = process.env.THENEWSAPI_KEY;
  if (!apiKey) return false;
  
  checkAndResetUsage();
  return dailyUsage < 95;
}
