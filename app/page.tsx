import { prisma } from '@/lib/prisma';
import { handleDatabaseError, logError } from '@/lib/error-handler';
import HomeClient from '../components/HomeClient';
import type { WeeklyNews } from '@/lib/types';
import type { Activity, ActivitiesCache, NewsStory, NewsCache } from '@/lib/content-types';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

/**
 * Load activities from cache file
 */
function loadActivities(): Activity[] {
  try {
    const cachePath = join(process.cwd(), 'data', 'activities-cache.json');
    if (!existsSync(cachePath)) {
      return [];
    }
    const cacheContent = readFileSync(cachePath, 'utf-8');
    const cache: ActivitiesCache = JSON.parse(cacheContent);
    return cache.items || [];
  } catch (error) {
    console.error('Failed to load activities:', error);
    return [];
  }
}

/**
 * Load news stories from cache file, converting to NewsStory format
 */
function loadNewsStories(): NewsStory[] {
  try {
    const cachePath = join(process.cwd(), 'data', 'news-cache.json');
    if (!existsSync(cachePath)) {
      return [];
    }
    const cacheContent = readFileSync(cachePath, 'utf-8');
    const cache: NewsCache = JSON.parse(cacheContent);

    // Convert EnhancedNewsArticle to NewsStory
    return (cache.items || []).slice(0, 50).map((article) => {
      // Determine category from sourceType or default to sf-local
      let category: NewsStory['category'] = 'sf-local';
      const titleLower = (article.title || '').toLowerCase();
      const snippetLower = (article.snippet || '').toLowerCase();
      const combined = titleLower + ' ' + snippetLower;

      if (combined.includes('tech') || combined.includes('startup') || combined.includes('ai ') || combined.includes('software')) {
        category = 'tech';
      } else if (combined.includes('mayor') || combined.includes('vote') || combined.includes('election') || combined.includes('council') || combined.includes('politic')) {
        category = 'politics';
      } else if (combined.includes('economy') || combined.includes('housing') || combined.includes('rent') || combined.includes('business') || combined.includes('market')) {
        category = 'economy';
      }

      return {
        id: article.id,
        title: article.title,
        summary: article.snippet,
        sources: [{ title: article.source, url: article.url }],
        category,
        neighborhood: article.neighborhoods?.[0],
        publishedAt: article.publishedDate,
      };
    });
  } catch (error) {
    console.error('Failed to load news stories:', error);
    return [];
  }
}

/**
 * Home Page Component
 */
export default async function Home() {
  let weeklyNews: WeeklyNews | null = null;
  let error: string | null = null;

  try {
    // Fetch the latest weekly news
    const latestWeeklyNews = await prisma.weeklyNews.findFirst({
      orderBy: {
        weekOf: 'desc',
      },
    });

    if (latestWeeklyNews) {
      weeklyNews = {
        id: latestWeeklyNews.id,
        weekOf: latestWeeklyNews.weekOf,
        tech: {
          category: 'tech',
          summaryShort: latestWeeklyNews.techSummary,
          summaryDetailed: latestWeeklyNews.techDetailed,
          bullets: latestWeeklyNews.techBullets as string[],
          sources: latestWeeklyNews.techSources as { title: string; url: string; snippet: string; publishedDate: string; source: string }[],
          keywords: latestWeeklyNews.techKeywords as string[],
        },
        politics: {
          category: 'politics',
          summaryShort: latestWeeklyNews.politicsSummary,
          summaryDetailed: latestWeeklyNews.politicsDetailed,
          bullets: latestWeeklyNews.politicsBullets as string[],
          sources: latestWeeklyNews.politicsSources as { title: string; url: string; snippet: string; publishedDate: string; source: string }[],
          keywords: latestWeeklyNews.politicsKeywords as string[],
        },
        economy: {
          category: 'economy',
          summaryShort: latestWeeklyNews.economySummary,
          summaryDetailed: latestWeeklyNews.economyDetailed,
          bullets: latestWeeklyNews.economyBullets as string[],
          sources: latestWeeklyNews.economySources as { title: string; url: string; snippet: string; publishedDate: string; source: string }[],
          keywords: latestWeeklyNews.economyKeywords as string[],
        },
        sfLocal: {
          category: 'sf-local',
          summaryShort: latestWeeklyNews.sfLocalSummary,
          summaryDetailed: latestWeeklyNews.sfLocalDetailed,
          bullets: latestWeeklyNews.sfLocalBullets as string[],
          sources: latestWeeklyNews.sfLocalSources as { title: string; url: string; snippet: string; publishedDate: string; source: string }[],
          keywords: latestWeeklyNews.sfLocalKeywords as string[],
        },
        weeklyKeywords: latestWeeklyNews.weeklyKeywords as string[],
        createdAt: latestWeeklyNews.createdAt,
        updatedAt: latestWeeklyNews.updatedAt,
      };
    }
  } catch (err) {
    const appError = handleDatabaseError(err, 'Fetch Data');
    logError(appError, 'Home Page');
    error = appError.message;
  }

  // Load data from cache files
  const activities = loadActivities();
  const newsStories = loadNewsStories();

  return <HomeClient weeklyNews={weeklyNews} activities={activities} newsStories={newsStories} error={error} />;
}
