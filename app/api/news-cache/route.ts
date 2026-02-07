/**
 * News Cache API Route
 * Serves cached news data with filtering options
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { NewsCache } from '@/lib/content-types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const neighborhood = searchParams.get('neighborhood');
    const alertsOnly = searchParams.get('alertsOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Try to load cache from file
    const cachePath = join(process.cwd(), 'data', 'news-cache.json');

    if (!existsSync(cachePath)) {
      return NextResponse.json(
        {
          success: false,
          error: 'News cache not found. Run fetch-news script first.',
        },
        { status: 404 }
      );
    }

    const cacheContent = readFileSync(cachePath, 'utf-8');
    const cache: NewsCache = JSON.parse(cacheContent);

    // Apply filters
    let items = cache.items;

    if (category) {
      const categoryIds = cache.byCategory[category] || [];
      items = items.filter((item) => categoryIds.includes(item.id));
    }

    if (neighborhood) {
      const neighborhoodIds = cache.byNeighborhood[neighborhood] || [];
      items = items.filter((item) => neighborhoodIds.includes(item.id));
    }

    if (alertsOnly) {
      items = items.filter((item) => cache.alerts.includes(item.id));
    }

    // Apply limit
    items = items.slice(0, limit);

    return NextResponse.json({
      success: true,
      data: {
        lastUpdated: cache.lastUpdated,
        stats: cache.stats,
        items,
        byNeighborhood: cache.byNeighborhood,
        byCategory: cache.byCategory,
        alerts: cache.alerts,
      },
    });
  } catch (error) {
    console.error('Error serving news cache:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load news cache',
      },
      { status: 500 }
    );
  }
}
