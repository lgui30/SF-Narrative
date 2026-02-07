/**
 * SF Location Detection
 * Comprehensive mapping of venues, addresses, and landmarks to neighborhoods
 */

// SF Neighborhood boundaries by zip code
export const ZIP_TO_NEIGHBORHOOD: Record<string, string> = {
  '94102': 'Hayes Valley',      // Hayes Valley, Civic Center, Tenderloin
  '94103': 'SoMa',              // South of Market
  '94104': 'Financial District',
  '94105': 'Financial District', // Embarcadero South
  '94107': 'SoMa',              // South Beach, Mission Bay
  '94108': 'Chinatown',
  '94109': 'Nob Hill',          // Nob Hill, Russian Hill, Polk Gulch
  '94110': 'Mission',           // Mission District
  '94111': 'Embarcadero',       // Financial District North
  '94112': 'Excelsior',         // Excelsior, Outer Mission
  '94114': 'Castro',            // Castro, Noe Valley
  '94115': 'Pacific Heights',   // Pacific Heights, Japantown, Western Addition
  '94116': 'Sunset',            // Parkside, Inner Sunset
  '94117': 'Haight',            // Haight-Ashbury, Cole Valley
  '94118': 'Richmond',          // Inner Richmond
  '94121': 'Richmond',          // Outer Richmond
  '94122': 'Sunset',            // Outer Sunset
  '94123': 'Marina',            // Marina, Cow Hollow
  '94124': 'Bayview',           // Bayview, Hunters Point
  '94127': 'West Portal',       // West Portal, St. Francis Wood
  '94129': 'Presidio',
  '94130': 'Treasure Island',
  '94131': 'Glen Park',         // Glen Park, Diamond Heights
  '94132': 'Lake Merced',       // Stonestown, Lake Merced
  '94133': 'North Beach',       // North Beach, Telegraph Hill
  '94134': 'Visitacion Valley',
  '94158': 'Mission Bay',       // UCSF, Mission Bay
};

