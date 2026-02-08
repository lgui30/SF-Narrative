import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { WeeklyNews, CategoryNews } from '@/lib/types';

/**
 * GET /api/weekly-news
 * Fetch weekly news data
 * 
 * Query params:
 * - weekOf: ISO date string (optional) - fetch specific week, defaults to latest
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const weekOfParam = searchParams.get('weekOf');

    let weeklyNewsRecord;

    if (weekOfParam) {
      // Validate weekOf is a valid date string
      const parsedDate = new Date(weekOfParam);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid weekOf parameter. Must be a valid date string (e.g., 2025-01-06).',
          },
          { status: 400 }
        );
      }

      // Fetch specific week directly by date
      weeklyNewsRecord = await prisma.weeklyNews.findFirst({
        where: { weekOf: parsedDate },
      });
    } else {
      // Fetch latest week
      weeklyNewsRecord = await prisma.weeklyNews.findFirst({
        orderBy: {
          weekOf: 'desc',
        },
      });
    }

    if (!weeklyNewsRecord) {
      return NextResponse.json(
        {
          success: false,
          error: 'No weekly news found',
        },
        { status: 404 }
      );
    }

    // Transform database record to WeeklyNews type
    const weeklyNews: WeeklyNews = {
      id: weeklyNewsRecord.id,
      weekOf: weeklyNewsRecord.weekOf,
      tech: {
        category: 'tech',
        summaryShort: weeklyNewsRecord.techSummary,
        summaryDetailed: weeklyNewsRecord.techDetailed,
        bullets: weeklyNewsRecord.techBullets as string[],
        sources: weeklyNewsRecord.techSources as any,
        keywords: weeklyNewsRecord.techKeywords as string[],
      },
      politics: {
        category: 'politics',
        summaryShort: weeklyNewsRecord.politicsSummary,
        summaryDetailed: weeklyNewsRecord.politicsDetailed,
        bullets: weeklyNewsRecord.politicsBullets as string[],
        sources: weeklyNewsRecord.politicsSources as any,
        keywords: weeklyNewsRecord.politicsKeywords as string[],
      },
      economy: {
        category: 'economy',
        summaryShort: weeklyNewsRecord.economySummary,
        summaryDetailed: weeklyNewsRecord.economyDetailed,
        bullets: weeklyNewsRecord.economyBullets as string[],
        sources: weeklyNewsRecord.economySources as any,
        keywords: weeklyNewsRecord.economyKeywords as string[],
      },
      sfLocal: {
        category: 'sf-local',
        summaryShort: weeklyNewsRecord.sfLocalSummary,
        summaryDetailed: weeklyNewsRecord.sfLocalDetailed,
        bullets: weeklyNewsRecord.sfLocalBullets as string[],
        sources: weeklyNewsRecord.sfLocalSources as any,
        keywords: weeklyNewsRecord.sfLocalKeywords as string[],
      },
      weeklyKeywords: weeklyNewsRecord.weeklyKeywords as string[],
      createdAt: weeklyNewsRecord.createdAt,
      updatedAt: weeklyNewsRecord.updatedAt,
    };

    return NextResponse.json({
      success: true,
      data: weeklyNews,
    });
  } catch (error) {
    console.error('Error fetching weekly news:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';

