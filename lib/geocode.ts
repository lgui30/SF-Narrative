/**
 * Static geocoding utility for SF events
 * No external API needed — uses venue lookup + neighborhood centroids
 */

import type { Activity, Coordinates } from './content-types';

// Popular SF venues with known coordinates
const VENUE_TO_COORDINATES: Record<string, Coordinates> = {
  // Major Venues
  'chase center': { lat: 37.7680, lng: -122.3877 },
  'oracle park': { lat: 37.7786, lng: -122.3893 },
  'bill graham civic auditorium': { lat: 37.7784, lng: -122.4176 },
  'the fillmore': { lat: 37.7841, lng: -122.4330 },
  'the warfield': { lat: 37.7825, lng: -122.4100 },
  'great american music hall': { lat: 37.7851, lng: -122.4189 },
  'palace of fine arts': { lat: 37.8020, lng: -122.4484 },
  'moscone center': { lat: 37.7841, lng: -122.4008 },
  'davies symphony hall': { lat: 37.7775, lng: -122.4203 },
  'war memorial opera house': { lat: 37.7782, lng: -122.4218 },
  'san francisco city hall': { lat: 37.7793, lng: -122.4193 },
  'city hall': { lat: 37.7793, lng: -122.4193 },
  'exploratorium': { lat: 37.8017, lng: -122.3976 },
  'california academy of sciences': { lat: 37.7699, lng: -122.4661 },
  'de young museum': { lat: 37.7713, lng: -122.4687 },
  'sfmoma': { lat: 37.7857, lng: -122.4011 },
  'sf moma': { lat: 37.7857, lng: -122.4011 },
  'asian art museum': { lat: 37.7802, lng: -122.4163 },
  'the independent': { lat: 37.7756, lng: -122.4363 },
  'bottom of the hill': { lat: 37.7650, lng: -122.3964 },
  'slim\'s': { lat: 37.7716, lng: -122.4111 },
  'the chapel': { lat: 37.7609, lng: -122.4211 },
  'rickshaw stop': { lat: 37.7755, lng: -122.4196 },
  'dna lounge': { lat: 37.7711, lng: -122.4127 },
  'public works': { lat: 37.7622, lng: -122.4148 },
  'the midway': { lat: 37.7480, lng: -122.3860 },
  'august hall': { lat: 37.7863, lng: -122.4094 },
  'regency ballroom': { lat: 37.7882, lng: -122.4230 },
  'the masonic': { lat: 37.7911, lng: -122.4126 },
  'nob hill masonic center': { lat: 37.7911, lng: -122.4126 },
  'the castro theatre': { lat: 37.7621, lng: -122.4350 },
  'castro theatre': { lat: 37.7621, lng: -122.4350 },

  // Parks & Outdoor
  'dolores park': { lat: 37.7596, lng: -122.4269 },
  'golden gate park': { lat: 37.7694, lng: -122.4862 },
  'crissy field': { lat: 37.8039, lng: -122.4641 },
  'ocean beach': { lat: 37.7602, lng: -122.5107 },
  'presidio': { lat: 37.7989, lng: -122.4662 },
  'lands end': { lat: 37.7876, lng: -122.5050 },
  'baker beach': { lat: 37.7934, lng: -122.4834 },
  'glen canyon park': { lat: 37.7387, lng: -122.4410 },
  'bernal heights park': { lat: 37.7432, lng: -122.4154 },
  'twin peaks': { lat: 37.7544, lng: -122.4477 },
  'alamo square': { lat: 37.7764, lng: -122.4344 },
  'washington square park': { lat: 37.8006, lng: -122.4107 },
  'kezar stadium': { lat: 37.7669, lng: -122.4571 },
  'stern grove': { lat: 37.7352, lng: -122.4708 },
  'lake merced': { lat: 37.7286, lng: -122.4938 },
  'mclaren park': { lat: 37.7190, lng: -122.4210 },
  'fort mason': { lat: 37.8063, lng: -122.4316 },
  'fort mason center': { lat: 37.8063, lng: -122.4316 },

  // Food & Market
  'ferry building': { lat: 37.7955, lng: -122.3937 },
  'ferry building marketplace': { lat: 37.7955, lng: -122.3937 },
  'off the grid': { lat: 37.8063, lng: -122.4316 },
  'la cocina': { lat: 37.7607, lng: -122.4152 },
  'bi-rite creamery': { lat: 37.7616, lng: -122.4255 },
  'tartine manufactory': { lat: 37.7615, lng: -122.4044 },
  'zeitgeist': { lat: 37.7701, lng: -122.4222 },

  // Community & Tech
  'manny\'s': { lat: 37.7636, lng: -122.4191 },
  'mannys': { lat: 37.7636, lng: -122.4191 },
  'the social study': { lat: 37.7596, lng: -122.4210 },
  'san francisco public library': { lat: 37.7791, lng: -122.4158 },
  'sf public library': { lat: 37.7791, lng: -122.4158 },
  'main library': { lat: 37.7791, lng: -122.4158 },
  'galvanize': { lat: 37.7876, lng: -122.3997 },
  'wework': { lat: 37.7879, lng: -122.3969 },
  'github': { lat: 37.7821, lng: -122.3917 },
  'commonwealth club': { lat: 37.7879, lng: -122.3978 },
  'the commonwealth club': { lat: 37.7879, lng: -122.3978 },

  // Nightlife
  'audio': { lat: 37.7714, lng: -122.4127 },
  'audio sf': { lat: 37.7714, lng: -122.4127 },
  'monarch': { lat: 37.7720, lng: -122.4101 },
  'temple nightclub': { lat: 37.7861, lng: -122.3992 },
  'halcyon': { lat: 37.7710, lng: -122.4134 },
  'the endup': { lat: 37.7712, lng: -122.4014 },
  'el rio': { lat: 37.7466, lng: -122.4189 },
  'the stud': { lat: 37.7715, lng: -122.4131 },
  'oasis': { lat: 37.7718, lng: -122.4128 },
  'jolene\'s': { lat: 37.7715, lng: -122.4131 },
  'the knockout': { lat: 37.7455, lng: -122.4200 },
  'bimbo\'s 365 club': { lat: 37.7996, lng: -122.4152 },
  'tonic nightlife': { lat: 37.7847, lng: -122.4100 },
  'coin-op game room': { lat: 37.7704, lng: -122.4124 },

  // Misc
  'pier 39': { lat: 37.8087, lng: -122.4098 },
  'pier 70': { lat: 37.7588, lng: -122.3875 },
  'dogpatch wineworks': { lat: 37.7595, lng: -122.3880 },
  'the sf eagle': { lat: 37.7706, lng: -122.4128 },
  'toy soldier': { lat: 37.7826, lng: -122.3991 },
  'spark social sf': { lat: 37.7694, lng: -122.3893 },
  'the san francisco mint': { lat: 37.7828, lng: -122.4068 },
  'salesforce park': { lat: 37.7897, lng: -122.3965 },
  'yerba buena gardens': { lat: 37.7851, lng: -122.4024 },
};

