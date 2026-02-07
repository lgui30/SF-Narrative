/**
 * Firecrawl Event Scraper
 * Scrapes SF event listings from various websites
 * Focuses on community-friendly, accessible events
 */

import { Activity, ActivityCategory } from '../content-types';
import { detectNeighborhood as detectNeighborhoodFromLocation } from './sf-locations';

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const FIRECRAWL_BASE_URL = 'https://api.firecrawl.dev/v1';

interface FirecrawlScrapeResponse {
  success: boolean;
  data?: {
    markdown?: string;
    html?: string;
    metadata?: {
      title?: string;
      description?: string;
    };
    extract?: Record<string, unknown>;
  };
  error?: string;
}

interface FirecrawlExtractResponse {
  success: boolean;
  data?: {
    extract?: {
      events?: ExtractedEvent[];
    };
  };
  error?: string;
}

interface ExtractedEvent {
  title?: string;
  date?: string;
  time?: string;
  venue?: string;
  address?: string;
  neighborhood?: string;
  description?: string;
  price?: string;
  url?: string;
  category?: string;
  isFree?: boolean;
}

/**
 * Event source configuration
 */
interface EventSource {
  name: string;
  url: string;
  category: ActivityCategory;
  extractSchema: object;
}

// Standard schema for event extraction
const STANDARD_EVENT_SCHEMA = {
  type: 'object',
  properties: {
    events: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Event title' },
          date: { type: 'string', description: 'Event date (e.g., January 25, 2026 or 2026-01-25)' },
          time: { type: 'string', description: 'Start time (e.g., 7:00 PM)' },
          venue: { type: 'string', description: 'Venue name' },
          address: { type: 'string', description: 'Full street address including neighborhood' },
          neighborhood: { type: 'string', description: 'SF neighborhood (e.g., Mission, SoMa, Castro)' },
          description: { type: 'string', description: 'Event description' },
          price: { type: 'string', description: 'Price (e.g., $20, Free, $15-$30)' },
          url: { type: 'string', description: 'Link to event page' },
          category: { type: 'string', description: 'Event type: music, comedy, food, art, sports, nightlife, community, outdoor, workshop, networking' },
          isFree: { type: 'boolean', description: 'Is the event free?' },
        },
      },
    },
  },
};