// Well-known SF venues mapped to neighborhoods
export const VENUE_TO_NEIGHBORHOOD: Record<string, string> = {
  // Major venues
  'chase center': 'Mission Bay',
  'oracle park': 'SoMa',
  'at&t park': 'SoMa',
  'moscone': 'SoMa',
  'moscone center': 'SoMa',
  'bill graham civic': 'Civic Center',
  'bill graham civic auditorium': 'Civic Center',
  'the fillmore': 'Western Addition',
  'fillmore': 'Western Addition',
  'great american music hall': 'Tenderloin',
  'the warfield': 'Tenderloin',
  'warfield': 'Tenderloin',
  'palace of fine arts': 'Marina',
  'exploratorium': 'Embarcadero',
  'de young museum': 'Golden Gate Park',
  'de young': 'Golden Gate Park',
  'california academy of sciences': 'Golden Gate Park',
  'cal academy': 'Golden Gate Park',
  'sfmoma': 'SoMa',
  'sf moma': 'SoMa',
  'museum of modern art': 'SoMa',
  'asian art museum': 'Civic Center',
  'davies symphony hall': 'Civic Center',
  'war memorial opera house': 'Civic Center',
  'herbst theatre': 'Civic Center',
  'yerba buena center': 'SoMa',
  'yerba buena gardens': 'SoMa',
  'ferry building': 'Embarcadero',
  'pier 39': 'Fisherman\'s Wharf',
  'pier 35': 'Embarcadero',
  'pier 27': 'Embarcadero',
  'fort mason': 'Marina',
  'fort mason center': 'Marina',
  'presidio': 'Presidio',
  'crissy field': 'Presidio',
  'golden gate park': 'Golden Gate Park',
  'dolores park': 'Mission',
  'mission dolores park': 'Mission',
  'alamo square': 'Western Addition',
  'buena vista park': 'Haight',
  'union square': 'Downtown',
  'civic center': 'Civic Center',
  'city hall': 'Civic Center',
  'sf city hall': 'Civic Center',

  // Theaters
  'castro theatre': 'Castro',
  'castro theater': 'Castro',
  'roxie theater': 'Mission',
  'victoria theatre': 'Mission',
  'balboa theatre': 'Richmond',
  'alamo drafthouse': 'Mission',
  'amc metreon': 'SoMa',
  'metreon': 'SoMa',
  'orpheum theatre': 'Civic Center',
  'golden gate theatre': 'Tenderloin',
  'curran theatre': 'Downtown',

  // Clubs and nightlife
  'the independent': 'Western Addition',
  'independent': 'Western Addition',
  'slim\'s': 'SoMa',
  'bottom of the hill': 'Potrero Hill',
  'august hall': 'Tenderloin',
  'mezzanine': 'SoMa',
  'dna lounge': 'SoMa',
  'public works': 'Mission',
  'el rio': 'Mission',
  'the chapel': 'Mission',
  'chapel': 'Mission',
  'rickshaw stop': 'Civic Center',
  'the knockout': 'Mission',
  'amnesia': 'Mission',
  'cafe du nord': 'Castro',
  'swedish american hall': 'Castro',
  'bimbo\'s 365 club': 'North Beach',
  'bimbo\'s': 'North Beach',
  'the saloon': 'North Beach',
  'cobb\'s comedy club': 'North Beach',
  'cobbs comedy': 'North Beach',
  'punch line': 'Financial District',
  'punchline': 'Financial District',
  'oasis': 'SoMa',
  'the stud': 'SoMa',
  'audio': 'SoMa',
  'audio sf': 'SoMa',
  'temple': 'SoMa',
  'temple nightclub': 'SoMa',
  'halcyon': 'SoMa',
  'monarch': 'SoMa',
  'f8': 'SoMa',
  'city nights': 'SoMa',
  'the midway': 'Dogpatch',
  'midway sf': 'Dogpatch',

  // Food halls and markets
  'ferry plaza farmers market': 'Embarcadero',
  'ferry plaza': 'Embarcadero',
  'off the grid': 'Fort Mason',
  'spark social': 'Mission Bay',
  'the market': 'Embarcadero',
  'gotts roadside': 'Embarcadero',
  'alemany farmers market': 'Bernal Heights',

  // Sports
  'kezar stadium': 'Haight',
  'kezar pavilion': 'Haight',

  // Co-working and tech
  'galvanize': 'SoMa',
  'wework': 'SoMa',
  'general assembly': 'SoMa',
  'the vault': 'Financial District',

  // Libraries
  'sf public library': 'Civic Center',
  'main library': 'Civic Center',
  'mission branch library': 'Mission',

  // UCSF
  'ucsf': 'Mission Bay',
  'ucsf mission bay': 'Mission Bay',
  'ucsf parnassus': 'Inner Sunset',

  // Universities
  'sf state': 'Lake Merced',
  'sfsu': 'Lake Merced',
  'uc hastings': 'Tenderloin',
  'usf': 'Inner Richmond',
  'university of san francisco': 'Inner Richmond',
  'golden gate university': 'SoMa',

  // Popular event venues and bars
  'manny\'s': 'Mission',
  'mannys': 'Mission',
  'toy soldier': 'SoMa',
  'toy soldier sf': 'SoMa',
  'soundtrack': 'SoMa',
  'soundtrackbar': 'SoMa',
  'the social study': 'Hayes Valley',
  'social study': 'Hayes Valley',
  'madrone art bar': 'Western Addition',
  'zeitgeist': 'Mission',
  'dolores park cafe': 'Mission',
  'southern pacific brewing': 'Mission',
  'tempest': 'SoMa',
  'driftwood': 'SoMa',
  'trick dog': 'Mission',
  'latin american club': 'Mission',
  'knockout': 'Mission',
  'makeout room': 'Mission',
  'elixir': 'Mission',
  'wild side west': 'Bernal Heights',
  'riptide': 'Sunset',
  'ireland\'s 32': 'Richmond',
  'plough and stars': 'Richmond',
  'trad\'r sam': 'Richmond',
  'last rites': 'Downtown',
  'kozy kar': 'SoMa',
  'audio discotech': 'SoMa',
  'the armory club': 'Mission',

  // Community centers
  'southeast community center': 'Bayview',
  'southeast community facility': 'Bayview',
  'bayview opera house': 'Bayview',
  'joe goode annex': 'Mission',
  'joe goode': 'Mission',
  'sf lgbt center': 'Castro',
  'lgbt center': 'Castro',
  'glbt history museum': 'Castro',
  'eureka valley rec center': 'Castro',
  'mission cultural center': 'Mission',
  'brava theater': 'Mission',
  'mission neighborhood center': 'Mission',

  // Art galleries and spaces
  'scott richards contemporary art': 'North Beach',
  'minnesota street project': 'Dogpatch',
  'catharine clark gallery': 'SoMa',
  '111 minna': 'SoMa',
  '111 minna gallery': 'SoMa',
  'gray area': 'Mission',
  'root division': 'SoMa',
  'southern exposure': 'SoMa',
  'alter space': 'Mission',
  'artists\' television access': 'Mission',
  'ata': 'Mission',

  // Food halls and restaurants often used for events
  'the crafty fox': 'Mission',
  'urban putt': 'Mission',
  'emporium sf': 'Western Addition',
  'emporium arcade bar': 'Western Addition',
  'folsom street foundry': 'SoMa',
  'sf eagle': 'SoMa',
  'powerhouse': 'SoMa',
  'lone star saloon': 'SoMa',

  // Additional nightlife venues
  'the great northern': 'SoMa',
  'great northern': 'SoMa',
  'the valencia room': 'Mission',
  'valencia room': 'Mission',
  'barbarossa lounge': 'North Beach',
  'barbarossa': 'North Beach',
  'the function sf': 'SoMa',
  'function sf': 'SoMa',
  'the budda': 'SoMa',
  'budda lounge': 'SoMa',
  'origin sf': 'SoMa',
  'endup': 'SoMa',
  'the endup': 'SoMa',
  'cat club': 'SoMa',
  'the cat club': 'SoMa',
  'holy cow': 'SoMa',
  'ruby skye': 'Downtown',
  'raven bar': 'SoMa',
  'butter': 'SoMa',
  'verso': 'SoMa',
  'audio nightclub': 'SoMa',
  'love + propaganda': 'Downtown',
  'infusion lounge': 'Downtown',
  'nova': 'SoMa',
  '1015 folsom': 'SoMa',

  // Theaters and performance venues
  'marines\' memorial theatre': 'Downtown',
  'marines memorial': 'Downtown',
  'american conservatory theater': 'Downtown',
  'act': 'Downtown',
  'geary theater': 'Downtown',
  'sfjazz': 'Hayes Valley',
  'sf jazz center': 'Hayes Valley',
  'the marsh': 'Mission',
  'marsh theater': 'Mission',
  'magic theatre': 'Marina',
  'z space': 'SoMa',
  'counterpulse': 'Tenderloin',
  'odc theater': 'Mission',
  'dance mission': 'Mission',
  'bats improv': 'Marina',
  'punch line comedy club': 'Financial District',

  // Event spaces and conference centers
  'renaissance entrepreneurship center': 'Mission',
  'the san francisco mint': 'SoMa',
  'old mint': 'SoMa',
  'sf mint': 'SoMa',
  'the pearl': 'SoMa',
  'terra gallery': 'SoMa',
  'terra sf': 'SoMa',
  'bently reserve': 'Financial District',
  'bentley reserve': 'Financial District',
  'city view at metreon': 'SoMa',
  'hotel nikko': 'Downtown',
  'the regency center': 'Civic Center',
  'regency ballroom': 'Civic Center',
  'grand hyatt': 'Downtown',
  'palace hotel': 'Downtown',
  'westin st. francis': 'Downtown',
  'w hotel': 'SoMa',
  'hotel vitale': 'Embarcadero',
  'hyatt regency': 'Embarcadero',
};

