#!/usr/bin/env npx tsx
/**
 * Activities Fetching Script
 * Fetches SF activities from multiple sources
 * Includes event categorization, deduplication, and caching
 *
 * Usage:
 *   npx tsx scripts/fetch-activities.ts
 *   npm run fetch-activities
 */

// Load environment variables from .env
import 'dotenv/config';

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import {
  Activity,
  ActivityCategory,
  ActivitiesCache,
  ActivitiesCacheStats,
} from '../lib/content-types';
import { fetchAllEventbriteEvents } from '../lib/sources/eventbrite';
import { fetchFuncheapEvents } from '../lib/sources/funcheap';
import { fetchMeetupEvents } from '../lib/sources/meetup';
import { fetchFirecrawlEvents } from '../lib/sources/firecrawl';

// ============================================
// Additional RSS Sources for Activities
// ============================================

interface RSSActivitySource {
  name: string;
  url: string;
  category: ActivityCategory;
  subcategory?: string;
}

const ADDITIONAL_SOURCES: RSSActivitySource[] = [
  {
    name: 'SF Rec & Parks',
    url: 'https://sfrecpark.org/feed/',
    category: 'outdoor',
  },
  {
    name: 'SF Public Library',
    url: 'https://sfpl.org/events/feed',
    category: 'free',
    subcategory: 'library',
  },
  {
    name: '19hz Events',
    url: 'https://19hz.info/eventlisting_BayArea.php?format=rss',
    category: 'nightlife',
    subcategory: 'electronic',
  },
  {
    name: 'KALW Events',
    url: 'https://www.kalw.org/events/feed',
    category: 'community',
  },
  {
    name: 'SF Funcheap Community',
    url: 'https://sf.funcheap.com/category/community/feed/',
    category: 'community',
  },
  {
    name: 'SF Funcheap Sports',
    url: 'https://sf.funcheap.com/category/sports-recreation/feed/',
    category: 'outdoor',
  },
  {
    name: 'SF Funcheap Kids & Family',
    url: 'https://sf.funcheap.com/category/kids-family/feed/',
    category: 'free',
    subcategory: 'family',
  },
  {
    name: 'SF Funcheap Markets',
    url: 'https://sf.funcheap.com/category/markets/feed/',
    category: 'food',
    subcategory: 'markets',
  },
  {
    name: 'DoTheBay RSS',
    url: 'https://dothebay.com/events.rss',
    category: 'events',
  },
  {
    name: 'SFGate Events',
    url: 'https://www.sfgate.com/rss/feed/Bay-Area-Events-702.php',
    category: 'events',
  },
];

// ============================================
// Helper Functions
// ============================================

/**
 * Parse RSS XML
 */
function parseRSSToActivities(
  xml: string,
  source: RSSActivitySource
): Activity[] {
  const activities: Activity[] = [];
  const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

  for (const itemXml of itemMatches) {
    const title = extractTag(itemXml, 'title');
    const link = extractTag(itemXml, 'link');
    const description = extractTag(itemXml, 'description');
    const pubDate = extractTag(itemXml, 'pubDate');

    if (!title || !link) continue;

    const id = `${source.name.toLowerCase().replace(/\s+/g, '-')}-${Buffer.from(link).toString('base64').slice(0, 20)}`;

    // Extract date from pubDate or try to parse from content
    const eventDate = pubDate
      ? new Date(pubDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    // Extract time if possible
    const timeMatch = description?.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)/i);
    let time: string | undefined;
    if (timeMatch) {
      let hour = parseInt(timeMatch[1]);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      if (timeMatch[3].toLowerCase() === 'pm' && hour !== 12) hour += 12;
      if (timeMatch[3].toLowerCase() === 'am' && hour === 12) hour = 0;
      time = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    // Detect if free
    const isFree =
      source.category === 'free' ||
      description?.toLowerCase().includes('free') ||
      title.toLowerCase().includes('free');

    activities.push({
      id,
      title: decodeHTMLEntities(title),
      description: stripHTML(decodeHTMLEntities(description || '')).slice(0, 500),
      category: source.category,
      subcategory: source.subcategory,
      date: eventDate,
      time,
      venue: 'See event page',
      price: {
        min: 0,
        max: isFree ? 0 : 50,
        isFree,
      },
      url: link,
      source: source.name,
      tags: isFree ? ['free'] : [],
      recurring: 'once',
    });
  }

  return activities;
}

