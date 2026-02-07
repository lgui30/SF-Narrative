/**
 * Activities API Route
 * Serves activities with comprehensive filtering options
 * Falls back to cache data
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { Activity, ActivitiesCache, ActivityCategory } from '@/lib/content-types';

export const dynamic = 'force-dynamic';

interface FilterParams {
  categories?: ActivityCategory[];
  neighborhoods?: string[];
  dateStart?: string;
  dateEnd?: string;
  freeOnly?: boolean;
  search?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

function parseFilters(searchParams: URLSearchParams): FilterParams {
  const filters: FilterParams = {};

  // Categories (comma-separated)
  const categories = searchParams.get('categories');
  if (categories) {
    filters.categories = categories.split(',') as ActivityCategory[];
  }

  // Neighborhoods (comma-separated)
  const neighborhoods = searchParams.get('neighborhoods');
  if (neighborhoods) {
    filters.neighborhoods = neighborhoods.split(',');
  }

  // Date range
  const dateStart = searchParams.get('dateStart');
  if (dateStart) filters.dateStart = dateStart;

  const dateEnd = searchParams.get('dateEnd');
  if (dateEnd) filters.dateEnd = dateEnd;

  // Free only
  filters.freeOnly = searchParams.get('freeOnly') === 'true';

  // Search
  const search = searchParams.get('search');
  if (search) filters.search = search;

  // Tags (comma-separated)
  const tags = searchParams.get('tags');
  if (tags) {
    filters.tags = tags.split(',');
  }

  // Pagination
  filters.limit = parseInt(searchParams.get('limit') || '50');
  filters.offset = parseInt(searchParams.get('offset') || '0');

  return filters;
}

function applyFilters(activities: Activity[], filters: FilterParams): Activity[] {
  let result = [...activities];

  // Filter by categories
  if (filters.categories && filters.categories.length > 0) {
    result = result.filter((a) => filters.categories!.includes(a.category));
  }

  // Filter by neighborhoods
  if (filters.neighborhoods && filters.neighborhoods.length > 0) {
    result = result.filter(
      (a) => a.neighborhood && filters.neighborhoods!.includes(a.neighborhood)
    );
  }

  // Filter by date range
  if (filters.dateStart) {
    result = result.filter((a) => a.date >= filters.dateStart!);
  }
  if (filters.dateEnd) {
    result = result.filter((a) => a.date <= filters.dateEnd!);
  }

  // Filter by free only
  if (filters.freeOnly) {
    result = result.filter((a) => a.price.isFree);
  }

  // Filter by search
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    result = result.filter(
      (a) =>
        a.title.toLowerCase().includes(searchLower) ||
        a.description.toLowerCase().includes(searchLower) ||
        a.venue.toLowerCase().includes(searchLower)
    );
  }

  // Filter by tags
  if (filters.tags && filters.tags.length > 0) {
    result = result.filter((a) =>
      filters.tags!.some((tag) => a.tags.includes(tag))
    );
  }

  return result;
}

export async function GET(request: NextRequest) {
  try {
    const filters = parseFilters(request.nextUrl.searchParams);

    // Load cache
    const cachePath = join(process.cwd(), 'data', 'activities-cache.json');

    if (!existsSync(cachePath)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Activities cache not found',
          data: { items: [], total: 0 },
        },
        { status: 404 }
      );
    }

    const cacheContent = readFileSync(cachePath, 'utf-8');
    const cache: ActivitiesCache = JSON.parse(cacheContent);

    // Apply filters
    const filteredActivities = applyFilters(cache.items, filters);
    const total = filteredActivities.length;

    // Apply pagination
    const paginatedActivities = filteredActivities.slice(
      filters.offset || 0,
      (filters.offset || 0) + (filters.limit || 50)
    );

    return NextResponse.json({
      success: true,
      data: {
        items: paginatedActivities,
        total,
        limit: filters.limit,
        offset: filters.offset,
        hasMore: (filters.offset || 0) + paginatedActivities.length < total,
      },
      meta: {
        lastUpdated: cache.lastUpdated,
        stats: cache.stats,
      },
    });
  } catch (error) {
    console.error('Error serving activities:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load activities',
      },
      { status: 500 }
    );
  }
}