// Street patterns that indicate specific neighborhoods
export const STREET_TO_NEIGHBORHOOD: Record<string, string> = {
  'valencia st': 'Mission',
  'valencia street': 'Mission',
  'mission st': 'Mission',
  'mission street': 'Mission',
  '16th st': 'Mission',
  '16th street': 'Mission',
  '24th st': 'Mission',
  '24th street': 'Mission',
  'castro st': 'Castro',
  'castro street': 'Castro',
  'market st': 'Downtown',
  'market street': 'Downtown',
  'haight st': 'Haight',
  'haight street': 'Haight',
  'fillmore st': 'Western Addition',
  'fillmore street': 'Western Addition',
  'polk st': 'Nob Hill',
  'polk street': 'Nob Hill',
  'columbus ave': 'North Beach',
  'columbus avenue': 'North Beach',
  'grant ave': 'Chinatown',
  'grant avenue': 'Chinatown',
  'stockton st': 'Chinatown',
  'stockton street': 'Chinatown',
  'geary blvd': 'Richmond',
  'geary boulevard': 'Richmond',
  'clement st': 'Richmond',
  'clement street': 'Richmond',
  'irving st': 'Sunset',
  'irving street': 'Sunset',
  'judah st': 'Sunset',
  'judah street': 'Sunset',
  'taraval st': 'Sunset',
  'taraval street': 'Sunset',
  'noriega st': 'Sunset',
  'noriega street': 'Sunset',
  'chestnut st': 'Marina',
  'chestnut street': 'Marina',
  'union st': 'Marina',
  'union street': 'Marina',
  'divisadero st': 'Western Addition',
  'divisadero street': 'Western Addition',
  'hayes st': 'Hayes Valley',
  'hayes street': 'Hayes Valley',
  'howard st': 'SoMa',
  'howard street': 'SoMa',
  'folsom st': 'SoMa',
  'folsom street': 'SoMa',
  'brannan st': 'SoMa',
  'brannan street': 'SoMa',
  'townsend st': 'SoMa',
  'townsend street': 'SoMa',
  '3rd st': 'SoMa',
  '3rd street': 'SoMa',
  'third st': 'SoMa',
  'third street': 'SoMa',
  'embarcadero': 'Embarcadero',
  'the embarcadero': 'Embarcadero',
  'broadway': 'North Beach',
  'jefferson st': 'Fisherman\'s Wharf',
  'jefferson street': 'Fisherman\'s Wharf',
  'beach st': 'Fisherman\'s Wharf',
  'beach street': 'Fisherman\'s Wharf',
  'fisherman\'s wharf': 'Fisherman\'s Wharf',
  'pier': 'Embarcadero',
  'potrero ave': 'Potrero Hill',
  'potrero avenue': 'Potrero Hill',
  '3rd st bridge': 'Dogpatch',
  'illinois st': 'Dogpatch',
  'illinois street': 'Dogpatch',
  'minnesota st': 'Dogpatch',
  'minnesota street': 'Dogpatch',
  'pacific ave': 'North Beach',
  'pacific avenue': 'North Beach',
  'kearny st': 'Chinatown',
  'kearny street': 'Chinatown',
  'california st': 'Nob Hill',
  'california street': 'Nob Hill',
  'sacramento st': 'Pacific Heights',
  'sacramento street': 'Pacific Heights',
  'bush st': 'Downtown',
  'bush street': 'Downtown',
  'post st': 'Downtown',
  'post street': 'Downtown',
  'sutter st': 'Downtown',
  'sutter street': 'Downtown',
  'o\'farrell': 'Tenderloin',
  'ofarrell': 'Tenderloin',
  'turk st': 'Tenderloin',
  'turk street': 'Tenderloin',
  'eddy st': 'Tenderloin',
  'eddy street': 'Tenderloin',
  'jones st': 'Tenderloin',
  'jones street': 'Tenderloin',
  'larkin st': 'Civic Center',
  'larkin street': 'Civic Center',
  'van ness': 'Civic Center',
  'octavia': 'Hayes Valley',
  'gough st': 'Hayes Valley',
  'gough street': 'Hayes Valley',
  'laguna st': 'Western Addition',
  'laguna street': 'Western Addition',
  'webster st': 'Western Addition',
  'webster street': 'Western Addition',
  'steiner st': 'Western Addition',
  'steiner street': 'Western Addition',
  'scott st': 'Western Addition',
  'scott street': 'Western Addition',
  'pierce st': 'Pacific Heights',
  'pierce street': 'Pacific Heights',
  'lyon st': 'Pacific Heights',
  'lyon street': 'Pacific Heights',
  'baker st': 'Marina',
  'baker street': 'Marina',
  'greenwich st': 'Marina',
  'greenwich street': 'Marina',
  'lombard st': 'Marina',
  'lombard street': 'Marina',
  'bay st': 'Marina',
  'bay street': 'Marina',
  'south van ness': 'Mission',
  'cesar chavez': 'Mission',
  'army st': 'Mission',
  'army street': 'Mission',
  'cortland': 'Bernal Heights',
  'cortland ave': 'Bernal Heights',
  'cortland avenue': 'Bernal Heights',
  '20th st': 'Mission',
  '20th street': 'Mission',
  '22nd st': 'Mission',
  '22nd street': 'Mission',
  '18th st': 'Mission',
  '18th street': 'Mission',
  '19th st': 'Mission',
  '19th street': 'Mission',
  '11th st': 'SoMa',
  '11th street': 'SoMa',
  '9th st': 'SoMa',
  '9th street': 'SoMa',
  '8th st': 'SoMa',
  '8th street': 'SoMa',
  '7th st': 'SoMa',
  '7th street': 'SoMa',
  '6th st': 'SoMa',
  '6th street': 'SoMa',
  '5th st': 'SoMa',
  '5th street': 'SoMa',
  '4th st': 'SoMa',
  '4th street': 'SoMa',
  '2nd st': 'SoMa',
  '2nd street': 'SoMa',
  '1st st': 'SoMa',
  '1st street': 'SoMa',
};

