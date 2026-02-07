/**
 * Funcheap SF RSS Parser
 * Fetches free and cheap events from SF Funcheap RSS feed
 * No API key required
 */

import { Activity, ActivityCategory, PriceInfo } from '../content-types';

interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  category?: string | string[];
  'content:encoded'?: string;
}

// Funcheap RSS feeds
const FUNCHEAP_FEEDS = [
  {
    url: 'https://sf.funcheap.com/feed/',
    name: 'SF Funcheap Main',
    category: 'free' as ActivityCategory,
  },
  {
    url: 'https://sf.funcheap.com/category/free/feed/',
    name: 'SF Funcheap Free Events',
    category: 'free' as ActivityCategory,
  },
  {
    url: 'https://sf.funcheap.com/category/arts-culture/feed/',
    name: 'SF Funcheap Arts & Culture',
    category: 'events' as ActivityCategory,
  },
  {
    url: 'https://sf.funcheap.com/category/food-drink/feed/',
    name: 'SF Funcheap Food & Drink',
    category: 'food' as ActivityCategory,
  },
  {
    url: 'https://sf.funcheap.com/category/nightlife/feed/',
    name: 'SF Funcheap Nightlife',
    category: 'nightlife' as ActivityCategory,
  },
  {
    url: 'https://sf.funcheap.com/category/outdoor/feed/',
    name: 'SF Funcheap Outdoor',
    category: 'outdoor' as ActivityCategory,
  },
];

// Neighborhood detection patterns
const NEIGHBORHOOD_PATTERNS: Record<string, RegExp> = {
  'Mission': /\b(mission|valencia|16th st|24th st)\b/i,
  'Castro/Upper Market': /\b(castro|upper market)\b/i,
  'SoMa': /\b(soma|south of market|moscone|yerba buena)\b/i,
  'Financial District': /\b(financial district|fidi|embarcadero)\b/i,
  'Chinatown': /\b(chinatown)\b/i,
  'North Beach': /\b(north beach|columbus)\b/i,
  'Marina': /\b(marina|fort mason|chestnut st)\b/i,
  'Hayes Valley': /\b(hayes valley|civic center|city hall)\b/i,
  'Haight-Ashbury': /\b(haight|ashbury|upper haight|lower haight)\b/i,
  'Noe Valley': /\b(noe valley)\b/i,
  'Pacific Heights': /\b(pacific heights|pac heights|fillmore)\b/i,
  'Potrero Hill': /\b(potrero)\b/i,
  'Dogpatch': /\b(dogpatch)\b/i,
  'Golden Gate Park': /\b(golden gate park|ggp|de young|academy of sciences)\b/i,
  'Presidio': /\b(presidio)\b/i,
  'Fisherman\'s Wharf': /\b(fisherman|pier 39|ghirardelli)\b/i,
  'Union Square': /\b(union square|powell)\b/i,
};

/**
 * Parse RSS XML to JSON
 * Simple XML parser for RSS feeds
 */
function parseRSSXML(xml: string): RSSItem[] {
  const items: RSSItem[] = [];

  // Extract items using regex (simple parser)
  const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

  for (const itemXml of itemMatches) {
    const item: RSSItem = {
      title: extractTag(itemXml, 'title'),
      link: extractTag(itemXml, 'link'),
      description: extractTag(itemXml, 'description'),
      pubDate: extractTag(itemXml, 'pubDate'),
      'content:encoded': extractTag(itemXml, 'content:encoded'),
    };

    // Extract categories
    const categoryMatches = itemXml.match(/<category[^>]*>([^<]+)<\/category>/g);
    if (categoryMatches) {
      item.category = categoryMatches.map((m) =>
        m.replace(/<\/?category[^>]*>/g, '')
      );
    }

    if (item.title && item.link) {
      items.push(item);
    }
  }

  return items;
}

/**
 * Extract content from XML tag
 */
