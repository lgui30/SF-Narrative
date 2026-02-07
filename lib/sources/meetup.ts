/**
 * Meetup API Integration
 * Fetches events from Meetup for San Francisco area
 * Uses Meetup's GraphQL API (requires OAuth or API key)
 * Falls back to RSS feeds if API not available
 */

import { Activity, ActivityCategory, PriceInfo } from '../content-types';

interface MeetupEvent {
  id: string;
  title: string;
  description: string;
  dateTime: string;
  endTime?: string;
  duration: number; // in milliseconds
  eventUrl: string;
  venue?: {
    name: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    lat: number;
    lon: number;
  };
  group: {
    name: string;
    urlname: string;
  };
  fee?: {
    amount: number;
    currency: string;
  };
  going: number;
  images?: { baseUrl: string }[];
}

interface MeetupGraphQLResponse {
  data: {
    rankedEvents: {
      edges: Array<{
        node: MeetupEvent;
      }>;
    };
  };
  errors?: Array<{ message: string }>;
}

// Meetup group category to our category mapping
const MEETUP_CATEGORY_MAP: Record<string, ActivityCategory> = {
  'tech': 'community',
  'career-business': 'community',
  'social-activities': 'community',
  'outdoors-adventure': 'outdoor',
  'sports-fitness': 'outdoor',
  'health-wellbeing': 'community',
  'learning': 'community',
  'food-drink': 'food',
  'arts-culture': 'events',
  'music': 'nightlife',
  'photography': 'community',
  'games': 'community',
  'book-clubs': 'community',
  'language': 'community',
  'movements-politics': 'community',
  'lgbtq': 'community',
  'parents-family': 'community',
  'pets-animals': 'community',
  'religion-spirituality': 'community',
  'sci-fi-fantasy': 'community',
  'singles': 'community',
  'writing': 'community',
};

// Neighborhood detection patterns
const NEIGHBORHOOD_PATTERNS: Record<string, RegExp> = {
  'Mission': /\b(mission|valencia|16th st|24th st)\b/i,
  'Castro/Upper Market': /\b(castro|upper market)\b/i,
  'SoMa': /\b(soma|south of market|moscone|yerba buena)\b/i,
  'Financial District': /\b(financial district|fidi|embarcadero|montgomery)\b/i,
  'Chinatown': /\b(chinatown)\b/i,
  'North Beach': /\b(north beach|columbus)\b/i,
  'Marina': /\b(marina|fort mason|chestnut)\b/i,
  'Hayes Valley': /\b(hayes valley|civic center)\b/i,
  'Haight-Ashbury': /\b(haight|ashbury)\b/i,
  'Noe Valley': /\b(noe valley)\b/i,
  'Pacific Heights': /\b(pacific heights|pac heights|fillmore)\b/i,
  'Potrero Hill': /\b(potrero)\b/i,
  'Dogpatch': /\b(dogpatch)\b/i,
  'Golden Gate Park': /\b(golden gate park|ggp)\b/i,
  'Presidio': /\b(presidio|crissy field)\b/i,
};

/**
 * GraphQL query for Meetup events
 */
const MEETUP_EVENTS_QUERY = `
  query($lat: Float!, $lon: Float!, $startDateRange: DateTime!, $endDateRange: DateTime!) {
    rankedEvents(
      filter: {
        lat: $lat
        lon: $lon
        radius: 10
        startDateRange: $startDateRange
        endDateRange: $endDateRange
      }
      first: 50
    ) {
      edges {
        node {
          id
          title
          description
          dateTime
          endTime
          duration
          eventUrl
          venue {
            name
            address
            city
            state
            postalCode
            lat
            lon
          }
          group {
            name
            urlname
          }
          fee {
            amount
            currency
          }
          going
          images {
            baseUrl
          }
        }
      }
    }
  }
`;

/**
 * Detect neighborhood from venue/text
 */
