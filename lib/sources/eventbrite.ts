/**
 * Eventbrite API Integration
 * Fetches events from Eventbrite for San Francisco area
 * Requires EVENTBRITE_API_KEY environment variable
 */

import { Activity, ActivityCategory, PriceInfo, SF_NEIGHBORHOODS } from '../content-types';

interface EventbriteVenue {
  name: string;
  address: {
    localized_address_display: string;
    city: string;
    region: string;
    postal_code: string;
    latitude: string;
    longitude: string;
  };
}

interface EventbriteTicketClass {
  free: boolean;
  cost?: {
    currency: string;
    value: number;
    major_value: string;
    display: string;
  };
}

interface EventbriteEvent {
  id: string;
  name: {
    text: string;
    html: string;
  };
  description: {
    text: string;
    html: string;
  };
  url: string;
  start: {
    timezone: string;
    local: string;
    utc: string;
  };
  end: {
    timezone: string;
    local: string;
    utc: string;
  };
  venue_id: string;
  venue?: EventbriteVenue;
  category_id: string;
  subcategory_id?: string;
  format_id: string;
  is_free: boolean;
  logo?: {
    url: string;
    original: {
      url: string;
    };
  };
  ticket_classes?: EventbriteTicketClass[];
}

interface EventbriteSearchResponse {
  events: EventbriteEvent[];
  pagination: {
    has_more_items: boolean;
    page_number: number;
    page_count: number;
  };
}

// Eventbrite category ID to our category mapping
const EVENTBRITE_CATEGORY_MAP: Record<string, ActivityCategory> = {
  '101': 'events', // Business & Professional
  '102': 'events', // Science & Technology
  '103': 'events', // Music
  '104': 'events', // Film, Media & Entertainment
  '105': 'events', // Performing & Visual Arts
  '106': 'outdoor', // Fashion & Beauty
  '107': 'events', // Health & Wellness
  '108': 'outdoor', // Sports & Fitness
  '109': 'outdoor', // Travel & Outdoor
  '110': 'food', // Food & Drink
  '111': 'community', // Charity & Causes
  '112': 'community', // Government & Politics
  '113': 'community', // Community & Culture
  '114': 'community', // Religion & Spirituality
  '115': 'community', // Family & Education
  '116': 'events', // Seasonal & Holiday
  '117': 'community', // Home & Lifestyle
  '118': 'events', // Auto, Boat & Air
  '119': 'nightlife', // Hobbies & Special Interest
  '199': 'events', // Other
};

// SF neighborhood detection patterns
const NEIGHBORHOOD_PATTERNS: Record<string, string[]> = {
  'Mission': ['mission st', 'mission district', '94110'],
  'Castro/Upper Market': ['castro', 'upper market', '94114'],
  'SoMa': ['soma', 'south of market', '94103', '94107'],
  'Financial District': ['financial district', 'fidi', '94104', '94111'],
  'Chinatown': ['chinatown', '94108'],
  'North Beach': ['north beach', '94133'],
  'Marina': ['marina', 'chestnut st', '94123'],
  'Hayes Valley': ['hayes valley', 'hayes st', '94102'],
  'Haight-Ashbury': ['haight', 'ashbury', '94117'],
  'Noe Valley': ['noe valley', '24th st', '94114'],
  'Pacific Heights': ['pacific heights', 'pac heights', '94115'],
  'Potrero Hill': ['potrero hill', '94107'],
  'Dogpatch': ['dogpatch', '94107'],
  'Sunset': ['sunset', '94116', '94122'],
  'Richmond': ['richmond district', '94118', '94121'],
  'Golden Gate Park': ['golden gate park', 'ggp'],
};

/**
 * Detect neighborhood from venue address
 */
function detectNeighborhood(venue?: EventbriteVenue): string | undefined {
  if (!venue) return undefined;

  const address = venue.address.localized_address_display.toLowerCase();
  const zip = venue.address.postal_code;

  for (const [neighborhood, patterns] of Object.entries(NEIGHBORHOOD_PATTERNS)) {
    for (const pattern of patterns) {
      if (address.includes(pattern) || zip === pattern) {
        return neighborhood;
      }
    }
  }

  return undefined;
}

/**
 * Extract price info from event
 */
function extractPriceInfo(event: EventbriteEvent): PriceInfo {
  if (event.is_free) {
    return { min: 0, max: 0, isFree: true };
  }

  if (!event.ticket_classes || event.ticket_classes.length === 0) {
    return { min: 0, max: 0, isFree: false };
  }

  const prices = event.ticket_classes
    .filter((tc) => tc.cost)
    .map((tc) => tc.cost!.value / 100); // Convert cents to dollars

  if (prices.length === 0) {
    return { min: 0, max: 0, isFree: event.is_free };
  }

  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
    isFree: false,
    currency: event.ticket_classes[0]?.cost?.currency || 'USD',
  };
}

/**
 * Generate tags from event data
 */