function extractTag(xml: string, tag: string): string {
  // Handle CDATA sections
  const cdataPattern = new RegExp(
    `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`,
    'i'
  );
  const cdataMatch = xml.match(cdataPattern);
  if (cdataMatch) {
    return cdataMatch[1].trim();
  }

  // Handle regular tags
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
    '&#8211;': '–',
    '&#8212;': '—',
    '&#8217;': "'",
    '&#8220;': '"',
    '&#8221;': '"',
  };

  let result = text;
  for (const [entity, char] of Object.entries(entities)) {
    result = result.replace(new RegExp(entity, 'g'), char);
  }

  // Handle numeric entities
  result = result.replace(/&#(\d+);/g, (_, code) =>
    String.fromCharCode(parseInt(code))
  );

  return result;
}

/**
 * Strip HTML tags from string
 */
function stripHTML(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detect neighborhood from text
 */
function detectNeighborhood(text: string): string | undefined {
  for (const [neighborhood, pattern] of Object.entries(NEIGHBORHOOD_PATTERNS)) {
    if (pattern.test(text)) {
      return neighborhood;
    }
  }
  return undefined;
}

/**
 * Extract date from title or content
 * Funcheap titles often include dates like "January 15" or "1/15"
 */
function extractEventDate(item: RSSItem): string {
  const text = `${item.title} ${item.description}`;

  // Try to match common date formats
  const patterns = [
    // "January 15, 2026" or "Jan 15 2026"
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:,?\s*(\d{4}))?\b/i,
    // "1/15/2026" or "1/15"
    /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/,
  ];

  const monthNames: Record<string, number> = {
    january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  };

  // Try full month name pattern
  const fullMatch = text.match(patterns[0]);
  if (fullMatch) {
    const month = monthNames[fullMatch[1].toLowerCase()];
    const day = parseInt(fullMatch[2]);
    const year = fullMatch[3] ? parseInt(fullMatch[3]) : new Date().getFullYear();
    const date = new Date(year, month, day);
    return date.toISOString().split('T')[0];
  }

  // Try numeric pattern
  const numMatch = text.match(patterns[1]);
  if (numMatch) {
    const month = parseInt(numMatch[1]) - 1;
    const day = parseInt(numMatch[2]);
    let year = numMatch[3] ? parseInt(numMatch[3]) : new Date().getFullYear();
    if (year < 100) year += 2000;
    const date = new Date(year, month, day);
    return date.toISOString().split('T')[0];
  }

  // Fall back to publication date
  return new Date(item.pubDate).toISOString().split('T')[0];
}

/**
 * Extract time from text
 */
