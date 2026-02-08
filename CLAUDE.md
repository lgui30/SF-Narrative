# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SF Weekly News Digest is a Next.js application that aggregates and summarizes San Francisco news from multiple local sources. It provides AI-powered weekly news summaries across four categories (Technology, Politics, Economy, SF Local) with an interactive Q&A chatbot.

The app automatically fetches new weekly news every **Friday at 8:00 AM UTC** via Vercel Cron Jobs (configured in `vercel.json`).

## Development Commands

```bash
# Install dependencies and generate Prisma client
npm install

# Run development server
npm run dev

# Build for production (includes Prisma client generation)
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Generate Prisma client manually
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed news data manually
npm run seed-news
```

## Database Management

**Prisma ORM** is used for database access. The database schema is defined in `prisma/schema.prisma`.

### Important Database Configuration

The Prisma client is configured with specific settings for Vercel deployment:
- `binaryTargets`: Includes `rhel-openssl-3.0.x` for Vercel's runtime
- `engineType`: Set to `binary` for compatibility
- Connection uses both `POSTGRES_PRISMA_URL` (connection pooling) and `POSTGRES_URL` (direct connection)

### Models

- `TimelineEvent`: Legacy model for narrative battles (currently unused)
- `UserVote`: User votes for timeline events
- `WeeklyNews`: Primary model storing weekly news summaries for all four categories

Each `WeeklyNews` record contains:
- `weekOf`: The week start date (Sunday at 00:00)
- For each category (tech, politics, economy, sfLocal):
  - Summary (short, for cards)
  - Detailed narrative (expanded view)
  - Bullet points (JSON array)
  - Sources (JSON array of NewsArticle objects)
  - Keywords (JSON array)

## Architecture

### API Routes

**Primary Endpoints:**
- `api/seed-weekly-news-real`: Fetches real news from NewsAPI/Google RSS and stores in DB (used by cron)
- `api/weekly-news`: GET endpoint to retrieve weekly news for a specific week
- `api/weekly-news/weeks`: GET endpoint to list all available weeks
- `api/news-qa`: POST endpoint for chatbot Q&A about news categories

**Authentication:**
- Cron endpoints use `CRON_SECRET` environment variable
- Vercel Cron sends `x-vercel-cron-secret` header
- Manual calls can use `Authorization: Bearer <CRON_SECRET>`

### News Fetching Strategy

Located in `lib/news-api.ts`:

1. **Primary source**: NewsAPI.org (`fetchNewsFromAPI`)
   - Requires `NEWSAPI_KEY` environment variable
   - 100 requests/day on free tier
   - Accurate published dates
   - SF-focused queries for all categories

2. **Fallback source**: Google News RSS (`fetchNewsFromGoogleRSS`)
   - No API key required
   - Used when NewsAPI fails or returns no results
   - All queries filtered for San Francisco relevance

3. **Automatic fallback**: `fetchNewsWithFallback` tries NewsAPI first, then Google RSS
   - Additional filtering ensures SF relevance (`isSFRelevant` function)
   - Filters by date range to ensure correct week

### AI/LLM Integration

Located in `lib/llm.ts`:

**Provider**: Novita AI API
- Uses `deepseek/deepseek-v3.2-exp` model
- Requires `NOVITA_API_KEY` environment variable
- All calls have 30-second timeout to prevent Vercel function timeouts

**Key Functions:**
- `summarizeWeeklyNews()`: Full news summarization using DeepSeek model (30s timeout)
  - Returns: summaryShort, summaryDetailed, bullets, keywords
  - Uses JSON response format
- `summarizeWeeklyNewsFast()`: Lightweight summarization for cron jobs (12s timeout)
  - Uses `meta-llama/llama-3.2-3b-instruct` for speed
  - Returns null on failure (caller should use fallback)
  - Optimized prompt with fewer tokens
- `summarizeWeeklyNewsWithRetry()`: Wrapper with exponential backoff (3 retries)
- `analyzeNarratives()`: Legacy function for narrative analysis (currently unused)

**Important**: The cron endpoint uses `summarizeWeeklyNewsFast()` - a lightweight summarization function that:
- Uses `meta-llama/llama-3.2-3b-instruct` (fast, 3B model) instead of DeepSeek
- Has 12-second timeout per category (48s total for 4 categories)
- Falls back to title-based summaries (`generateCategorySummary()`) on failure
- Processes categories sequentially to stay within Vercel's 60s limit

