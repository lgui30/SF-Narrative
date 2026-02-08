/**
 * Hacker News Client
 * 
 * Fetches top stories and filters for SF/Bay Area relevance
 * No rate limiting on the Firebase API
 */

import type { NewsArticle } from '../types';

interface HNStory {
  id: number;
  title: string;
  url?: string;
  text?: string;
  score: number;
  time: number;
  by: string;
  descendants: number; // comment count
  type: string;
}

/**
 * SF/Bay Area relevance keywords
 */
const SF_KEYWORDS = [
  'san francisco',
  'sf',
  'bay area',
  'silicon valley',
  'oakland',
  'berkeley',
  'palo alto',
  'mountain view',
  'cupertino',
  'menlo park',
  'south bay',
  'east bay',
  'marin',
  'soma',
  'mission',
  'tenderloin',
  'bart',
  'caltrain',
  'golden gate',
  'sfchronicle',
  'sfstandard',
  'sfgate',
  'mission local',
];

/**
 * Tech company keywords (HQ in SF/Bay Area)
 */
const TECH_COMPANY_KEYWORDS = [
  'openai',
  'anthropic',
  'google',
  'apple',
  'meta',
  'facebook',
  'salesforce',
  'uber',
  'lyft',
  'airbnb',
  'stripe',
  'coinbase',
  'twitter',
  'x.com',
  'dropbox',
  'slack',
  'figma',
  'notion',
  'vercel',
  'supabase',
  'retool',
  'rippling',
  'instacart',
  'doordash',
];

/**
 * Check if a story is SF-relevant
 */
function isSFRelevant(story: HNStory): boolean {
  const text = `${story.title} ${story.url || ''} ${story.text || ''}`.toLowerCase();
  
  // Check SF keywords
  for (const keyword of SF_KEYWORDS) {
    if (text.includes(keyword)) {
      return true;
    }
  }
  
  // Check Bay Area tech companies
  for (const company of TECH_COMPANY_KEYWORDS) {
    if (text.includes(company)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Calculate relevance score for ranking
 */
function calculateRelevance(story: HNStory): number {
  let score = 0;
  const text = `${story.title} ${story.url || ''}`.toLowerCase();
  
  // Direct SF mentions get highest score
  if (text.includes('san francisco')) score += 20;
  if (text.includes('bay area')) score += 15;
  if (text.includes('sf ') || text.includes(' sf')) score += 10;
  
  // Neighborhood mentions
  const neighborhoods = ['mission', 'soma', 'tenderloin', 'castro', 'haight', 'marina', 'noe valley'];
  for (const n of neighborhoods) {
    if (text.includes(n)) score += 5;
  }
  
  // Tech companies (slightly lower - could be about any office)
  for (const company of TECH_COMPANY_KEYWORDS) {
    if (text.includes(company)) {
      score += 3;
      break; // Only count once
    }
  }
  
  // HN score bonus (popular stories are more newsworthy)
  score += Math.min(story.score / 50, 10);
  
  return score;
}

/**
 * Fetch a single story by ID
 */
async function fetchStory(id: number): Promise<HNStory | null> {
  try {
    const response = await fetch(
      `https://hacker-news.firebaseio.com/v0/item/${id}.json`
    );
    
    if (!response.ok) return null;
    
    const story = await response.json();
    
    // Only return stories (not comments, jobs, polls)
    if (story?.type !== 'story') return null;
    
    return story;
  } catch {
    return null;
  }
}

/**
 * Fetch top stories and filter for SF relevance
 */
export async function fetchHackerNewsArticles(): Promise<NewsArticle[]> {
  try {
    console.log('📡 Fetching Hacker News top stories...');
    
    // Get top story IDs
    const response = await fetch(
      'https://hacker-news.firebaseio.com/v0/topstories.json'
    );
    
    if (!response.ok) {
      console.error(`HN API error: ${response.status}`);
      return [];
    }
    
    const storyIds: number[] = await response.json();
    
    // Fetch first 100 stories in batches
    const topIds = storyIds.slice(0, 100);
    const batchSize = 20;
    const stories: HNStory[] = [];
    
    for (let i = 0; i < topIds.length; i += batchSize) {
      const batch = topIds.slice(i, i + batchSize);
      const results = await Promise.all(batch.map(fetchStory));
      stories.push(...results.filter((s): s is HNStory => s !== null));
    }
    
    console.log(`✓ Fetched ${stories.length} HN stories`);
    
    // Filter for SF relevance
    const sfRelevant = stories.filter(isSFRelevant);
    console.log(`✓ Found ${sfRelevant.length} SF-relevant stories`);
    
    // Sort by relevance
    sfRelevant.sort((a, b) => calculateRelevance(b) - calculateRelevance(a));
    
    // Convert to NewsArticle format
    const articles: NewsArticle[] = sfRelevant
      .slice(0, 15) // Take top 15 relevant stories
      .map(story => ({
        title: story.title,
        url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
        snippet: story.text
          ? story.text.replace(/<[^>]*>/g, '').substring(0, 300)
          : `Hacker News discussion with ${story.descendants || 0} comments and ${story.score} points`,
        publishedDate: new Date(story.time * 1000).toISOString(),
        source: 'Hacker News',
      }));
    
    return articles;
  } catch (error) {
    console.error('Error fetching Hacker News:', error);
    return [];
  }
}

/**
 * Fetch HN articles by category (all go to 'tech' for now)
 */
export async function fetchHNByCategory(
  category: 'tech' | 'politics' | 'economy' | 'sf-local'
): Promise<NewsArticle[]> {
  // HN is primarily tech content
  if (category !== 'tech') return [];
  return fetchHackerNewsArticles();
}

/**
 * Check if HN API is available
 */
export async function isHNAvailable(): Promise<boolean> {
  try {
    const response = await fetch(
      'https://hacker-news.firebaseio.com/v0/topstories.json'
    );
    return response.ok;
  } catch {
    return false;
  }
}