// Neighborhood name variations/aliases
export const NEIGHBORHOOD_ALIASES: Record<string, string> = {
  'soma': 'SoMa',
  'south of market': 'SoMa',
  'south beach': 'SoMa',
  'fidi': 'Financial District',
  'downtown': 'Downtown',
  'tenderloin': 'Tenderloin',
  'tl': 'Tenderloin',
  'nob hill': 'Nob Hill',
  'russian hill': 'Russian Hill',
  'north beach': 'North Beach',
  'chinatown': 'Chinatown',
  'financial district': 'Financial District',
  'embarcadero': 'Embarcadero',
  'fisherman\'s wharf': 'Fisherman\'s Wharf',
  'fishermans wharf': 'Fisherman\'s Wharf',
  'marina': 'Marina',
  'marina district': 'Marina',
  'cow hollow': 'Marina',
  'pacific heights': 'Pacific Heights',
  'pac heights': 'Pacific Heights',
  'presidio': 'Presidio',
  'presidio heights': 'Presidio Heights',
  'japantown': 'Japantown',
  'japan town': 'Japantown',
  'western addition': 'Western Addition',
  'lower haight': 'Haight',
  'upper haight': 'Haight',
  'haight ashbury': 'Haight',
  'haight-ashbury': 'Haight',
  'cole valley': 'Cole Valley',
  'hayes valley': 'Hayes Valley',
  'civic center': 'Civic Center',
  'mission': 'Mission',
  'mission district': 'Mission',
  'inner mission': 'Mission',
  'outer mission': 'Excelsior',
  'castro': 'Castro',
  'the castro': 'Castro',
  'upper market': 'Castro',
  'noe valley': 'Noe Valley',
  'noe': 'Noe Valley',
  'glen park': 'Glen Park',
  'diamond heights': 'Glen Park',
  'bernal heights': 'Bernal Heights',
  'bernal': 'Bernal Heights',
  'potrero hill': 'Potrero Hill',
  'potrero': 'Potrero Hill',
  'dogpatch': 'Dogpatch',
  'dog patch': 'Dogpatch',
  'mission bay': 'Mission Bay',
  'bayview': 'Bayview',
  'hunters point': 'Bayview',
  'hunter\'s point': 'Bayview',
  'visitacion valley': 'Visitacion Valley',
  'excelsior': 'Excelsior',
  'crocker amazon': 'Excelsior',
  'sunset': 'Sunset',
  'outer sunset': 'Sunset',
  'inner sunset': 'Inner Sunset',
  'parkside': 'Sunset',
  'richmond': 'Richmond',
  'inner richmond': 'Richmond',
  'outer richmond': 'Richmond',
  'golden gate park': 'Golden Gate Park',
  'ggp': 'Golden Gate Park',
  'lake merced': 'Lake Merced',
  'west portal': 'West Portal',
  'forest hill': 'Forest Hill',
  'twin peaks': 'Twin Peaks',
  'treasure island': 'Treasure Island',
  'yerba buena': 'SoMa',
  'yerba buena gardens': 'SoMa',
  'fort mason': 'Marina',
};