// Comprehensive SF event sources
const EVENT_SOURCES: EventSource[] = [
  // === FUNCHEAP (Free/Cheap Events) ===
  {
    name: 'SF Funcheap',
    url: 'https://sf.funcheap.com/',
    category: 'free',
    extractSchema: STANDARD_EVENT_SCHEMA,
  },
  {
    name: 'SF Funcheap This Weekend',
    url: 'https://sf.funcheap.com/events/this-weekend/',
    category: 'free',
    extractSchema: STANDARD_EVENT_SCHEMA,
  },

  // === DO THE BAY ===
  {
    name: 'DoTheBay This Week',
    url: 'https://dothebay.com/events/this-week',
    category: 'events',
    extractSchema: STANDARD_EVENT_SCHEMA,
  },
  {
    name: 'DoTheBay Weekend',
    url: 'https://dothebay.com/events/this-weekend',
    category: 'events',
    extractSchema: STANDARD_EVENT_SCHEMA,
  },

  // === EVENTBRITE CATEGORIES ===
  {
    name: 'Eventbrite Free',
    url: 'https://www.eventbrite.com/d/ca--san-francisco/free--events/',
    category: 'free',
    extractSchema: STANDARD_EVENT_SCHEMA,
  },
  {
    name: 'Eventbrite Music',
    url: 'https://www.eventbrite.com/d/ca--san-francisco/music--events/',
    category: 'nightlife',
    extractSchema: STANDARD_EVENT_SCHEMA,
  },
  {
    name: 'Eventbrite Food & Drink',
    url: 'https://www.eventbrite.com/d/ca--san-francisco/food-and-drink--events/',
    category: 'food',
    extractSchema: STANDARD_EVENT_SCHEMA,
  },
  {
    name: 'Eventbrite Arts',
    url: 'https://www.eventbrite.com/d/ca--san-francisco/arts--events/',
    category: 'events',
    extractSchema: STANDARD_EVENT_SCHEMA,
  },
  {
    name: 'Eventbrite Nightlife',
    url: 'https://www.eventbrite.com/d/ca--san-francisco/nightlife--events/',
    category: 'nightlife',
    extractSchema: STANDARD_EVENT_SCHEMA,
  },
  {
    name: 'Eventbrite Health & Fitness',
    url: 'https://www.eventbrite.com/d/ca--san-francisco/health--events/',
    category: 'outdoor',
    extractSchema: STANDARD_EVENT_SCHEMA,
  },
  {
    name: 'Eventbrite Community',
    url: 'https://www.eventbrite.com/d/ca--san-francisco/community--events/',
    category: 'community',
    extractSchema: STANDARD_EVENT_SCHEMA,
  },
  {
    name: 'Eventbrite Business',
    url: 'https://www.eventbrite.com/d/ca--san-francisco/business--events/',
    category: 'community',
    extractSchema: STANDARD_EVENT_SCHEMA,
  },

  // === SF STATION (Nightlife/Music) ===
  {
    name: 'SF Station Events',
    url: 'https://www.sfstation.com/events/',
    category: 'events',
    extractSchema: STANDARD_EVENT_SCHEMA,
  },

  // === SF GOV (City Events) ===
  {
    name: 'SF.gov Events',
    url: 'https://sf.gov/events',
    category: 'community',
    extractSchema: STANDARD_EVENT_SCHEMA,
  },

  // === SF WEEKLY ===
  {
    name: 'SF Weekly Events',
    url: 'https://www.sfweekly.com/events/',
    category: 'events',
    extractSchema: STANDARD_EVENT_SCHEMA,
  },

  // === LUMA (Tech/AI/Startup Events) ===
  {
    name: 'Luma SF',
    url: 'https://lu.ma/sf',
    category: 'community',
    extractSchema: STANDARD_EVENT_SCHEMA,
  },

  // === TIMEOUT SF ===
  {
    name: 'TimeOut SF Things To Do',
    url: 'https://www.timeout.com/san-francisco/things-to-do/things-to-do-in-san-francisco-this-week',
    category: 'events',
    extractSchema: STANDARD_EVENT_SCHEMA,
  },
  {
    name: 'TimeOut SF Free',
    url: 'https://www.timeout.com/san-francisco/things-to-do/free-things-to-do-in-san-francisco',
    category: 'free',
    extractSchema: STANDARD_EVENT_SCHEMA,
  },

  // === RESIDENT ADVISOR (Electronic Music) ===
  {
    name: 'Resident Advisor SF',
    url: 'https://ra.co/events/us/sanfrancisco',
    category: 'nightlife',
    extractSchema: STANDARD_EVENT_SCHEMA,
  },

  // === SFARTS ===
  {
    name: 'SFArts Events',
    url: 'https://www.sfarts.org/events',
    category: 'events',
    extractSchema: STANDARD_EVENT_SCHEMA,
  },

  // === SFJAZZ ===
  {
    name: 'SFJAZZ Calendar',
    url: 'https://www.sfjazz.org/calendar',
    category: 'events',
    extractSchema: STANDARD_EVENT_SCHEMA,
  },

  // === SF SYMPHONY ===
  {
    name: 'SF Symphony',
    url: 'https://www.sfsymphony.org/Buy-Tickets/2025-26-Season',
    category: 'events',
    extractSchema: STANDARD_EVENT_SCHEMA,
  },

  // === YERBA BUENA CENTER FOR THE ARTS ===
  {
    name: 'YBCA Events',
    url: 'https://ybca.org/whats-on/',
    category: 'events',
    extractSchema: STANDARD_EVENT_SCHEMA,
  },

  // === EVENTBRITE (More categories to compensate for no API key) ===
  {
    name: 'Eventbrite Science & Tech',
    url: 'https://www.eventbrite.com/d/ca--san-francisco/science-and-technology--events/',
    category: 'community',
    extractSchema: STANDARD_EVENT_SCHEMA,
  },
  {
    name: 'Eventbrite Sports & Fitness',
    url: 'https://www.eventbrite.com/d/ca--san-francisco/sports-and-fitness--events/',
    category: 'outdoor',
    extractSchema: STANDARD_EVENT_SCHEMA,
  },
  {
    name: 'Eventbrite Charity',
    url: 'https://www.eventbrite.com/d/ca--san-francisco/charity-and-causes--events/',
    category: 'community',
    extractSchema: STANDARD_EVENT_SCHEMA,
  },
  {
    name: 'Eventbrite Family',
    url: 'https://www.eventbrite.com/d/ca--san-francisco/family-and-education--events/',
    category: 'free',
    extractSchema: STANDARD_EVENT_SCHEMA,
  },
  {
    name: 'Eventbrite Film',
    url: 'https://www.eventbrite.com/d/ca--san-francisco/film-and-media--events/',
    category: 'events',
    extractSchema: STANDARD_EVENT_SCHEMA,
  },

  // === SF RECREATION & PARKS ===
  {
    name: 'SF Rec & Parks Events',
    url: 'https://sfrecpark.org/calendar',
    category: 'outdoor',
    extractSchema: STANDARD_EVENT_SCHEMA,
  },

  // === 19HZ (Bay Area Electronic Music) ===
  {
    name: '19hz Bay Area',
    url: 'https://19hz.info/eventlisting_BayArea.php',
    category: 'nightlife',
    extractSchema: STANDARD_EVENT_SCHEMA,
  },
];