### Frontend Architecture

**Main Components:**
- `components/HomeClient.tsx`: Main client component with week navigation and state management
- `components/ui/NewsCard.tsx`: Expandable news cards for each category
- `components/ui/NewsQAModal.tsx`: Interactive Q&A chatbot modal
- `components/ui/WeekSelector.tsx`: Week navigation component

**State Management:**
- Uses React hooks (useState, useEffect)
- No external state management library
- Weekly news data fetched from API routes

**Styling:**
- Tailwind CSS (v4+)
- Mobile-first responsive design
- Configured in `@tailwind.config.ts` (Tailwind v4 uses JS/TS config)

### Environment Variables Required

```bash
# Database (Vercel Postgres or Neon)
POSTGRES_PRISMA_URL=     # Connection pooling URL
POSTGRES_URL=             # Direct connection URL

# News APIs
NEWSAPI_KEY=              # NewsAPI.org API key
NOVITA_API_KEY=           # Novita AI API key

# Cron Security
CRON_SECRET=              # Secret for authenticating cron requests
```

## Week Calculation Logic

**Important**: The app uses **Sunday as the week start** (not Monday):
- `weekOf` dates are always Sundays at 00:00:00
- Week calculation: Find the previous Sunday from current date
- Cron runs Friday 8:00 AM UTC to fetch news for the current week (Sunday-Saturday)

Example: For the week of Jan 5-11, 2026, `weekOf` would be Sunday, Jan 5, 2026 00:00:00.

## Date Filtering

The news aggregation enforces a minimum date of **October 20, 2025**:
- Located in `lib/news-aggregator.ts` (`filterByStartDate`)
- All fetched articles must be from this date or later
- The `api/seed-weekly-news-real` route enforces this constraint

## Next.js Configuration

Key settings in `next.config.js`:
- `reactStrictMode: true`
- `outputFileTracingIncludes`: Ensures Prisma binaries are included in serverless functions
- CSP headers configured to allow Vercel/Neon connections
- `'unsafe-eval'` permitted for serverless functions

## Vercel Deployment

**Cron Configuration** (`vercel.json`):
```json
{
  "crons": [
    {
      "path": "/api/seed-weekly-news-real",
      "schedule": "0 8 * * 5"  // Friday 8:00 AM UTC
    }
  ]
}
```

**Important Settings:**
- API routes have `maxDuration: 60` (60 seconds timeout)
- Prisma client configured for Vercel's runtime environment
- Database connection pooling required (use `POSTGRES_PRISMA_URL`)

## TypeScript Patterns

- Path aliases: `@/*` maps to root directory
- Zod schemas for API validation (`lib/llm.ts`, `lib/news-api.ts`)
- Type definitions in `lib/types.ts`
- Strict mode enabled

## Common Tasks

### Adding a New News Category

1. Update `lib/types.ts`: Add to `CategoryNews` union type
2. Update `lib/news-api.ts`: Add query configuration in `categoryQueries`
3. Update `prisma/schema.prisma`: Add category fields to `WeeklyNews` model
4. Run `npx prisma migrate dev` to create migration
5. Update `api/seed-weekly-news-real/route.ts`: Add category to fetch logic
6. Update frontend components to display new category

### Testing News Fetch Manually

```bash
# Fetch news for current week
curl http://localhost:3000/api/seed-weekly-news-real

# Fetch news for specific week (Sunday date)
curl "http://localhost:3000/api/seed-weekly-news-real?weekOf=2026-01-05"

# With authentication (if CRON_SECRET is set)
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/seed-weekly-news-real
```

### Debugging LLM Issues

- Check `lib/llm.ts` for timeout settings (currently 30s)
- LLM responses are cleaned of markdown code blocks before parsing
- Zod validation errors indicate response format issues
- Retry logic uses exponential backoff (2^attempt * 1000ms)

## Known Patterns and Conventions

- All dates are stored as ISO strings in the database
- Week start is always Sunday 00:00:00 UTC
- JSON fields in Prisma are serialized with `JSON.parse(JSON.stringify(data))`
- All news queries are filtered for San Francisco relevance
- API routes return `NextResponse.json()` with success/error structure
- Client components marked with `'use client'` directive