// Neighborhood center points for fallback geocoding
const NEIGHBORHOOD_CENTROIDS: Record<string, Coordinates> = {
  'Bayview/Hunters Point': { lat: 37.7296, lng: -122.3903 },
  'Bernal Heights': { lat: 37.7390, lng: -122.4154 },
  'Castro/Upper Market': { lat: 37.7609, lng: -122.4350 },
  'Chinatown': { lat: 37.7941, lng: -122.4078 },
  'Civic Center/Tenderloin': { lat: 37.7815, lng: -122.4175 },
  'Cole Valley': { lat: 37.7652, lng: -122.4495 },
  'Dogpatch': { lat: 37.7602, lng: -122.3893 },
  'Downtown/Union Square': { lat: 37.7880, lng: -122.4075 },
  'Excelsior': { lat: 37.7234, lng: -122.4258 },
  'Financial District': { lat: 37.7946, lng: -122.3999 },
  'Fisherman\'s Wharf': { lat: 37.8080, lng: -122.4177 },
  'Glen Park': { lat: 37.7340, lng: -122.4330 },
  'Golden Gate Park': { lat: 37.7694, lng: -122.4862 },
  'Haight-Ashbury': { lat: 37.7692, lng: -122.4481 },
  'Hayes Valley': { lat: 37.7760, lng: -122.4250 },
  'Ingleside': { lat: 37.7231, lng: -122.4477 },
  'Inner Richmond': { lat: 37.7800, lng: -122.4633 },
  'Inner Sunset': { lat: 37.7600, lng: -122.4660 },
  'Japantown': { lat: 37.7854, lng: -122.4296 },
  'Lakeshore': { lat: 37.7266, lng: -122.4869 },
  'Marina': { lat: 37.8012, lng: -122.4370 },
  'Mission': { lat: 37.7599, lng: -122.4148 },
  'Mission Bay': { lat: 37.7710, lng: -122.3905 },
  'Nob Hill': { lat: 37.7930, lng: -122.4161 },
  'Noe Valley': { lat: 37.7500, lng: -122.4330 },
  'North Beach': { lat: 37.8005, lng: -122.4100 },
  'Ocean View': { lat: 37.7180, lng: -122.4560 },
  'Outer Mission': { lat: 37.7210, lng: -122.4380 },
  'Outer Richmond': { lat: 37.7770, lng: -122.4950 },
  'Outer Sunset': { lat: 37.7520, lng: -122.4970 },
  'Pacific Heights': { lat: 37.7925, lng: -122.4350 },
  'Parkside': { lat: 37.7400, lng: -122.4850 },
  'Portola': { lat: 37.7247, lng: -122.4060 },
  'Potrero Hill': { lat: 37.7610, lng: -122.4000 },
  'Presidio': { lat: 37.7989, lng: -122.4662 },
  'Russian Hill': { lat: 37.8011, lng: -122.4194 },
  'Sea Cliff': { lat: 37.7866, lng: -122.4910 },
  'SoMa': { lat: 37.7785, lng: -122.4056 },
  'South Beach': { lat: 37.7866, lng: -122.3884 },
  'Sunset': { lat: 37.7530, lng: -122.4870 },
  'Twin Peaks': { lat: 37.7544, lng: -122.4477 },
  'Visitacion Valley': { lat: 37.7157, lng: -122.4044 },
  'West Portal': { lat: 37.7400, lng: -122.4630 },
  'Western Addition': { lat: 37.7810, lng: -122.4310 },
  'San Francisco': { lat: 37.7749, lng: -122.4194 },
  // Common alternate names
  'Castro': { lat: 37.7609, lng: -122.4350 },
  'Tenderloin': { lat: 37.7837, lng: -122.4141 },
  'SOMA': { lat: 37.7785, lng: -122.4056 },
  'FiDi': { lat: 37.7946, lng: -122.3999 },
  'The Mission': { lat: 37.7599, lng: -122.4148 },
  'The Castro': { lat: 37.7609, lng: -122.4350 },
  'Fillmore': { lat: 37.7810, lng: -122.4310 },
  'Lower Haight': { lat: 37.7725, lng: -122.4350 },
  'Upper Haight': { lat: 37.7692, lng: -122.4481 },
  'NoPa': { lat: 37.7740, lng: -122.4420 },
  'Embarcadero': { lat: 37.7933, lng: -122.3965 },
  'Union Square': { lat: 37.7880, lng: -122.4075 },
};