/**
 * Extract tag from XML
 */
function extractTag(xml: string, tag: string): string {
  const cdataPattern = new RegExp(
    `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`,
    'i'
  );
  const cdataMatch = xml.match(cdataPattern);
  if (cdataMatch) return cdataMatch[1].trim();

  const pattern = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = xml.match(pattern);
  return match ? match[1].trim() : '';
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

/**
 * Fetch RSS feed
 */
async function fetchRSSActivities(
  source: RSSActivitySource
): Promise<Activity[]> {
  try {
    const response = await fetch(source.url, {
      headers: {
        'User-Agent': 'SF-Narrative/1.0 (activity aggregator)',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.log(`  ✗ ${source.name}: HTTP ${response.status}`);
      return [];
    }

    const xml = await response.text();
    const activities = parseRSSToActivities(xml, source);
    console.log(`  ✓ ${source.name}: ${activities.length} activities`);
    return activities;
  } catch (error) {
    console.log(`  ✗ ${source.name}: ${error}`);
    return [];
  }
}

/**
 * Deduplicate activities by title similarity
 */
function deduplicateActivities(activities: Activity[]): Activity[] {
  const seen = new Map<string, Activity>();

  for (const activity of activities) {
    // Normalize title for comparison
    const normalizedTitle = activity.title
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Create key from title + date
    const key = `${normalizedTitle.slice(0, 40)}_${activity.date}`;

    if (!seen.has(key)) {
      seen.set(key, activity);
    }
  }

  return Array.from(seen.values());
}

/**
 * Get activities happening this weekend
 */
function getWeekendActivities(activities: Activity[]): string[] {
  const now = new Date();
  const dayOfWeek = now.getDay();

  // Calculate next Saturday and Sunday
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
  const saturday = new Date(now);
  saturday.setDate(now.getDate() + daysUntilSaturday);
  saturday.setHours(0, 0, 0, 0);

  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);
  sunday.setHours(23, 59, 59, 999);

  // If today is Saturday or Sunday, include today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return activities
      .filter((a) => {
        const activityDate = new Date(a.date);
        return activityDate >= today && activityDate <= sunday;
      })
      .map((a) => a.id);
  }

  return activities
    .filter((a) => {
      const activityDate = new Date(a.date);
      return activityDate >= saturday && activityDate <= sunday;
    })
    .map((a) => a.id);
}

/**
 * Get free activities today
 */
function getFreeToday(activities: Activity[]): string[] {
  const today = new Date().toISOString().split('T')[0];

  return activities
    .filter((a) => a.date === today && a.price.isFree)
    .map((a) => a.id);
}

/**
 * Get featured activities (high quality events)
 */
function getFeaturedActivities(activities: Activity[]): string[] {
  // Featured = upcoming, has description, has venue details
  const now = new Date();
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return activities
    .filter((a) => {
      const activityDate = new Date(a.date);
      return (
        activityDate >= now &&
        activityDate <= oneWeekFromNow &&
        a.description.length > 100 &&
        a.venue !== 'See event page' &&
        a.venue !== 'TBA'
      );
    })
    .slice(0, 20)
    .map((a) => a.id);
}

// ============================================
// Main Script
// ============================================

async function main() {
  console.log('Starting activities fetch...');
  const startTime = Date.now();

  const allActivities: Activity[] = [];
  const errors: string[] = [];

  // 1. Fetch from Eventbrite
  console.log('\n1. Fetching from Eventbrite...');
  const eventbriteResult = await fetchAllEventbriteEvents({ maxPages: 5 });
  allActivities.push(...eventbriteResult.activities);
  if (eventbriteResult.errors.length > 0) {
    errors.push(...eventbriteResult.errors);
  }

  // 2. Fetch from Funcheap SF
  console.log('\n2. Fetching from Funcheap SF...');
  const funcheapResult = await fetchFuncheapEvents();
  allActivities.push(...funcheapResult.activities);
  if (funcheapResult.errors.length > 0) {
    errors.push(...funcheapResult.errors);
  }

  // 3. Fetch from Meetup
  console.log('\n3. Fetching from Meetup...');
  const meetupResult = await fetchMeetupEvents();
  allActivities.push(...meetupResult.activities);
  if (meetupResult.error) {
    errors.push(meetupResult.error);
  }

  // 4. Fetch from additional RSS sources
  console.log('\n4. Fetching from additional RSS sources...');
  for (const source of ADDITIONAL_SOURCES) {
    const activities = await fetchRSSActivities(source);
    allActivities.push(...activities);
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  // 5. Fetch from Firecrawl (web scraping)
  console.log('\n5. Fetching from Firecrawl (web scraping)...');
  const firecrawlResult = await fetchFirecrawlEvents();
  allActivities.push(...firecrawlResult.activities);
  errors.push(...firecrawlResult.errors);

  // Deduplicate
  console.log(`\nDeduplicating ${allActivities.length} activities...`);
  const dedupedActivities = deduplicateActivities(allActivities);
  console.log(`After dedup: ${dedupedActivities.length} activities`);

  // Geocode activities missing coordinates
  console.log('\nGeocoding activities...');
  const { geocodeActivity } = await import('../lib/geocode');
  let geocoded = 0;
  for (const activity of dedupedActivities) {
    if (!activity.coordinates) {
      const coords = geocodeActivity(activity);
      if (coords) {
        activity.coordinates = coords;
        geocoded++;
      }
    }
  }
  console.log(`Geocoded ${geocoded} activities`);

  // Filter to next 60 days (expanded to capture more events)
  const now = new Date();
  const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  const upcomingActivities = dedupedActivities.filter((a) => {
    const activityDate = new Date(a.date);
    return activityDate >= now && activityDate <= sixtyDaysFromNow;
  });

  console.log(`After date filter (60 days): ${upcomingActivities.length} activities`);

  // Sort by date
  upcomingActivities.sort((a, b) => a.date.localeCompare(b.date));

  // Build indexes
  const byNeighborhood: Record<string, string[]> = {};
  const byCategory: Record<ActivityCategory, number> = {
    events: 0,
    outdoor: 0,
    food: 0,
    community: 0,
    nightlife: 0,
    free: 0,
  };

  for (const activity of upcomingActivities) {
    // Index by neighborhood
    if (activity.neighborhood) {
      if (!byNeighborhood[activity.neighborhood]) {
        byNeighborhood[activity.neighborhood] = [];
      }
      byNeighborhood[activity.neighborhood].push(activity.id);
    }

    // Count by category
    byCategory[activity.category]++;
  }

  // Build special lists
  const featured = getFeaturedActivities(upcomingActivities);
  const thisWeekend = getWeekendActivities(upcomingActivities);
  const freeToday = getFreeToday(upcomingActivities);

  // Build cache stats
  const stats: ActivitiesCacheStats = {
    totalActivities: upcomingActivities.length,
    byCategory,
  };

  // Build cache object
  const cache: ActivitiesCache = {
    lastUpdated: new Date().toISOString(),
    stats,
    items: upcomingActivities,
    featured,
    thisWeekend,
    freeToday,
    byNeighborhood,
  };

  // Write cache file
  const dataDir = join(process.cwd(), 'data');
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  const cachePath = join(dataDir, 'activities-cache.json');
  writeFileSync(cachePath, JSON.stringify(cache, null, 2));

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n=== Activities Fetch Complete ===');
  console.log(`Duration: ${duration}s`);
  console.log(`Total activities: ${upcomingActivities.length}`);
  console.log('\nBy category:');
  for (const [category, count] of Object.entries(byCategory)) {
    console.log(`  ${category}: ${count}`);
  }
  console.log(`\nFeatured: ${featured.length}`);
  console.log(`This weekend: ${thisWeekend.length}`);
  console.log(`Free today: ${freeToday.length}`);
  console.log(`Cache written to: ${cachePath}`);

  if (errors.length > 0) {
    console.log(`\nErrors (${errors.length}):`);
    errors.forEach((e) => console.log(`  - ${e}`));
  }
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
