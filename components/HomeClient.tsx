'use client';

import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { Activity, ActivityCategory, FeedItem, NewsStory } from '@/lib/content-types';
import { Search as SearchIcon } from 'lucide-react';
import { detectNeighborhood as detectNeighborhoodFromLocation, normalizeNeighborhood } from '@/lib/sources/sf-locations';
import { geocodeActivity } from '@/lib/geocode';
import BottomNav from './ui/BottomNav';
import FilterBar from './ui/FilterBar';
import UnifiedFeed from './ui/UnifiedFeed';
import EventDetailSheet from './ui/EventDetailSheet';

// Dynamically import map to avoid SSR issues
const EventMap = dynamic(() => import('./map/EventMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-fog-gray flex items-center justify-center">
      <div className="animate-pulse text-text-muted">Loading map...</div>
    </div>
  ),
});

interface HomeClientProps {
  weeklyNews: WeeklyNews | null;
  activities: Activity[];
  newsStories: NewsStory[];
  error: string | null;
}

// Import WeeklyNews type
import type { WeeklyNews } from '@/lib/types';

// Category config
const CATEGORIES: string[] = ['All', 'Free', 'Food', 'Community', 'Nightlife', 'Outdoor', 'Events', 'News'];

const CATEGORY_TO_FILTER: Record<string, ActivityCategory | 'all' | 'news'> = {
  'All': 'all',
  'Free': 'free',
  'Food': 'food',
  'Community': 'community',
  'Nightlife': 'nightlife',
  'Outdoor': 'outdoor',
  'Events': 'events',
  'News': 'news',
};

// Map-only categories (no News on map)
const MAP_CATEGORIES: string[] = ['All', 'Free', 'Food', 'Community', 'Nightlife', 'Outdoor', 'Events'];

function isVirtualEvent(activity: Activity): boolean {
  const text = `${activity.venue || ''} ${activity.title || ''}`.toLowerCase();
  const virtualKeywords = ['virtual', 'online', 'zoom', 'webinar', 'livestream', 'remote'];
  return virtualKeywords.some(kw => text.includes(kw));
}

function hasUselessVenue(activity: Activity): boolean {
  const venue = (activity.venue || '').toLowerCase();
  const uselessPatterns = [
    'san francisco - the city',
    'the city · -',
    'to be determined',
    'tbd',
    'n/a',
    'various locations',
    'multiple venues',
  ];
  return uselessPatterns.some(p => venue.includes(p));
}

function detectNeighborhood(activity: Activity): string {
  const text = `${activity.venue || ''} ${activity.neighborhood || ''} ${activity.title || ''} ${activity.description || ''}`;
  const detected = detectNeighborhoodFromLocation(text);
  if (detected) return normalizeNeighborhood(detected);
  if (activity.neighborhood) return normalizeNeighborhood(activity.neighborhood);
  return 'San Francisco';
}

function formatLiveDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function HomeClient({ activities, newsStories, weeklyNews, error }: HomeClientProps) {
  const [activeView, setActiveView] = useState<'map' | 'feed' | 'search'>('map');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeNeighborhoodFilter, setActiveNeighborhoodFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [geoJson, setGeoJson] = useState<any>(null);

  // Load GeoJSON for map
  useEffect(() => {
    fetch('/data/sf-neighborhoods.geojson')
      .then(res => res.json())
      .then(setGeoJson)
      .catch(console.error);
  }, []);

  // Geocode activities that don't have coordinates
  const mappableActivities = useMemo(() => {
    return activities
      .filter(a => !isVirtualEvent(a) && !hasUselessVenue(a))
      .map(a => {
        if (a.coordinates) return a;
        const coords = geocodeActivity(a);
        if (coords) return { ...a, coordinates: coords };
        return a;
      })
      .filter(a => !!a.coordinates);
  }, [activities]);

  // Unique neighborhoods for filter bar
  const neighborhoods = useMemo(() => {
    const set = new Set<string>();
    activities.forEach(a => {
      const n = detectNeighborhood(a);
      if (n !== 'San Francisco') set.add(n);
    });
    return ['All', ...Array.from(set).sort()];
  }, [activities]);

  // Build unified feed items
  const feedItems = useMemo((): FeedItem[] => {
    const catFilter = CATEGORY_TO_FILTER[activeCategory] || 'all';

    let eventItems: FeedItem[] = [];
    let newsItems: FeedItem[] = [];

    if (catFilter !== 'news') {
      const filtered = activities.filter(a => {
        if (catFilter !== 'all' && a.category !== catFilter) return false;
        if (activeNeighborhoodFilter !== 'All') {
          const n = detectNeighborhood(a);
          if (n !== activeNeighborhoodFilter) return false;
        }
        return true;
      });
      eventItems = filtered.map(a => ({ type: 'event' as const, data: a }));
    }

    if (catFilter === 'all' || catFilter === 'news') {
      const filtered = newsStories.filter(s => {
        if (activeNeighborhoodFilter !== 'All' && s.neighborhood !== activeNeighborhoodFilter) return false;
        return true;
      });
      newsItems = filtered.map(s => ({ type: 'news' as const, data: s }));
    }

    return [...newsItems, ...eventItems];
  }, [activities, newsStories, activeCategory, activeNeighborhoodFilter]);

  // Search filtered results
  const searchResults = useMemo((): FeedItem[] => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();

    const matchingEvents: FeedItem[] = activities
      .filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.venue.toLowerCase().includes(q) ||
        a.tags.some(t => t.toLowerCase().includes(q))
      )
      .map(a => ({ type: 'event' as const, data: a }));

    const matchingNews: FeedItem[] = newsStories
      .filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q) ||
        (s.keywords && s.keywords.some(k => k.toLowerCase().includes(q)))
      )
      .map(s => ({ type: 'news' as const, data: s }));

    return [...matchingNews, ...matchingEvents];
  }, [searchQuery, activities, newsStories]);

  return (
    <main className="h-screen flex flex-col bg-background">
      {/* Editorial Masthead */}
      <header className="bg-card-bg border-b border-card-border px-4 py-3 z-20">
        <div className="max-w-7xl mx-auto text-center">
          <p className="section-label mb-0.5">San Francisco</p>
          <h1 className="editorial-headline text-2xl">The Narrative</h1>
          <p className="text-[11px] text-text-muted mt-0.5">{formatLiveDate()}</p>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="bg-terracotta/10 border-b border-terracotta/30 px-4 py-2 text-sm text-terracotta">
          {error}
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 overflow-hidden relative">
        {/* MAP VIEW */}
        {activeView === 'map' && (
          <div className="h-full w-full relative">
            {/* Floating category pills */}
            <div className="map-filter-bar">
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 px-1">
                {MAP_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`whitespace-nowrap transition-smooth px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      activeCategory === cat
                        ? 'bg-foreground text-background shadow-lg'
                        : 'bg-white text-foreground border border-card-border shadow-md hover:bg-fog-gray'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <EventMap
              activities={mappableActivities}
              geoJsonData={geoJson}
              activeCategory={activeCategory}
              onActivitySelect={(activity) => setSelectedActivity(activity)}
              selectedActivityId={selectedActivity?.id}
            />

            <EventDetailSheet
              activity={selectedActivity}
              isOpen={!!selectedActivity}
              onClose={() => setSelectedActivity(null)}
            />
          </div>
        )}

        {/* FEED VIEW */}
        {activeView === 'feed' && (
          <div className="h-full overflow-y-auto">
            {/* Feed intro */}
            <div className="px-4 pt-4 pb-2">
              <h2 className="editorial-headline text-lg">This Week in SF</h2>
              <hr className="editorial-rule mt-2" />
            </div>

            <FilterBar
              categories={CATEGORIES}
              neighborhoods={neighborhoods}
              activeCategory={activeCategory}
              activeNeighborhood={activeNeighborhoodFilter}
              onCategoryChange={(cat) => setActiveCategory(cat)}
              onNeighborhoodChange={(n) => setActiveNeighborhoodFilter(n)}
            />
            <UnifiedFeed items={feedItems} />
          </div>
        )}

        {/* SEARCH VIEW */}
        {activeView === 'search' && (
          <div className="h-full overflow-y-auto">
            <div className="px-4 pt-4 pb-2">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search events, news, neighborhoods..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-card-border bg-card-bg text-foreground text-sm italic placeholder:text-text-muted placeholder:italic focus:outline-none focus:ring-2 focus:ring-ocean-teal/50"
                  autoFocus
                />
              </div>
            </div>

            {searchQuery.trim() ? (
              <UnifiedFeed items={searchResults} />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <SearchIcon className="w-8 h-8 text-text-muted mb-3" />
                <p className="editorial-headline text-base text-text-muted">Find your next SF moment</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeView} onTabChange={setActiveView} />
    </main>
  );
}