function detectNeighborhood(venue?: MeetupEvent['venue'], text?: string): string | undefined {
  const searchText = [
    venue?.name,
    venue?.address,
    text,
  ].filter(Boolean).join(' ');

  for (const [neighborhood, pattern] of Object.entries(NEIGHBORHOOD_PATTERNS)) {
    if (pattern.test(searchText)) {
      return neighborhood;
    }
  }
  return undefined;
}

/**
 * Extract price info from Meetup event
 */
function extractPriceInfo(event: MeetupEvent): PriceInfo {
  if (!event.fee || event.fee.amount === 0) {
    return { min: 0, max: 0, isFree: true };
  }

  return {
    min: event.fee.amount,
    max: event.fee.amount,
    isFree: false,
    currency: event.fee.currency,
  };
}

/**
 * Categorize event based on group name and description
 */
function categorizeEvent(event: MeetupEvent): ActivityCategory {
  const text = `${event.group.name} ${event.title} ${event.description || ''}`.toLowerCase();

  if (text.includes('hike') || text.includes('outdoor') || text.includes('trail') || text.includes('run')) {
    return 'outdoor';
  }
  if (text.includes('food') || text.includes('dinner') || text.includes('restaurant') || text.includes('culinary')) {
    return 'food';
  }
  if (text.includes('bar') || text.includes('nightlife') || text.includes('party') || text.includes('club')) {
    return 'nightlife';
  }
  if (text.includes('free') && !text.includes('freelance')) {
    return 'free';
  }
  if (text.includes('concert') || text.includes('show') || text.includes('performance') || text.includes('art')) {
    return 'events';
  }

  return 'community';
}

/**
 * Generate tags from event
 */
function generateTags(event: MeetupEvent): string[] {
  const tags: string[] = [];
  const text = `${event.group.name} ${event.title} ${event.description || ''}`.toLowerCase();

  if (text.includes('tech') || text.includes('software') || text.includes('coding')) tags.push('tech');
  if (text.includes('networking')) tags.push('networking');
  if (text.includes('workshop')) tags.push('workshop');
  if (text.includes('beginner')) tags.push('beginner-friendly');
  if (text.includes('social')) tags.push('social');
  if (text.includes('outdoor')) tags.push('outdoor');
  if (text.includes('hiking') || text.includes('hike')) tags.push('hiking');
  if (text.includes('fitness') || text.includes('exercise')) tags.push('fitness');
  if (text.includes('yoga')) tags.push('yoga');
  if (text.includes('happy hour')) tags.push('happy-hour');
  if (text.includes('book')) tags.push('books');
  if (text.includes('language')) tags.push('language');
  if (text.includes('startup')) tags.push('startup');
  if (!event.fee || event.fee.amount === 0) tags.push('free');

  return [...new Set(tags)];
}

/**
 * Strip HTML tags from description
 */