function generateTags(event: EventbriteEvent): string[] {
  const tags: string[] = [];

  // Add category-based tags
  const categoryId = event.category_id;
  if (categoryId === '103') tags.push('music');
  if (categoryId === '104') tags.push('entertainment');
  if (categoryId === '105') tags.push('arts');
  if (categoryId === '108') tags.push('fitness');
  if (categoryId === '109') tags.push('outdoor');
  if (categoryId === '110') tags.push('food', 'drinks');
  if (categoryId === '111') tags.push('charity');
  if (categoryId === '113') tags.push('culture');

  // Check title for common tags
  const title = event.name.text.toLowerCase();
  if (title.includes('21+') || title.includes('21 +')) tags.push('21+');
  if (title.includes('free')) tags.push('free');
  if (title.includes('workshop')) tags.push('workshop');
  if (title.includes('class')) tags.push('class');
  if (title.includes('networking')) tags.push('networking');
  if (title.includes('happy hour')) tags.push('happy-hour');
  if (title.includes('brunch')) tags.push('brunch');
  if (title.includes('comedy')) tags.push('comedy');
  if (title.includes('live music')) tags.push('live-music');

  return [...new Set(tags)];
}

/**
 * Convert Eventbrite event to Activity
 */
function eventToActivity(event: EventbriteEvent): Activity {
  const startDate = new Date(event.start.local);
  const endDate = new Date(event.end.local);

  return {
    id: `eventbrite-${event.id}`,
    title: event.name.text,
    description: event.description.text?.slice(0, 500) || '',
    category: EVENTBRITE_CATEGORY_MAP[event.category_id] || 'events',
    date: startDate.toISOString().split('T')[0],
    time: startDate.toTimeString().slice(0, 5),
    endTime: endDate.toTimeString().slice(0, 5),
    venue: event.venue?.name || 'TBA',
    address: event.venue?.address.localized_address_display,
    neighborhood: detectNeighborhood(event.venue),
    price: extractPriceInfo(event),
    url: event.url,
    source: 'Eventbrite',
    tags: generateTags(event),
    imageUrl: event.logo?.original?.url || event.logo?.url,
    recurring: 'once',
    coordinates: event.venue?.address.latitude
      ? {
          lat: parseFloat(event.venue.address.latitude),
          lng: parseFloat(event.venue.address.longitude),
        }
      : undefined,
  };
}

/**
 * Fetch events from Eventbrite API
 */
export async function fetchEventbriteEvents(options: {
  apiKey?: string;
  startDate?: Date;
  endDate?: Date;
  categories?: string[];
  page?: number;
} = {}): Promise<{
  activities: Activity[];
  hasMore: boolean;
  error?: string;
}> {
  const apiKey = options.apiKey || process.env.EVENTBRITE_API_KEY;

  if (!apiKey) {
    return {
      activities: [],
      hasMore: false,
      error: 'EVENTBRITE_API_KEY not configured',
    };
  }

  const startDate = options.startDate || new Date();
  const endDate = options.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const params = new URLSearchParams({
    'location.address': 'San Francisco, CA',
    'location.within': '10mi',
    'start_date.range_start': startDate.toISOString().replace('.000', ''),
    'start_date.range_end': endDate.toISOString().replace('.000', ''),
    'expand': 'venue,ticket_classes',
    'page': String(options.page || 1),
  });

  if (options.categories && options.categories.length > 0) {
    params.set('categories', options.categories.join(','));
  }

  try {
    const response = await fetch(
      `https://www.eventbriteapi.com/v3/events/search/?${params}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Eventbrite API error: ${response.status} - ${errorText}`);
    }

    const data: EventbriteSearchResponse = await response.json();

    const activities = data.events
      .filter((event) => event.venue?.address.city === 'San Francisco')
      .map(eventToActivity);

    return {
      activities,
      hasMore: data.pagination.has_more_items,
    };
  } catch (error) {
    console.error('Eventbrite fetch error:', error);
    return {
      activities: [],
      hasMore: false,
      error: String(error),
    };
  }
}

/**
 * Fetch all Eventbrite events (paginated)
 */
export async function fetchAllEventbriteEvents(options: {
  apiKey?: string;
  maxPages?: number;
} = {}): Promise<{
  activities: Activity[];
  errors: string[];
}> {
  const maxPages = options.maxPages || 5;
  const allActivities: Activity[] = [];
  const errors: string[] = [];

  let page = 1;
  let hasMore = true;

  while (hasMore && page <= maxPages) {
    const result = await fetchEventbriteEvents({
      apiKey: options.apiKey,
      page,
    });

    if (result.error) {
      errors.push(result.error);
      break;
    }

    allActivities.push(...result.activities);
    hasMore = result.hasMore;
    page++;

    // Rate limiting - wait between pages
    if (hasMore) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  console.log(`Fetched ${allActivities.length} events from Eventbrite`);

  return { activities: allActivities, errors };
}
