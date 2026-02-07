/**
 * Reddit JSON API Fetcher
 * Fetches posts from r/sanfrancisco and r/bayarea using Reddit's public JSON API
 * No authentication required for read-only access
 */

import { EnhancedNewsArticle, SF_NEIGHBORHOODS, ALERT_KEYWORDS } from '../content-types';

interface RedditPost {
  data: {
    id: string;
    title: string;
    selftext: string;
    url: string;
    permalink: string;
    created_utc: number;
    subreddit: string;
    score: number;
    num_comments: number;
    link_flair_text?: string;
    is_self: boolean;
    domain: string;
  };
}

interface RedditResponse {
  data: {
    children: RedditPost[];
    after: string | null;
  };
}

const USER_AGENT = 'SF-Narrative/1.0 (news aggregator)';

// Subreddits to fetch from
const SF_SUBREDDITS = [
  { name: 'sanfrancisco', priority: 8 },
  { name: 'bayarea', priority: 7 },
  { name: 'SFBayJobs', priority: 6 },
  { name: 'AskSF', priority: 6 },
];

/**
 * Fetch posts from a specific subreddit
 */
async function fetchSubreddit(
  subreddit: string,
  sort: 'hot' | 'new' | 'top' = 'hot',
  limit: number = 25,
  timeframe: 'hour' | 'day' | 'week' = 'day'
): Promise<RedditPost[]> {
  const url = sort === 'top'
    ? `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}&t=${timeframe}`
    : `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
      },
    });

    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status}`);
    }

    const data: RedditResponse = await response.json();
    return data.data.children;
  } catch (error) {
    console.error(`Error fetching r/${subreddit}:`, error);
    return [];
  }
}

/**
 * Extract neighborhoods mentioned in text
 */
function extractNeighborhoods(text: string): string[] {
  const lowerText = text.toLowerCase();
  const found: string[] = [];

  for (const neighborhood of SF_NEIGHBORHOODS) {
    const lowerNeighborhood = neighborhood.toLowerCase();
    // Check for exact match or partial match
    if (lowerText.includes(lowerNeighborhood)) {
      found.push(neighborhood);
    }
  }

  // Additional neighborhood aliases
  const aliases: Record<string, string> = {
    'tenderloin': 'Civic Center/Tenderloin',
    'tl': 'Civic Center/Tenderloin',
    'the castro': 'Castro/Upper Market',
    'fidi': 'Financial District',
    'north beach': 'North Beach',
    'the mission': 'Mission',
    'outer richmond': 'Outer Richmond',
    'inner richmond': 'Inner Richmond',
    'outer sunset': 'Outer Sunset',
    'inner sunset': 'Inner Sunset',
    'pac heights': 'Pacific Heights',
    'russian hill': 'Russian Hill',
    'gg park': 'Golden Gate Park',
    'golden gate park': 'Golden Gate Park',
    'hunters point': 'Bayview/Hunters Point',
    'bayview': 'Bayview/Hunters Point',
    'dogpatch': 'Dogpatch',
    'soma': 'SoMa',
    'south of market': 'SoMa',
  };

  for (const [alias, neighborhood] of Object.entries(aliases)) {
    if (lowerText.includes(alias) && !found.includes(neighborhood)) {
      found.push(neighborhood);
    }
  }

  return [...new Set(found)];
}

/**
 * Check for alert keywords in text
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
 * Convert Reddit post to EnhancedNewsArticle
 */
function postToArticle(post: RedditPost, priority: number): EnhancedNewsArticle {
  const { data } = post;
  const combinedText = `${data.title} ${data.selftext}`;
  const neighborhoods = extractNeighborhoods(combinedText);
  const alertInfo = checkForAlerts(combinedText);

  // Use permalink for self posts, external URL otherwise
  const articleUrl = data.is_self
    ? `https://www.reddit.com${data.permalink}`
    : data.url;

  // Create snippet from selftext or title
  const snippet = data.selftext
    ? data.selftext.slice(0, 200) + (data.selftext.length > 200 ? '...' : '')
    : data.title;

  return {
    id: `reddit-${data.id}`,
    title: data.title,
    url: articleUrl,
    snippet,
    publishedDate: new Date(data.created_utc * 1000).toISOString(),
    source: `Reddit r/${data.subreddit}`,
    sourceType: 'community',
    priority,
    hasAlert: alertInfo.hasAlert,
    alertKeywords: alertInfo.keywords.length > 0 ? alertInfo.keywords : undefined,
    neighborhoods: neighborhoods.length > 0 ? neighborhoods : undefined,
    sentiment: undefined, // Could add sentiment analysis later
  };
}

