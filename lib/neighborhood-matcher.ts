import type { NewsArticle } from './types';

// Neighborhood patterns with aliases and common misspellings
const NEIGHBORHOOD_PATTERNS: Record<string, RegExp> = {
  'Mission': /\b(mission|la mission)\b/i,
  'Castro': /\bcastro\b/i,
  'South of Market': /\b(soma|south of market)\b/i,
  'Financial District': /\b(financial district|fidi|downtown)\b/i,
  'Haight-Ashbury': /\b(haight|ashbury|haight-ashbury)\b/i,
  'Chinatown': /\bchinatown\b/i,
  'North Beach': /\bnorth beach\b/i,
  'Marina': /\bmarina\b/i,
  'Pacific Heights': /\bpacific heights\b/i,
  'Richmond': /\b(richmond|inner richmond|outer richmond)\b/i,
  'Sunset': /\b(sunset|inner sunset|outer sunset)\b/i,
  'Tenderloin': /\btenderloin\b/i,
  'Western Addition': /\bwestern addition\b/i,
  'Potrero Hill': /\bpotrero hill\b/i,
  'Dogpatch': /\bdogpatch\b/i,
  'Bayview': /\bbayview\b/i,
  'Noe Valley': /\bnoe valley\b/i,
  'Glen Park': /\bglen park\b/i,
  'Bernal Heights': /\bbernal heights\b/i,
  'Russian Hill': /\brussian hill\b/i,
  'Nob Hill': /\bnob hill\b/i,
  'Telegraph Hill': /\btelegraph hill\b/i,
  'Embarcadero': /\bembarcadero\b/i,
  'Presidio': /\bpresidio\b/i,
  'Seacliff': /\bseacliff\b/i,
  'Twin Peaks': /\btwin peaks\b/i,
  'Excelsior': /\bexcelsior\b/i,
  'Visitacion Valley': /\bvisitacion valley\b/i,
  'Parkside': /\bparkside\b/i,
  'Ocean View': /\bocean view\b/i,
  'Lakeshore': /\blakeshore\b/i,
  'West of Twin Peaks': /\bwest of twin peaks\b/i,
  'Crocker Amazon': /\bcrocker amazon\b/i,
  'Diamond Heights': /\bdiamond heights\b/i,
  'Presidio Heights': /\bpresidio heights\b/i,
  'Golden Gate Park': /\bgolden gate park\b/i,
  'Outer Mission': /\bouter mission\b/i
};

/**
 * Extract SF neighborhoods from article using rule-based pattern matching
 * Fast, reliable, no API calls
 */
export function extractNeighborhoodsRuleBased(article: NewsArticle): string[] {
  const text = `${article.title} ${article.snippet}`.toLowerCase();
  const found: string[] = [];

  for (const [neighborhood, pattern] of Object.entries(NEIGHBORHOOD_PATTERNS)) {
    if (pattern.test(text)) {
      found.push(neighborhood);
    }
  }

  // Map to GeoJSON neighborhood names
  return found.length > 0 ? mapToGeoJSONNames(found) : [];
}

/**
 * Map pattern neighborhood names to exact GeoJSON property names
 * Ensures consistency with the GeoJSON data used by the map
 */
function mapToGeoJSONNames(neighborhoods: string[]): string[] {
  const mapping: Record<string, string> = {
    'Mission': 'Mission',
    'Castro': 'Castro/Upper Market',
    'South of Market': 'South of Market',
    'Financial District': 'Financial District',
    'Haight-Ashbury': 'Haight Ashbury',
    'Chinatown': 'Chinatown',
    'North Beach': 'North Beach',
    'Marina': 'Marina',
    'Pacific Heights': 'Pacific Heights',
    'Richmond': 'Inner Richmond',
    'Sunset': 'Inner Sunset',
    'Tenderloin': 'Tenderloin',
    'Western Addition': 'Western Addition',
    'Potrero Hill': 'Potrero Hill',
    'Dogpatch': 'Potrero Hill', // Dogpatch is part of Potrero Hill in GeoJSON
    'Bayview': 'Bayview',
    'Noe Valley': 'Noe Valley',
    'Glen Park': 'Glen Park',
    'Bernal Heights': 'Bernal Heights',
    'Russian Hill': 'Russian Hill',
    'Nob Hill': 'Nob Hill',
    'Telegraph Hill': 'North Beach', // Telegraph Hill is part of North Beach
    'Embarcadero': 'Financial District', // Embarcadero is part of Financial District
    'Presidio': 'Presidio',
    'Seacliff': 'Seacliff',
    'Twin Peaks': 'Twin Peaks',
    'Excelsior': 'Excelsior',
    'Visitacion Valley': 'Visitacion Valley',
    'Parkside': 'Parkside',
    'Ocean View': 'Ocean View',
    'Lakeshore': 'Lakeshore',
    'West of Twin Peaks': 'West of Twin Peaks',
    'Crocker Amazon': 'Crocker Amazon',
    'Diamond Heights': 'Diamond Heights',
    'Presidio Heights': 'Presidio Heights',
    'Golden Gate Park': 'Golden Gate Park',
    'Outer Mission': 'Outer Mission'
  };

  // Map and deduplicate
  return neighborhoods
    .map(n => mapping[n] || n)
    .filter((value, index, array) => array.indexOf(value) === index);
}