function extractTime(text: string): string | undefined {
  // Match times like "7pm", "7:30pm", "7:30 PM", "19:00"
  const patterns = [
    /\b(\d{1,2}):?(\d{2})?\s*(am|pm)\b/i,
    /\b(\d{2}):(\d{2})\b/,
  ];

  const match = text.match(patterns[0]);
  if (match) {
    let hour = parseInt(match[1]);
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const isPM = match[3].toLowerCase() === 'pm';

    if (isPM && hour !== 12) hour += 12;
    if (!isPM && hour === 12) hour = 0;

    return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  const match24 = text.match(patterns[1]);
  if (match24) {
    return `${match24[1]}:${match24[2]}`;
  }

  return undefined;
}

/**
 * Extract venue from text
 */
function extractVenue(text: string): string {
  // Common venue indicators
  const venuePatterns = [
    /(?:at|@)\s+([^,.\n]+)/i,
    /(?:location|venue):\s*([^,.\n]+)/i,
  ];

  for (const pattern of venuePatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return 'San Francisco';
}

/**
 * Determine if event is free based on title/description
 */
function determinePriceInfo(item: RSSItem): PriceInfo {
  const text = `${item.title} ${item.description}`.toLowerCase();

  if (text.includes('free') || text.includes('$0') || text.includes('no cover')) {
    return { min: 0, max: 0, isFree: true };
  }

  // Try to extract price
  const priceMatch = text.match(/\$(\d+(?:\.\d{2})?)/);
  if (priceMatch) {
    const price = parseFloat(priceMatch[1]);
    return { min: price, max: price, isFree: false };
  }

  // Funcheap focuses on cheap events, assume low cost
  return { min: 0, max: 20, isFree: false };
}

/**
 * Generate tags from categories and content
 */
function generateTags(item: RSSItem): string[] {
  const tags: string[] = [];
  const text = `${item.title} ${item.description}`.toLowerCase();

  // Add category-based tags
  if (item.category) {
    const categories = Array.isArray(item.category) ? item.category : [item.category];
    for (const cat of categories) {
      const lowerCat = cat.toLowerCase();
      if (lowerCat.includes('free')) tags.push('free');
      if (lowerCat.includes('art')) tags.push('arts');
      if (lowerCat.includes('music')) tags.push('music');
      if (lowerCat.includes('food')) tags.push('food');
      if (lowerCat.includes('outdoor')) tags.push('outdoor');
      if (lowerCat.includes('nightlife')) tags.push('nightlife');
      if (lowerCat.includes('film')) tags.push('film');
      if (lowerCat.includes('comedy')) tags.push('comedy');
    }
  }

  // Content-based tags
  if (text.includes('21+') || text.includes('21 and over')) tags.push('21+');
  if (text.includes('family') || text.includes('kids')) tags.push('family-friendly');
  if (text.includes('workshop')) tags.push('workshop');
  if (text.includes('class')) tags.push('class');
  if (text.includes('happy hour')) tags.push('happy-hour');
  if (text.includes('brunch')) tags.push('brunch');
  if (text.includes('live music')) tags.push('live-music');
  if (text.includes('dance')) tags.push('dance');
  if (text.includes('trivia')) tags.push('trivia');
  if (text.includes('open mic')) tags.push('open-mic');

  return [...new Set(tags)];
}

/**
 * Convert RSS item to Activity
 */
function itemToActivity(item: RSSItem, defaultCategory: ActivityCategory): Activity {
  const text = `${item.title} ${item.description}`;
  const description = item['content:encoded']
    ? stripHTML(item['content:encoded']).slice(0, 500)
    : stripHTML(item.description).slice(0, 500);

  // Generate a unique ID from URL + title using hash
  const idBase = `${item.link}|${item.title}`;
  let hash = 5381;
  for (let i = 0; i < idBase.length; i++) {
    hash = ((hash << 5) + hash) ^ idBase.charCodeAt(i);
  }
  const id = `funcheap-${(hash >>> 0).toString(36)}`;

  return {
    id,
    title: item.title,
    description,
    category: defaultCategory,
    date: extractEventDate(item),
    time: extractTime(text),
    venue: extractVenue(text),
    neighborhood: detectNeighborhood(text),
    price: determinePriceInfo(item),
    url: item.link,
    source: 'SF Funcheap',
    tags: generateTags(item),
    recurring: 'once',
  };
}

/**
 * Fetch RSS feed
 */
async function fetchRSSFeed(url: string): Promise<RSSItem[]> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SF-Narrative/1.0 (news aggregator)',
      },
    });

    if (!response.ok) {
      throw new Error(`RSS fetch failed: ${response.status}`);
    }

    const xml = await response.text();
    return parseRSSXML(xml);
  } catch (error) {
    console.error(`Error fetching RSS from ${url}:`, error);
    return [];
  }
}

/**
 * Fetch all Funcheap events
 */
export async function fetchFuncheapEvents(): Promise<{
  activities: Activity[];
  errors: string[];
}> {
  const allActivities: Activity[] = [];
  const errors: string[] = [];
  const seenUrls = new Set<string>();

  for (const feed of FUNCHEAP_FEEDS) {
    try {
      const items = await fetchRSSFeed(feed.url);

      for (const item of items) {
        // Dedupe by URL
        if (seenUrls.has(item.link)) continue;
        seenUrls.add(item.link);

        const activity = itemToActivity(item, feed.category);
        allActivities.push(activity);
      }

      console.log(`Fetched ${items.length} items from ${feed.name}`);

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      const errMsg = `Failed to fetch ${feed.name}: ${error}`;
      console.error(errMsg);
      errors.push(errMsg);
    }
  }

  // Sort by date (soonest first)
  allActivities.sort((a, b) => a.date.localeCompare(b.date));

  console.log(`Total Funcheap activities: ${allActivities.length}`);

  return { activities: allActivities, errors };
}

/**
 * Fetch a single Funcheap feed
 */
export async function fetchFuncheapFeed(
  feedUrl: string,
  category: ActivityCategory = 'free'
): Promise<Activity[]> {
  const items = await fetchRSSFeed(feedUrl);
  return items.map((item) => itemToActivity(item, category));
}
