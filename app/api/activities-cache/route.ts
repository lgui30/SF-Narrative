/**
 * Activities Cache API Route
 * Serves cached activities data with filtering options
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { ActivitiesCache, ActivityCategory } from '@/lib/content-types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') as ActivityCategory | null;
    const neighborhood = searchParams.get('neighborhood');
    const freeOnly = searchParams.get('freeOnly') === 'true';
    const date = searchParams.get('date');
    const featured = searchParams.get('featured') === 'true';
    const weekend = searchParams.get('weekend') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Try to load cache from file
    const cachePath = join(process.cwd(), 'data', 'activities-cache.json');

    if (!existsSync(cachePath)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Activities cache not found. Run fetch-activities script first.',
        },
        { status: 404 }
      );
    }

    const cacheContent = readFileSync(cachePath, 'utf-8');
    const cache: ActivitiesCache = JSON.parse(cacheContent);

    // Apply filters
    let items = cache.items;

    if (category) {
      items = items.filter((item) => item.category === category);
    }

    if (neighborhood) {
      const neighborhoodIds = cache.byNeighborhood[neighborhood] || [];
      items = items.filter((item) => neighborhoodIds.includes(item.id));
    }

    if (freeOnly) {
      items = items.filter((item) => item.price.isFree);
    }

    if (date) {
      items = items.filter((item) => item.date === date);
    }

    if (featured) {
      items = items.filter((item) => cache.featured.includes(item.id));
    }

    if (weekend) {
      items = items.filter((item) => cache.thisWeekend.includes(item.id));
    }

    // Apply limit
    items = items.slice(0, limit);

    return NextResponse.json({
      success: true,
      data: {
        lastUpdated: cache.lastUpdated,
        stats: cache.stats,
        items,
        featured: cache.featured,
        thisWeekend: cache.thisWeekend,
        freeToday: cache.freeToday,
        byNeighborhood: cache.byNeighborhood,
      },
    });
  } catch (error) {
    console.error('Error serving activities cache:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load activities cache',
      },
      { status: 500 }
    );
  }
}
