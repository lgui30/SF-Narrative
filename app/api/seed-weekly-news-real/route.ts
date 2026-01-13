import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchNewsWithFallback, fetchNeighborhoodSpecificNews } from '@/lib/news-api';
import type { NewsArticle, CategoryNews } from '@/lib/types';
import { filterByStartDate } from '@/lib/news-aggregator';
import { extractNeighborhoods } from '@/lib/llm';
import { extractNeighborhoodsRuleBased } from '@/lib/neighborhood-matcher';

/**
 * Seed endpoint to fetch REAL weekly news from NewsAPI + Google RSS
 * This uses actual news sources with verified dates from Oct 20, 2025 onwards
 */

/**
 * Generate fallback summary from article titles and snippets (no AI calls to avoid timeouts)
 */
function generateCategorySummary(
  articles: NewsArticle[],
  category: 'tech' | 'politics' | 'economy' | 'sf-local'
): Omit<CategoryNews, 'category' | 'sources'> {
  // If no articles, return empty summary
  if (!articles || articles.length === 0) {
    return {
      summaryShort: 'No news articles available for this category this week.',
      summaryDetailed: 'No news articles were found for this category during the specified time period.',
      bullets: ['No news available'],
      keywords: ['No Data'],
    };
  }

  const categoryLabels = {
    tech: 'San Francisco technology',
    politics: 'San Francisco politics',
    economy: 'San Francisco economy',
    'sf-local': 'San Francisco local news',
  };

  // Create a narrative-style summary from article titles and snippets
  const topArticles = articles.slice(0, 5);
  const summaryShort = `This week in ${categoryLabels[category]}, key developments include: ${topArticles.slice(0, 3).map((a) => {
    // Extract first sentence from snippet or use title
    const firstSentence = a.snippet.split('.')[0] || a.title;
    return `${firstSentence}`;
  }).join('. ')}.`;

  const summaryDetailed = `Recent developments in ${categoryLabels[category]} this week highlight several important stories. ${topArticles.map((a) => {
    return `${a.title}`;
  }).join('. ')}. These stories reflect the ongoing dynamics in San Francisco's ${category === 'sf-local' ? 'community' : category} landscape.`;

  return {
    summaryShort,
    summaryDetailed,
    bullets: topArticles.map(a => a.title),
    keywords: [categoryLabels[category], 'San Francisco', 'Bay Area'],
  };
}