/**
 * Detect neighborhood from text (venue, address, description)
 * Uses multiple strategies for best accuracy
 */
export function detectNeighborhood(text: string): string | undefined {
  if (!text) return undefined;

  const lowerText = text.toLowerCase();

  // 1. Check for zip codes first (most accurate)
  const zipMatch = text.match(/\b(94\d{3})\b/);
  if (zipMatch && ZIP_TO_NEIGHBORHOOD[zipMatch[1]]) {
    return ZIP_TO_NEIGHBORHOOD[zipMatch[1]];
  }

  // 2. Check for known venues (very accurate)
  for (const [venue, neighborhood] of Object.entries(VENUE_TO_NEIGHBORHOOD)) {
    if (lowerText.includes(venue)) {
      return neighborhood;
    }
  }

  // 3. Check for street patterns
  for (const [street, neighborhood] of Object.entries(STREET_TO_NEIGHBORHOOD)) {
    if (lowerText.includes(street)) {
      return neighborhood;
    }
  }

  // 4. Check for neighborhood names/aliases
  for (const [alias, canonical] of Object.entries(NEIGHBORHOOD_ALIASES)) {
    // Use word boundary matching for short aliases
    if (alias.length < 5) {
      const regex = new RegExp(`\\b${alias}\\b`, 'i');
      if (regex.test(lowerText)) {
        return canonical;
      }
    } else if (lowerText.includes(alias)) {
      return canonical;
    }
  }

  return undefined;
}

