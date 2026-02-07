'use client';

import { useState, useEffect } from 'react';
import { Activity, ActivityCategory } from '@/lib/content-types';
import {
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  Tag,
  ExternalLink,
  Filter,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ActivitiesSectionProps {
  initialActivities?: Activity[];
}

const CATEGORY_COLORS: Record<ActivityCategory, string> = {
  events: 'bg-purple-100 text-purple-800',
  outdoor: 'bg-green-100 text-green-800',
  food: 'bg-orange-100 text-orange-800',
  community: 'bg-blue-100 text-blue-800',
  nightlife: 'bg-pink-100 text-pink-800',
  free: 'bg-yellow-100 text-yellow-800',
};

const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  events: 'Events',
  outdoor: 'Outdoor',
  food: 'Food & Drink',
  community: 'Community',
  nightlife: 'Nightlife',
  free: 'Free',
};

function ActivityCard({ activity }: { activity: Activity }) {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPrice = (price: Activity['price']) => {
    if (price.isFree) return 'Free';
    if (price.min === price.max) return `$${price.min}`;
    return `$${price.min} - $${price.max}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  CATEGORY_COLORS[activity.category]
                }`}
              >
                {CATEGORY_LABELS[activity.category]}
              </span>
              {activity.price.isFree && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Free
                </span>
              )}
            </div>
            <h3 className="font-semibold text-gray-900 line-clamp-2">
              {activity.title}
            </h3>
          </div>
        </div>

        {/* Details */}
        <div className="mt-3 space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>{formatDate(activity.date)}</span>
            {activity.time && (
              <>
                <Clock className="w-4 h-4 text-gray-400 ml-2" />
                <span>{activity.time}</span>
                {activity.endTime && <span>- {activity.endTime}</span>}
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="truncate">{activity.venue}</span>
          </div>

          {activity.neighborhood && (
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-gray-400" />
              <span>{activity.neighborhood}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span>{formatPrice(activity.price)}</span>
          </div>
        </div>

        {/* Expandable description */}
        {activity.description && (
          <div className="mt-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Show more
                </>
              )}
            </button>

            {expanded && (
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                {activity.description}
              </p>
            )}
          </div>
        )}

        {/* Tags */}
        {activity.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {activity.tags.slice(0, 5).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-gray-400">via {activity.source}</span>
          <a
            href={activity.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Event
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ActivitiesSection({
  initialActivities = [],
}: ActivitiesSectionProps) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [loading, setLoading] = useState(initialActivities.length === 0);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedCategories, setSelectedCategories] = useState<ActivityCategory[]>([]);
  const [freeOnly, setFreeOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Load activities
  useEffect(() => {
    if (initialActivities.length > 0) return;

    async function loadActivities() {
      try {
        const params = new URLSearchParams();
        if (selectedCategories.length > 0) {
          params.set('categories', selectedCategories.join(','));
        }
        if (freeOnly) {
          params.set('freeOnly', 'true');
        }
        if (searchQuery) {
          params.set('search', searchQuery);
        }
        params.set('limit', '50');

        const response = await fetch(`/api/activities?${params}`);
        const data = await response.json();

        if (data.success) {
          setActivities(data.data.items);
        } else {
          setError(data.error || 'Failed to load activities');
        }
      } catch (err) {
        setError('Failed to load activities');
      } finally {
        setLoading(false);
      }
    }

    loadActivities();
  }, [initialActivities.length, selectedCategories, freeOnly, searchQuery]);

  // Filter activities locally for responsive filtering
  const filteredActivities = activities.filter((activity) => {
    // Category filter
    if (
      selectedCategories.length > 0 &&
      !selectedCategories.includes(activity.category)
    ) {
      return false;
    }

    // Free only filter
    if (freeOnly && !activity.price.isFree) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        activity.title.toLowerCase().includes(query) ||
        activity.description.toLowerCase().includes(query) ||
        activity.venue.toLowerCase().includes(query) ||
        activity.tags.some((tag) => tag.toLowerCase().includes(query));

      if (!matchesSearch) return false;
    }

    return true;
  });

  const toggleCategory = (category: ActivityCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Things to Do in SF
          </h2>
          <p className="text-gray-600">
            {filteredActivities.length} activities found
          </p>
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Filter className="w-4 h-4" />
          Filters
          {(selectedCategories.length > 0 || freeOnly) && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
              {selectedCategories.length + (freeOnly ? 1 : 0)}
            </span>
          )}
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search activities..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categories
            </label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(CATEGORY_LABELS) as ActivityCategory[]).map(
                (category) => (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedCategories.includes(category)
                        ? CATEGORY_COLORS[category]
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {CATEGORY_LABELS[category]}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Free only toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="freeOnly"
              checked={freeOnly}
              onChange={(e) => setFreeOnly(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="freeOnly" className="text-sm text-gray-700">
              Free activities only
            </label>
          </div>

          {/* Clear filters */}
          {(selectedCategories.length > 0 || freeOnly || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategories([]);
                setFreeOnly(false);
                setSearchQuery('');
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Activities Grid */}
      {filteredActivities.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No activities match your filters.</p>
          <button
            onClick={() => {
              setSelectedCategories([]);
              setFreeOnly(false);
              setSearchQuery('');
            }}
            className="mt-2 text-blue-600 hover:text-blue-800"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredActivities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      )}
    </div>
  );
}