export async function GET(request: NextRequest) {
  try {
    // Verify authorization - allow Vercel Cron or manual auth token
    // Vercel Cron automatically adds x-vercel-cron-secret header with CRON_SECRET value
    // If CRON_SECRET is not set, allow all requests (development mode)
    const authHeader = request.headers.get('authorization');
    const vercelCronSecret = request.headers.get('x-vercel-cron-secret');
    const cronSecret = process.env.CRON_SECRET;
    
    // Check if request is from Vercel Cron or has valid auth token
    // Vercel Cron sends CRON_SECRET directly in x-vercel-cron-secret header
    // Manual calls can use Authorization: Bearer <secret>
    const isVercelCron = cronSecret && vercelCronSecret === cronSecret;
    const isManualAuth = cronSecret && authHeader === `Bearer ${cronSecret}`;
    
    // Only require auth if CRON_SECRET is set (production)
    if (cronSecret && !isVercelCron && !isManualAuth) {
      console.log('⛔ Unauthorized cron request');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.log('🔄 Fetching REAL weekly news from Oct 20, 2025 onwards...');

    // Get weekOf parameter from query string (if provided)
    const searchParams = request.nextUrl.searchParams;
    const weekOfParam = searchParams.get('weekOf');

    // Calculate the week to fetch news for
    let weekOf: Date;
    if (weekOfParam) {
      // Parse date string properly to avoid timezone issues
      // Parse YYYY-MM-DD format directly as local date
      const parts = weekOfParam.split('T')[0].split('-');
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
      const day = parseInt(parts[2], 10);
      weekOf = new Date(year, month, day);
      weekOf.setHours(0, 0, 0, 0);
    } else {
      // Calculate current week start (Sunday)
      // Sunday = 0, Monday = 1, ..., Saturday = 6
      const now = new Date();
      const dayOfWeek = now.getDay();
      const daysToSunday = dayOfWeek === 0 ? 0 : -dayOfWeek;
      weekOf = new Date(now);
      weekOf.setDate(now.getDate() + daysToSunday);
      weekOf.setHours(0, 0, 0, 0);
    }

    // The absolute minimum date for news (Oct 20, 2025)
    const minimumDate = new Date('2025-10-20');
    minimumDate.setHours(0, 0, 0, 0);

    // Ensure we're not fetching news before Oct 20
    const fetchStartDate = weekOf < minimumDate ? minimumDate : weekOf;

    console.log(`📅 Fetching news for week of: ${weekOf.toISOString().split('T')[0]}`);
    console.log(`📅 Fetching articles from: ${fetchStartDate.toISOString().split('T')[0]}`);

    // Fetch real news from NewsAPI/Google RSS for all categories
    console.log('📰 Fetching news from APIs...');
    const [techArticles, politicsArticles, economyArticles, sfArticles] = await Promise.all([
      fetchNewsWithFallback('tech', fetchStartDate),
      fetchNewsWithFallback('politics', fetchStartDate),
      fetchNewsWithFallback('economy', fetchStartDate),
      fetchNewsWithFallback('sf-local', fetchStartDate),
    ]);

    // Additional filtering to ensure dates are from the fetch start date onwards
    const filteredTech = filterByStartDate(techArticles, fetchStartDate);
    const filteredPolitics = filterByStartDate(politicsArticles, fetchStartDate);
    const filteredEconomy = filterByStartDate(economyArticles, fetchStartDate);
    const filteredSF = filterByStartDate(sfArticles, fetchStartDate);

    console.log(`📊 Article counts:
  Tech: ${filteredTech.length}
  Politics: ${filteredPolitics.length}
  Economy: ${filteredEconomy.length}
  SF Local: ${filteredSF.length}`);

    if (filteredTech.length === 0 && filteredPolitics.length === 0 &&
        filteredEconomy.length === 0 && filteredSF.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No news articles found from Oct 20 onwards. Please check API keys or network connectivity.',
      }, { status: 500 });
    }

    // Fetch neighborhood-specific news
    console.log('🏘️ Fetching neighborhood-specific news...');
    const neighborhoodNews = await fetchNeighborhoodSpecificNews(fetchStartDate);

    // Convert neighborhood news map to array of all articles with neighborhood tags
    const neighborhoodArticles = Array.from(neighborhoodNews.values()).flat();
    console.log(`✓ Got ${neighborhoodArticles.length} neighborhood-specific articles`);

    // Merge neighborhood-specific articles into SF local category
    // These articles already have neighborhood tags from fetching
    const allSFLocal = [...filteredSF, ...neighborhoodArticles];

    // Extract neighborhoods from articles using LLM (with concurrency control)
    console.log('📍 Extracting neighborhoods from general articles...');

    const extractWithConcurrency = async (articles: NewsArticle[], limit: number = 5): Promise<NewsArticle[]> => {
      const results: NewsArticle[] = [];
      for (let i = 0; i < articles.length; i += limit) {
        const batch = articles.slice(i, i + limit);
        const batchResults = await Promise.all(
          batch.map(async (article) => {
            // Skip if article already has neighborhoods (from neighborhood-specific fetch)
            if (article.neighborhoods && article.neighborhoods.length > 0) {
              console.log(`📍 ${article.title.substring(0, 50)}... → ${article.neighborhoods.join(', ')} (pre-tagged)`);
              return article;
            }

            // Step 1: Try rule-based extraction (fast, no API)
            let neighborhoods = extractNeighborhoodsRuleBased(article);

            // Step 2: If no neighborhoods found, try LLM (slower, requires API)
            if (neighborhoods.length === 0) {
              neighborhoods = await extractNeighborhoods(article);
            }

            // Step 3: Fallback to "General SF" if still nothing
            if (neighborhoods.length === 0) {
              neighborhoods = ['General SF'];
            }

            console.log(`📍 ${article.title.substring(0, 50)}... → ${neighborhoods.join(', ')}`);

            return {
              ...article,
              neighborhoods
            };
          })
        );
        results.push(...batchResults);
      }
      return results;
    };

    const [techWithNeighborhoods, politicsWithNeighborhoods, economyWithNeighborhoods, sfWithNeighborhoods] =
      await Promise.all([
        extractWithConcurrency(filteredTech.slice(0, 10)),
        extractWithConcurrency(filteredPolitics.slice(0, 10)),
        extractWithConcurrency(filteredEconomy.slice(0, 10)),
        extractWithConcurrency(allSFLocal), // Include all SF local + neighborhood-specific
      ]);

    console.log('✓ Neighborhoods extracted successfully');

    // Generate summaries for each category using fallback (no AI to avoid timeouts)
    console.log('📝 Generating summaries (using fallback to avoid timeouts)...');

    const techSummary = generateCategorySummary(techWithNeighborhoods, 'tech');
    const politicsSummary = generateCategorySummary(politicsWithNeighborhoods, 'politics');
    const economySummary = generateCategorySummary(economyWithNeighborhoods, 'economy');
    const sfSummary = generateCategorySummary(sfWithNeighborhoods, 'sf-local');

    console.log('✓ All summaries generated successfully');

    // Combine category news (using articles with extracted neighborhoods)
    const techNews: CategoryNews = {
      category: 'tech',
      ...techSummary,
      sources: techWithNeighborhoods,
    };

    const politicsNews: CategoryNews = {
      category: 'politics',
      ...politicsSummary,
      sources: politicsWithNeighborhoods,
    };

    const economyNews: CategoryNews = {
      category: 'economy',
      ...economySummary,
      sources: economyWithNeighborhoods,
    };

    const sfLocalNews: CategoryNews = {
      category: 'sf-local',
      ...sfSummary,
      sources: sfWithNeighborhoods,
    };

    // Aggregate all keywords
    const allKeywords = [
      ...techNews.keywords,
      ...politicsNews.keywords,
      ...economyNews.keywords,
      ...sfLocalNews.keywords,
    ];

    // Save to database using the weekOf we calculated earlier
    console.log('💾 Saving to database...');
    const weeklyNews = await prisma.weeklyNews.upsert({
      where: {
        weekOf: weekOf,
      },
      update: {
        techSummary: techNews.summaryShort,
        techDetailed: techNews.summaryDetailed,
        techBullets: JSON.parse(JSON.stringify(techNews.bullets)),
        techSources: JSON.parse(JSON.stringify(techNews.sources)),
        techKeywords: JSON.parse(JSON.stringify(techNews.keywords)),
        
        politicsSummary: politicsNews.summaryShort,
        politicsDetailed: politicsNews.summaryDetailed,
        politicsBullets: JSON.parse(JSON.stringify(politicsNews.bullets)),
        politicsSources: JSON.parse(JSON.stringify(politicsNews.sources)),
        politicsKeywords: JSON.parse(JSON.stringify(politicsNews.keywords)),
        
        economySummary: economyNews.summaryShort,
        economyDetailed: economyNews.summaryDetailed,
        economyBullets: JSON.parse(JSON.stringify(economyNews.bullets)),
        economySources: JSON.parse(JSON.stringify(economyNews.sources)),
        economyKeywords: JSON.parse(JSON.stringify(economyNews.keywords)),
        
        sfLocalSummary: sfLocalNews.summaryShort,
        sfLocalDetailed: sfLocalNews.summaryDetailed,
        sfLocalBullets: JSON.parse(JSON.stringify(sfLocalNews.bullets)),
        sfLocalSources: JSON.parse(JSON.stringify(sfLocalNews.sources)),
        sfLocalKeywords: JSON.parse(JSON.stringify(sfLocalNews.keywords)),
        
        weeklyKeywords: JSON.parse(JSON.stringify(allKeywords)),
        updatedAt: new Date(),
      },
      create: {
        weekOf: weekOf,
        techSummary: techNews.summaryShort,
        techDetailed: techNews.summaryDetailed,
        techBullets: JSON.parse(JSON.stringify(techNews.bullets)),
        techSources: JSON.parse(JSON.stringify(techNews.sources)),
        techKeywords: JSON.parse(JSON.stringify(techNews.keywords)),
        
        politicsSummary: politicsNews.summaryShort,
        politicsDetailed: politicsNews.summaryDetailed,
        politicsBullets: JSON.parse(JSON.stringify(politicsNews.bullets)),
        politicsSources: JSON.parse(JSON.stringify(politicsNews.sources)),
        politicsKeywords: JSON.parse(JSON.stringify(politicsNews.keywords)),
        
        economySummary: economyNews.summaryShort,
        economyDetailed: economyNews.summaryDetailed,
        economyBullets: JSON.parse(JSON.stringify(economyNews.bullets)),
        economySources: JSON.parse(JSON.stringify(economyNews.sources)),
        economyKeywords: JSON.parse(JSON.stringify(economyNews.keywords)),
        
        sfLocalSummary: sfLocalNews.summaryShort,
        sfLocalDetailed: sfLocalNews.summaryDetailed,
        sfLocalBullets: JSON.parse(JSON.stringify(sfLocalNews.bullets)),
        sfLocalSources: JSON.parse(JSON.stringify(sfLocalNews.sources)),
        sfLocalKeywords: JSON.parse(JSON.stringify(sfLocalNews.keywords)),
        
        weeklyKeywords: JSON.parse(JSON.stringify(allKeywords)),
      },
    });

    console.log('✅ Real weekly news seeded successfully!');

    return NextResponse.json({
      success: true,
      message: 'Real weekly news fetched and seeded successfully',
      weekOf: weekOf.toISOString(),
      id: weeklyNews.id,
      stats: {
        tech: filteredTech.length,
        politics: filteredPolitics.length,
        economy: filteredEconomy.length,
        sfLocal: filteredSF.length,
      },
      sample: {
        tech: filteredTech.slice(0, 2).map(a => ({ title: a.title, date: a.publishedDate })),
        politics: filteredPolitics.slice(0, 2).map(a => ({ title: a.title, date: a.publishedDate })),
        economy: filteredEconomy.slice(0, 2).map(a => ({ title: a.title, date: a.publishedDate })),
        sfLocal: filteredSF.slice(0, 2).map(a => ({ title: a.title, date: a.publishedDate })),
      },
    });
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for API calls