/**
 * Determine article category based on flair and content
 */
function categorizePost(post: RedditPost): string {
  const { data } = post;
  const flair = (data.link_flair_text || '').toLowerCase();
  const title = data.title.toLowerCase();
  const text = data.selftext.toLowerCase();
  const combinedText = `${flair} ${title} ${text}`;

  // Tech keywords
  if (
    combinedText.includes('tech') ||
    combinedText.includes('startup') ||
    combinedText.includes('software') ||
    combinedText.includes('ai ') ||
    combinedText.includes('layoff')
  ) {
    return 'tech';
  }

  // Politics keywords
  if (
    combinedText.includes('mayor') ||
    combinedText.includes('city hall') ||
    combinedText.includes('board of supervisors') ||
    combinedText.includes('vote') ||
    combinedText.includes('election') ||
    combinedText.includes('proposition') ||
    combinedText.includes('politics')
  ) {
    return 'politics';
  }

  // Economy keywords
  if (
    combinedText.includes('housing') ||
    combinedText.includes('rent') ||
    combinedText.includes('economy') ||
    combinedText.includes('job') ||
    combinedText.includes('business') ||
    combinedText.includes('market')
  ) {
    return 'economy';
  }

  // Default to sf-local
  return 'sf-local';
}

/**
 * Filter out low-quality posts
 */
function filterQualityPosts(posts: RedditPost[]): RedditPost[] {
  return posts.filter((post) => {
    const { data } = post;

    // Minimum engagement threshold
    if (data.score < 5) return false;

    // Skip very short titles
    if (data.title.length < 10) return false;

    // Skip questions/askSF style posts for news
    const title = data.title.toLowerCase();
    if (
      title.startsWith('where') ||
      title.startsWith('how do i') ||
      title.startsWith('what is the best')
    ) {
      return false;
    }

    return true;
  });
}

/**
 * Fetch all Reddit news from SF-related subreddits
 */
export async function fetchRedditNews(): Promise<{
  articles: EnhancedNewsArticle[];
  byCategory: Record<string, EnhancedNewsArticle[]>;
  errors: string[];
}> {
  const allArticles: EnhancedNewsArticle[] = [];
  const byCategory: Record<string, EnhancedNewsArticle[]> = {
    tech: [],
    politics: [],
    economy: [],
    'sf-local': [],
  };
  const errors: string[] = [];

  // Add delay between subreddit fetches to respect rate limits
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  for (const sub of SF_SUBREDDITS) {
    try {
      // Fetch hot posts
      const hotPosts = await fetchSubreddit(sub.name, 'hot', 25);
      await delay(1000); // 1 second delay

      // Fetch top posts from last day
      const topPosts = await fetchSubreddit(sub.name, 'top', 15, 'day');
      await delay(1000);

      // Combine and dedupe by ID
      const allPosts = [...hotPosts, ...topPosts];
      const seenIds = new Set<string>();
      const uniquePosts = allPosts.filter((post) => {
        if (seenIds.has(post.data.id)) return false;
        seenIds.add(post.data.id);
        return true;
      });

      // Filter quality posts
      const qualityPosts = filterQualityPosts(uniquePosts);

      // Convert to articles
      for (const post of qualityPosts) {
        const article = postToArticle(post, sub.priority);
        const category = categorizePost(post);

        allArticles.push(article);

        if (byCategory[category]) {
          byCategory[category].push(article);
        }
      }

      console.log(`Fetched ${qualityPosts.length} posts from r/${sub.name}`);
    } catch (error) {
      const errMsg = `Failed to fetch r/${sub.name}: ${error}`;
      console.error(errMsg);
      errors.push(errMsg);
    }
  }

  // Sort by date (newest first)
  allArticles.sort(
    (a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime()
  );

  return { articles: allArticles, byCategory, errors };
}

/**
 * Fetch Reddit posts for a specific subreddit (direct export)
 */
export async function fetchFromSubreddit(
  subreddit: string,
  options: {
    sort?: 'hot' | 'new' | 'top';
    limit?: number;
    timeframe?: 'hour' | 'day' | 'week';
  } = {}
): Promise<EnhancedNewsArticle[]> {
  const { sort = 'hot', limit = 25, timeframe = 'day' } = options;

  const posts = await fetchSubreddit(subreddit, sort, limit, timeframe);
  const qualityPosts = filterQualityPosts(posts);

  return qualityPosts.map((post) => postToArticle(post, 7));
}