function stripHTML(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Convert Meetup event to Activity
 */
function eventToActivity(event: MeetupEvent): Activity {
  const startDate = new Date(event.dateTime);
  const endDate = event.endTime
    ? new Date(event.endTime)
    : new Date(startDate.getTime() + event.duration);

  const description = event.description
    ? stripHTML(event.description).slice(0, 500)
    : '';

  return {
    id: `meetup-${event.id}`,
    title: event.title,
    description,
    category: categorizeEvent(event),
    subcategory: event.group.name,
    date: startDate.toISOString().split('T')[0],
    time: startDate.toTimeString().slice(0, 5),
    endTime: endDate.toTimeString().slice(0, 5),
    venue: event.venue?.name || 'Online/TBA',
    address: event.venue
      ? `${event.venue.address}, ${event.venue.city}, ${event.venue.state}`
      : undefined,
    neighborhood: detectNeighborhood(event.venue, event.title),
    price: extractPriceInfo(event),
    url: event.eventUrl,
    source: 'Meetup',
    tags: generateTags(event),
    imageUrl: event.images?.[0]?.baseUrl,
    recurring: 'once',
    coordinates: event.venue
      ? { lat: event.venue.lat, lng: event.venue.lon }
      : undefined,
  };
}

/**
 * Fetch events from Meetup GraphQL API
 */
export async function fetchMeetupEvents(options: {
  apiKey?: string;
  startDate?: Date;
  endDate?: Date;
} = {}): Promise<{
  activities: Activity[];
  error?: string;
}> {
  const apiKey = options.apiKey || process.env.MEETUP_API_KEY;

  // San Francisco coordinates
  const SF_LAT = 37.7749;
  const SF_LON = -122.4194;

  const startDate = options.startDate || new Date();
  const endDate = options.endDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days

  // If no API key, try public GraphQL endpoint
  const endpoint = apiKey
    ? 'https://api.meetup.com/gql'
    : 'https://www.meetup.com/gql';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: MEETUP_EVENTS_QUERY,
        variables: {
          lat: SF_LAT,
          lon: SF_LON,
          startDateRange: startDate.toISOString(),
          endDateRange: endDate.toISOString(),
        },
      }),
    });

    if (!response.ok) {
      // Fall back to RSS if GraphQL fails
      console.log('Meetup GraphQL failed, falling back to RSS...');
      return await fetchMeetupRSS();
    }

    const data: MeetupGraphQLResponse = await response.json();

    if (data.errors) {
      console.error('Meetup GraphQL errors:', data.errors);
      return await fetchMeetupRSS();
    }

    const events = data.data.rankedEvents.edges.map((edge) => edge.node);
    const activities = events
      .filter((event) => {
        // Filter to SF area
        if (event.venue) {
          return event.venue.city === 'San Francisco' ||
            event.venue.city === 'SF';
        }
        return true;
      })
      .map(eventToActivity);

    console.log(`Fetched ${activities.length} events from Meetup`);

    return { activities };
  } catch (error) {
    console.error('Meetup fetch error:', error);
    // Fall back to RSS
    return await fetchMeetupRSS();
  }
}

/**
 * Fallback: Fetch events from Meetup RSS feeds for specific SF groups
 */
