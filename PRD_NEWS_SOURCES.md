# PRD: Multi-Source News Aggregation

**Project:** SF Weekly News Digest  
**Author:** Lang Gui  
**Date:** 2026-02-08  
**Status:** Ready for Implementation

---

## 1. Overview

### Problem
Current news fetching relies on:
- **NewsAPI.org** — 100 req/day, no production use on free tier
- **Google News RSS** — Fallback, unreliable dates

This limits data quality and risks hitting rate limits.

### Solution
Implement a multi-source news aggregation system using free, reliable APIs:
- Local RSS feeds (SF Standard, Mission Local)
- Community sources (Reddit, Hacker News)
- Backup news API (TheNewsAPI or GNews)

### Goals
1. **Zero cost** — Use only free tiers
2. **Better SF coverage** — Local sources > national with SF filter
3. **More reliable** — Multiple fallbacks
4. **Community pulse** — Reddit/HN for what SF is talking about

---

## 2. New Source Architecture

### Priority Order

| Priority | Source | Type | Category | Rate Limit |
|----------|--------|------|----------|------------|
| 1 | SF Standard RSS | RSS | All categories | Unlimited |
| 2 | Mission Local RSS | RSS | SF Local | Unlimited |
| 3 | Reddit r/sanfrancisco | JSON | Community/Local | 60 req/min |
| 4 | Reddit r/bayarea | JSON | Regional | 60 req/min |
| 5 | Hacker News API | JSON | Tech | Unlimited |
| 6 | TheNewsAPI | REST | Backup/National | 100 req/day |
| 7 | GNews | REST | Fallback | 100 req/day |

### Category Mapping

| Category | Primary Sources | Fallback |
|----------|-----------------|----------|
| **Tech** | Hacker News, SF Standard (tech tag), Reddit | TheNewsAPI |
| **Politics** | SF Standard (politics tag), Mission Local | TheNewsAPI |
| **Economy** | SF Standard (business tag), Reddit | TheNewsAPI |
| **SF Local** | Mission Local, Reddit r/sf, SF Standard | GNews |

---

## 3. Technical Requirements

### 3.1 New Files to Create

```
lib/
├── sources/
│   ├── rss-parser.ts        # Parse RSS feeds (SF Standard, Mission Local)
│   ├── reddit-client.ts     # Fetch Reddit JSON
│   ├── hackernews-client.ts # Fetch HN stories
│   ├── thenewsapi-client.ts # TheNewsAPI backup
│   └── index.ts             # Unified source interface
```

### 3.2 Source Interface

```typescript
interface NewsSource {
  name: string;
  fetchArticles(options: FetchOptions): Promise<NewsArticle[]>;
  isAvailable(): Promise<boolean>;
  getRateLimit(): { remaining: number; resetsAt: Date };
}

interface FetchOptions {
  category: 'tech' | 'politics' | 'economy' | 'sf-local';
  limit?: number;
  fromDate?: Date;
}
```

### 3.3 RSS Parser Requirements

**SF Standard** (`https://sfstandard.com/feed/`)
- Parse: title, link, pubDate, description, category tags, author
- Filter by category tag for Tech/Politics/Economy
- No rate limiting

**Mission Local** (`https://missionlocal.org/feed/`)
- Parse: title, link, pubDate, description
- All articles go to SF Local category
- No rate limiting

### 3.4 Reddit Client Requirements

**Endpoints:**
- `https://www.reddit.com/r/sanfrancisco/hot.json`
- `https://www.reddit.com/r/bayarea/hot.json`

**Requirements:**
- Set User-Agent header: `SF-Narrative/1.0`
- Parse: title, url, score, created_utc, selftext, num_comments
- Filter posts with score > 10 for quality
- Convert to NewsArticle format

### 3.5 Hacker News Client Requirements

**Endpoints:**
- `https://hacker-news.firebaseio.com/v0/topstories.json`
- `https://hacker-news.firebaseio.com/v0/item/{id}.json`

**Requirements:**
- Fetch top 50 stories
- Filter for SF/Bay Area relevance in title/URL
- Parse: title, url, score, time, by, descendants
- No rate limiting

### 3.6 TheNewsAPI Client Requirements

**Endpoint:** `https://api.thenewsapi.com/v1/news/all`

**Requirements:**
- API key in `THENEWSAPI_KEY` env var
- Query with `search=san+francisco+OR+bay+area`
- 100 requests/day limit — use sparingly as backup
- Track usage to avoid hitting limits