/**
 * Scrape and extract events from a URL using Firecrawl
 */
async function scrapeEvents(source: EventSource): Promise<ExtractedEvent[]> {
  if (!FIRECRAWL_API_KEY) {
    console.log(`  ✗ ${source.name}: FIRECRAWL_API_KEY not configured`);
    return [];
  }

  try {
    // Use Firecrawl's extract endpoint for structured data
    const response = await fetch(`${FIRECRAWL_BASE_URL}/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({
        url: source.url,
        formats: ['extract'],
        extract: {
          schema: source.extractSchema,
          prompt: `Extract all events from this page. For each event, get the title, date, time, venue/location, description, price, and link to the event. Focus on events happening in San Francisco. Return dates in a standard format like "January 25, 2026" or "2026-01-25".`,
        },
        timeout: 30000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`  ✗ ${source.name}: HTTP ${response.status} - ${errorText.slice(0, 100)}`);
      return [];
    }

    const result: FirecrawlScrapeResponse = await response.json();

    if (!result.success) {
      console.log(`  ✗ ${source.name}: ${result.error || 'Unknown error'}`);
      return [];
    }

    const events = (result.data?.extract as { events?: ExtractedEvent[] })?.events || [];
    console.log(`  ✓ ${source.name}: ${events.length} events`);
    return events;
  } catch (error) {
    console.log(`  ✗ ${source.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return [];
  }
}

/**
 * Detect neighborhood from text using comprehensive location database
 */
function detectNeighborhood(text: string): string | undefined {
  return detectNeighborhoodFromLocation(text);
}

/**
 * Parse price string to PriceInfo
 */
function parsePrice(priceStr?: string, isFree?: boolean): { min: number; max: number; isFree: boolean } {
  if (isFree || !priceStr || priceStr.toLowerCase().includes('free')) {
    return { min: 0, max: 0, isFree: true };
  }

  // Extract numbers from price string
  const numbers = priceStr.match(/\d+(?:\.\d+)?/g);
  if (!numbers || numbers.length === 0) {
    return { min: 0, max: 0, isFree: true };
  }

  const prices = numbers.map(n => parseFloat(n));
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
    isFree: false,
  };
}

/**
 * Parse date string to ISO format
 */
function parseDate(dateStr?: string): string {
  if (!dateStr) {
    return new Date().toISOString().split('T')[0];
  }

  try {
    // Try direct parsing
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  } catch {
    // Continue to manual parsing
  }

  // Try to extract date components
  const monthNames: Record<string, number> = {
    january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
    jan: 0, feb: 1, mar: 2, apr: 3, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };

  // Match "Month Day, Year" or "Month Day"
  const match = dateStr.match(/(\w+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})?/i);
  if (match) {
    const month = monthNames[match[1].toLowerCase()];
    if (month !== undefined) {
      const day = parseInt(match[2]);
      const year = match[3] ? parseInt(match[3]) : new Date().getFullYear();
      const date = new Date(year, month, day);

      // If date is in the past, assume next year
      if (date < new Date() && !match[3]) {
        date.setFullYear(date.getFullYear() + 1);
      }

      return date.toISOString().split('T')[0];
    }
  }

  // Fallback to today
  return new Date().toISOString().split('T')[0];
}

/**
 * Parse time string to HH:MM format
 */