async function fetchMeetupRSS(): Promise<{
  activities: Activity[];
  error?: string;
}> {
  // Active SF Meetup groups with verified RSS feeds
  // Note: URLs are case-sensitive and must match exactly
  const SF_MEETUP_GROUPS = [
    // Tech
    'sfpython',
    'sfruby',
    'bay-area-ai',
    'women-who-code-sf',
    'sf-entrepreneurs',
    'silicon-valley-machine-learning',
    'san-francisco-book-club',
    // More tech / startup
    'sfnode',
    'ReactJS-San-Francisco',
    'SF-Data-Science',
    'san-francisco-startup-networking',
    'sf-product-managers',
    'gdg-sf',
    // Outdoor / fitness
    'sf-hiking',
    'san-francisco-running',
    'bay-area-outdoor-adventures',
    'sf-yoga-community',
    // Social / community
    'sf-new-in-town',
    'san-francisco-photography',
    'sf-board-games',
    'bay-area-young-professionals',
  ];

  const allActivities: Activity[] = [];
  const errors: string[] = [];

  for (const groupName of SF_MEETUP_GROUPS) {
    try {
      const rssUrl = `https://www.meetup.com/${groupName}/events/rss/`;
      const response = await fetch(rssUrl, {
        headers: {
          'User-Agent': 'SF-Narrative/1.0 (news aggregator)',
        },
      });

      if (!response.ok) {
        console.log(`  ✗ ${groupName}: HTTP ${response.status}`);
        continue;
      }

      const xml = await response.text();

      // Check if it's a valid RSS or an error
      if (xml.includes('"message"') || !xml.includes('<rss')) {
        console.log(`  ✗ ${groupName}: Invalid RSS or group not found`);
        continue;
      }

      const events = parseMeetupRSS(xml, groupName);
      if (events.length > 0) {
        console.log(`  ✓ ${groupName}: ${events.length} events`);
        allActivities.push(...events);
      }

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (error) {
      console.log(`  ✗ ${groupName}: ${error}`);
      errors.push(`Failed to fetch ${groupName}: ${error}`);
    }
  }

  console.log(`Total Meetup events: ${allActivities.length}`);

  return {
    activities: allActivities,
    error: errors.length > 0 ? errors.join('; ') : undefined,
  };
}

/**
 * Parse Meetup RSS XML
 */
function parseMeetupRSS(xml: string, groupName: string): Activity[] {
  const activities: Activity[] = [];

  // Extract items using regex
  const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

  for (const itemXml of itemMatches) {
    const title = extractTag(itemXml, 'title');
    const link = extractTag(itemXml, 'link');
    const description = extractTag(itemXml, 'description');
    const pubDate = extractTag(itemXml, 'pubDate');

    if (!title || !link) continue;

    // Generate unique ID from link
    const id = `meetup-rss-${Buffer.from(link).toString('base64').slice(0, 20)}`;

    // Parse date from description, title, or pubDate
    // Try multiple date formats in both title and description
    const textToSearch = `${title} ${description}`;

    // Try "Month Day, Year" format (e.g., "January 15, 2026")
    let eventDate: string | undefined;
    const fullDateMatch = textToSearch.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s*(\d{4})\b/i);
    if (fullDateMatch) {
      eventDate = new Date(`${fullDateMatch[1]} ${fullDateMatch[2]}, ${fullDateMatch[3]}`).toISOString().split('T')[0];
    }

    // Try "Month Day" format without year (assume current/next year)
    if (!eventDate) {
      const monthDayMatch = textToSearch.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i);
      if (monthDayMatch) {
        const now = new Date();
        const tentativeDate = new Date(`${monthDayMatch[1]} ${monthDayMatch[2]}, ${now.getFullYear()}`);
        // If date is in the past, assume next year
        if (tentativeDate < now) {
          tentativeDate.setFullYear(tentativeDate.getFullYear() + 1);
        }
        eventDate = tentativeDate.toISOString().split('T')[0];
      }
    }

    // Try "M/D" or "M/D/YY" format
    if (!eventDate) {
      const slashDateMatch = textToSearch.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
      if (slashDateMatch) {
        const month = parseInt(slashDateMatch[1]) - 1;
        const day = parseInt(slashDateMatch[2]);
        let year = slashDateMatch[3] ? parseInt(slashDateMatch[3]) : new Date().getFullYear();
        if (year < 100) year += 2000;
        eventDate = new Date(year, month, day).toISOString().split('T')[0];
      }
    }

    // Fall back to pubDate
    if (!eventDate) {
      eventDate = new Date(pubDate).toISOString().split('T')[0];
    }

    // Extract time
    const timeMatch = description.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i);
    const time = timeMatch ? parseTimeToHHMM(timeMatch[1]) : undefined;

    activities.push({
      id,
      title: stripHTML(title),
      description: stripHTML(description).slice(0, 500),
      category: 'community',
      subcategory: groupName.replace(/-/g, ' '),
      date: eventDate,
      time,
      venue: 'See event page',
      price: { min: 0, max: 0, isFree: true },
      url: link,
      source: 'Meetup',
      tags: ['meetup'],
      recurring: 'once',
    });
  }

  return activities;
}

/**
 * Extract tag content from XML
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
 * Parse time string to HH:MM format
 */
function parseTimeToHHMM(timeStr: string): string {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return '00:00';

  let hour = parseInt(match[1]);
  const minutes = match[2];
  const period = match[3]?.toUpperCase();

  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;

  return `${hour.toString().padStart(2, '0')}:${minutes}`;
}
