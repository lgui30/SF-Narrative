/**
 * Reddit Client for SF-related subreddits
 * 
 * Fetches from r/sanfrancisco and r/bayarea
 * Rate limit: 60 requests per minute (without auth)
 */

import type { NewsArticle } from '../types';

interface RedditPost {
  data: {
    id: string;
    title: string;
    url: string;
    selftext: string;
    permalink: string;
    score: number;
    created_utc: number;
    num_comments: number;
    domain: string;
    is_self: boolean;
    link_flair_text?: string;
    subreddit: string;
  };
}

interface RedditResponse {
  data: {
    children: RedditPost[];
    after: string | null;
  };
}

const SUBREDDITS = [
  { name: 'sanfrancisco', minScore: 10 },
  { name: 'bayarea', minScore: 15 },
];

/**
 * Category keywords for Reddit posts
 */
const CATEGORY_KEYWORDS: Record<string, 'tech' | 'politics' | 'economy' | 'sf-local'> = {
  // Tech
  'tech': 'tech',
  'startup': 'tech',
  'ai': 'tech',
  'software': 'tech',
  'engineer': 'tech',
  'developer': 'tech',
  'google': 'tech',
  'meta': 'tech',
  'apple': 'tech',
  'openai': 'tech',
  'salesforce': 'tech',
  'twitter': 'tech',
  
  // Politics
  'mayor': 'politics',
  'election': 'politics',
  'vote': 'politics',
  'supervisor': 'politics',
  'breed': 'politics',
  'legislation': 'politics',
  'prop': 'politics',
  'ballot': 'politics',
  'city hall': 'politics',
  
  // Economy
  'rent': 'economy',
  'housing': 'economy',
  'apartment': 'economy',
  'lease': 'economy',
  'job': 'economy',
  'layoff': 'economy',
  'office': 'economy',
  'commercial': 'economy',
  'downtown': 'economy',
  'business': 'economy',
};

/**
 * Infer category from post content
 */
function inferCategory(title: string, selftext: string, flair?: string): 'tech' | 'politics' | 'economy' | 'sf-local' {
  const text = `${title} ${selftext} ${flair || ''}`.toLowerCase();
  
  // Check flair first
  if (flair) {
    const lowerFlair = flair.toLowerCase();
    if (lowerFlair.includes('tech') || lowerFlair.includes('job')) return 'tech';
    if (lowerFlair.includes('politic') || lowerFlair.includes('government')) return 'politics';
    if (lowerFlair.includes('housing') || lowerFlair.includes('rent')) return 'economy';
  }
  
  // Check keywords
  for (const [keyword, category] of Object.entries(CATEGORY_KEYWORDS)) {
    if (text.includes(keyword)) {
      return category;
    }
  }
  
  return 'sf-local';
}

/**
 * Fetch posts from a single subreddit
 */
async function fetchSubreddit(
  subreddit: string,
  minScore: number,
  limit: number = 25
): Promise<NewsArticle[]> {
  try {
    console.log(`📡 Fetching r/${subreddit}...`);
    
    const response = await fetch(
      `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`,
      {
        headers: {
          'User-Agent': 'SF-Narrative/1.0',
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`Reddit API error for r/${subreddit}: ${response.status}`);
      return [];
    }

    const data: RedditResponse = await response.json();
    
    const articles: NewsArticle[] = data.data.children
      .filter(post => {
        // Filter by score
        if (post.data.score < minScore) return false;
        // Skip stickied/pinned posts (usually rules)
        if (post.data.title.toLowerCase().includes('rule')) return false;
        // Skip weekly threads
        if (post.data.title.toLowerCase().includes('weekly') && 
            post.data.title.toLowerCase().includes('thread')) return false;
        return true;
      })
      .map(post => {
        const p = post.data;
        
        // Determine URL - use external link if not a self post
        const url = p.is_self 
          ? `https://reddit.com${p.permalink}`
          : p.url;
        
        // Create snippet from selftext or title
        const snippet = p.selftext
          ? p.selftext.substring(0, 300).replace(/\n/g, ' ').trim()
          : `Discussion on r/${p.subreddit} with ${p.num_comments} comments`;
        
        // Convert timestamp
        const publishedDate = new Date(p.created_utc * 1000).toISOString();
        
        return {
          title: p.title,
          url,
          snippet,
          publishedDate,
          source: `Reddit r/${p.subreddit}`,
          _category: inferCategory(p.title, p.selftext, p.link_flair_text),
          _score: p.score,
          _comments: p.num_comments,
        };
      });

    console.log(`✓ Got ${articles.length} posts from r/${subreddit}`);
    return articles;
  } catch (error) {
    console.error(`Error fetching r/${subreddit}:`, error);
    return [];
  }
}

/**
 * Fetch all Reddit articles grouped by category
 */
export async function fetchRedditArticles(): Promise<{
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

  // Fetch subreddits sequentially to respect rate limits
  for (const sub of SUBREDDITS) {
    const articles = await fetchSubreddit(sub.name, sub.minScore);
    
    for (const article of articles) {
      const category = (article as any)._category as 'tech' | 'politics' | 'economy' | 'sf-local';
      // Remove temporary fields
      const { _category, _score, _comments, ...cleanArticle } = article as any;
      results[category].push(cleanArticle);
    }
    
    // Small delay between subreddits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`📰 Reddit totals - Tech: ${results.tech.length}, Politics: ${results.politics.length}, Economy: ${results.economy.length}, SF-Local: ${results['sf-local'].length}`);
  
  return results;
}

/**
 * Fetch Reddit articles for a specific category
 */
export async function fetchRedditByCategory(
  category: 'tech' | 'politics' | 'economy' | 'sf-local'
): Promise<NewsArticle[]> {
  const all = await fetchRedditArticles();
  return all[category];
}

/**
 * Check if Reddit API is available
 */
export async function isRedditAvailable(): Promise<boolean> {
  try {
    const response = await fetch('https://www.reddit.com/r/sanfrancisco.json?limit=1', {
      headers: { 'User-Agent': 'SF-Narrative/1.0' },
    });
    return response.ok;
  } catch {
    return false;
  }
}