/**
 * Normalize neighborhood name to canonical form
 */
export function normalizeNeighborhood(name: string): string {
  const lower = name.toLowerCase();
  return NEIGHBORHOOD_ALIASES[lower] || name;
}

/**
 * Get all canonical neighborhood names
 */
export function getAllNeighborhoods(): string[] {
  return [
    'Bayview',
    'Bernal Heights',
    'Castro',
    'Chinatown',
    'Civic Center',
    'Cole Valley',
    'Dogpatch',
    'Downtown',
    'Embarcadero',
    'Excelsior',
    'Financial District',
    'Fisherman\'s Wharf',
    'Forest Hill',
    'Glen Park',
    'Golden Gate Park',
    'Haight',
    'Hayes Valley',
    'Inner Sunset',
    'Japantown',
    'Lake Merced',
    'Marina',
    'Mission',
    'Mission Bay',
    'Nob Hill',
    'Noe Valley',
    'North Beach',
    'Pacific Heights',
    'Potrero Hill',
    'Presidio',
    'Presidio Heights',
    'Richmond',
    'Russian Hill',
    'SoMa',
    'Sunset',
    'Tenderloin',
    'Treasure Island',
    'Twin Peaks',
    'Visitacion Valley',
    'West Portal',
    'Western Addition',
  ];
}