function parseTime(timeStr?: string): string | undefined {
  if (!timeStr) return undefined;

  // Match "7pm", "7:30pm", "7:30 PM", "19:00"
  const match = timeStr.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
  if (match) {
    let hour = parseInt(match[1]);
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const isPM = match[3]?.toLowerCase() === 'pm';
    const isAM = match[3]?.toLowerCase() === 'am';

    if (isPM && hour !== 12) hour += 12;
    if (isAM && hour === 12) hour = 0;

    return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  return undefined;
}

/**
 * Determine category from event data
 */
function determineCategory(event: ExtractedEvent, defaultCategory: ActivityCategory): ActivityCategory {
  const text = `${event.title || ''} ${event.description || ''} ${event.category || ''}`.toLowerCase();

  if (event.isFree || text.includes('free')) return 'free';
  if (text.includes('outdoor') || text.includes('park') || text.includes('hike') || text.includes('walk')) return 'outdoor';
  if (text.includes('food') || text.includes('drink') || text.includes('tasting') || text.includes('dinner')) return 'food';
  if (text.includes('night') || text.includes('party') || text.includes('club') || text.includes('dj')) return 'nightlife';
  if (text.includes('community') || text.includes('meetup') || text.includes('volunteer')) return 'community';
  if (text.includes('concert') || text.includes('show') || text.includes('festival') || text.includes('art')) return 'events';

  return defaultCategory;
}

/**
 * Check if a neighborhood value is generic/useless
 */
function isGenericNeighborhood(neighborhood?: string): boolean {
  if (!neighborhood) return true;
  const lower = neighborhood.toLowerCase().trim();
  const generic = [
    'san francisco', 'sf', 'bay area', 'california', 'ca',
    'n/a', 'na', 'not provided', 'not specified', 'tbd', 'tba',
    'various', 'multiple', 'see description', 'online', 'virtual'
  ];
  return generic.includes(lower) || lower.length < 3;
}

/**
 * Convert extracted event to Activity
 */
function convertToActivity(event: ExtractedEvent, source: EventSource): Activity | null {
  if (!event.title) return null;

  // Combine all text for neighborhood detection
  const combinedText = `${event.title} ${event.venue || ''} ${event.address || ''} ${event.description || ''} ${event.neighborhood || ''}`;

  // Always run our detection (it's more accurate than Firecrawl's extraction)
  const detectedNeighborhood = detectNeighborhood(combinedText);

  // Use our detection, fall back to extracted only if it's specific
  let neighborhood: string | undefined;
  if (detectedNeighborhood) {
    neighborhood = detectedNeighborhood;
  } else if (!isGenericNeighborhood(event.neighborhood)) {
    neighborhood = event.neighborhood;
  }
  // Otherwise neighborhood remains undefined

  // Generate unique ID based on all event attributes for better uniqueness
  const idBase = `${source.name}|${event.title}|${event.date}|${event.time || ''}|${event.venue || ''}|${event.url || ''}`;
  // Use a simple hash function for deterministic unique IDs
  let hash = 5381;
  for (let i = 0; i < idBase.length; i++) {
    hash = ((hash << 5) + hash) ^ idBase.charCodeAt(i);
  }
  const id = `fc-${(hash >>> 0).toString(36)}`;

  // Build venue string with address if available
  let venueStr = event.venue || 'San Francisco';
  if (event.address && event.address !== event.venue) {
    venueStr = `${event.venue || ''} · ${event.address}`.trim().replace(/^·\s*/, '');
  }

  return {
    id,
    title: event.title,
    description: event.description?.slice(0, 500) || '',
    category: determineCategory(event, source.category),
    date: parseDate(event.date),
    time: parseTime(event.time),
    venue: venueStr,
    neighborhood,
    price: parsePrice(event.price, event.isFree),
    url: event.url || source.url,
    source: source.name,
    tags: event.category ? [event.category.toLowerCase()] : [],
    recurring: 'once',
  };
}

/**
 * Fetch all events from Firecrawl sources
 */
export async function fetchFirecrawlEvents(): Promise<{
  activities: Activity[];
  errors: string[];
}> {
  console.log('Fetching from Firecrawl sources...');

  const allActivities: Activity[] = [];
  const errors: string[] = [];

  for (const source of EVENT_SOURCES) {
    try {
      const events = await scrapeEvents(source);

      for (const event of events) {
        const activity = convertToActivity(event, source);
        if (activity) {
          allActivities.push(activity);
        }
      }

      // Rate limiting between sources
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      const errorMsg = `${source.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      console.log(`  ✗ ${errorMsg}`);
    }
  }

  console.log(`Total Firecrawl events: ${allActivities.length}`);

  return { activities: allActivities, errors };
}

/**
 * Fetch events from a single source (for testing)
 */
export async function fetchFromSource(sourceName: string): Promise<Activity[]> {
  const source = EVENT_SOURCES.find(s => s.name.toLowerCase().includes(sourceName.toLowerCase()));
  if (!source) {
    console.log(`Source not found: ${sourceName}`);
    return [];
  }

  const events = await scrapeEvents(source);
  return events
    .map(e => convertToActivity(e, source))
    .filter((a): a is Activity => a !== null);
}

export { EVENT_SOURCES };