/**
 * Add small random jitter to avoid pin stacking at exact same point
 */
function addJitter(coords: Coordinates): Coordinates {
  const jitter = 0.002; // ~200m range
  return {
    lat: coords.lat + (Math.random() - 0.5) * jitter,
    lng: coords.lng + (Math.random() - 0.5) * jitter,
  };
}

/**
 * Try to match venue name against known venues
 */
function lookupVenue(venue: string): Coordinates | null {
  const normalized = venue.toLowerCase().trim();

  // Direct match
  if (VENUE_TO_COORDINATES[normalized]) {
    return VENUE_TO_COORDINATES[normalized];
  }

  // Partial match — check if venue contains a known name
  for (const [key, coords] of Object.entries(VENUE_TO_COORDINATES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return coords;
    }
  }

  return null;
}

/**
 * Geocode an activity — returns coordinates
 * Priority: existing coords > venue lookup > neighborhood centroid
 */
export function geocodeActivity(activity: Activity): Coordinates | null {
  // Already has coordinates
  if (activity.coordinates) {
    return activity.coordinates;
  }

  // Try venue lookup
  if (activity.venue) {
    const venueCoords = lookupVenue(activity.venue);
    if (venueCoords) return venueCoords;
  }

  // Try address lookup (check if address contains a known venue)
  if (activity.address) {
    const addrCoords = lookupVenue(activity.address);
    if (addrCoords) return addrCoords;
  }

  // Fallback to neighborhood centroid with jitter
  if (activity.neighborhood) {
    const centroid = NEIGHBORHOOD_CENTROIDS[activity.neighborhood];
    if (centroid) return addJitter(centroid);
  }

  // Last resort: SF center with jitter
  return addJitter({ lat: 37.7749, lng: -122.4194 });
}