---

## 4. Aggregation Logic

### 4.1 Fetch Flow

```
1. Fetch all RSS feeds in parallel (no rate limits)
2. Fetch Reddit (with rate limit awareness)
3. Fetch Hacker News (no rate limits)
4. If any category has < 3 articles, fetch from TheNewsAPI
5. If TheNewsAPI fails/exhausted, use GNews as final fallback
6. Deduplicate by URL
7. Sort by publishedDate desc
8. Take top 10 per category
```

### 4.2 Deduplication

```typescript
function dedupeArticles(articles: NewsArticle[]): NewsArticle[] {
  const seen = new Set<string>();
  return articles.filter(article => {
    const key = normalizeUrl(article.url);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
```

### 4.3 Relevance Scoring

```typescript
function scoreRelevance(article: NewsArticle): number {
  let score = 0;
  const text = `${article.title} ${article.snippet}`.toLowerCase();
  
  // SF-specific terms
  if (text.includes('san francisco')) score += 10;
  if (text.includes('bay area')) score += 8;
  if (text.includes('sf ')) score += 5;
  
  // Neighborhoods
  const neighborhoods = ['mission', 'soma', 'castro', 'tenderloin', ...];
  neighborhoods.forEach(n => { if (text.includes(n)) score += 3; });
  
  // Recency bonus
  const hoursAgo = (Date.now() - new Date(article.publishedDate).getTime()) / 3600000;
  if (hoursAgo < 24) score += 5;
  if (hoursAgo < 6) score += 5;
  
  return score;
}
```

---

## 5. Environment Variables

```bash
# Existing
NEWSAPI_KEY=xxx           # Keep as legacy fallback
NOVITA_API_KEY=xxx        # For LLM summarization

# New
THENEWSAPI_KEY=xxx        # Primary backup API
GNEWS_API_KEY=xxx         # Final fallback
REDDIT_CLIENT_ID=xxx      # Optional: for higher rate limits
REDDIT_CLIENT_SECRET=xxx  # Optional: for higher rate limits
```

---

## 6. Migration Plan

### Phase 1: Add New Sources (This PR)
1. Create `lib/sources/` directory with all clients
2. Update `lib/news-api.ts` to use new unified interface
3. Update cron endpoint to use new sources
4. Test locally with `npm run seed-news`

### Phase 2: Deprecate Old Sources
1. Remove direct NewsAPI.org calls (keep as fallback only)
2. Remove Google News RSS parsing
3. Clean up unused code

### Phase 3: Optimize
1. Add caching layer (Redis or Vercel KV)
2. Add source health monitoring
3. Add usage analytics

---

## 7. Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Articles per category | 5-8 | 10+ |
| SF-relevant articles | ~70% | >95% |
| API cost | $0 | $0 |
| Source diversity | 2 | 5+ |
| Failed fetches/week | Unknown | <5% |

---

## 8. Testing Plan

1. **Unit tests** for each source client
2. **Integration test** for full aggregation flow
3. **Manual test** with `curl` to cron endpoint
4. **Monitor** Vercel function logs for first week

---

## 9. Rollback Plan

If issues arise:
1. Set `USE_LEGACY_SOURCES=true` env var
2. Cron falls back to NewsAPI + Google RSS
3. Debug and fix new sources
4. Re-enable with `USE_LEGACY_SOURCES=false`

---

## 10. Timeline

| Task | Estimate |
|------|----------|
| Create source clients | 1 hour |
| Update aggregation logic | 30 min |
| Update cron endpoint | 30 min |
| Testing | 30 min |
| **Total** | ~2.5 hours |

---

## Appendix: API Endpoints Reference

### SF Standard RSS
```
GET https://sfstandard.com/feed/
Response: XML (RSS 2.0)
```

### Mission Local RSS
```
GET https://missionlocal.org/feed/
Response: XML (RSS 2.0)
```

### Reddit
```
GET https://www.reddit.com/r/sanfrancisco/hot.json?limit=25
Headers: User-Agent: SF-Narrative/1.0
Response: JSON
```

### Hacker News
```
GET https://hacker-news.firebaseio.com/v0/topstories.json
Response: JSON (array of IDs)

GET https://hacker-news.firebaseio.com/v0/item/{id}.json
Response: JSON (story object)
```

### TheNewsAPI
```
GET https://api.thenewsapi.com/v1/news/all?api_token=XXX&search=san+francisco&language=en
Response: JSON
```
