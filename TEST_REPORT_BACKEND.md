# Backend Edge Case Test Report

**Date:** 2026-02-08  
**Scope:** Multi-source news aggregation system  
**Test Files:** `scripts/test-edge-cases.ts`, `scripts/test-bugs-detailed.ts`

---

## 📊 Test Summary

| Category | Passed | Failed | Total |
|----------|--------|--------|-------|
| URL Deduplication | 6 | 0 | 6 |
| Relevance Scoring | 4 | 0 | 4 |
| Date Parsing | 5 | 0 | 5 |
| Live API Tests | 10 | 0 | 10 |
| **Total** | **25** | **0** | **25** |

---

## 🐛 Bugs Found & Fixed

### Bug #1: URL Deduplication Too Aggressive ✅ FIXED

**Location:** `lib/sources/index.ts` - `normalizeUrl()` function

**Problem:** The URL normalization function stripped ALL query parameters, not just tracking ones. This caused legitimate different pages to be incorrectly deduplicated.

**Example:**
```
https://example.com/article?page=1
https://example.com/article?page=2
→ Both normalized to: "example.com/article"
→ Second URL incorrectly removed as "duplicate"
```

**Fix Applied:**
```typescript
// Now only removes tracking params
const trackingParams = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'ref', 'source', 'fbclid', 'gclid', 'mc_cid', 'mc_eid',
];
// Preserves meaningful query params like page=, id=, q=
```

**Commit:** `f4e4393`

---

### Bug #2: Cross-Category Duplicates Not Removed ✅ FIXED

**Location:** `lib/sources/index.ts` - `fetchAllCategories()` function

**Problem:** The same article could appear in multiple categories (e.g., both "tech" and "economy"). Deduplication only happened within each category, not across categories.

**Example:**
```
https://missionlocal.org/2026/02/sf-march-for-billionaires-bust/
→ Appeared in: [tech, economy]
```

**Fix Applied:**
```typescript
// Cross-category deduplication with priority order
const categoryOrder = ['sf-local', 'politics', 'economy', 'tech'];
// sf-local gets priority (local news first)
for (const category of categoryOrder) {
  result[category] = result[category].filter(article => {
    const normalizedUrl = normalizeUrlForDedup(article.url);
    if (seenUrls.has(normalizedUrl)) return false;
    seenUrls.add(normalizedUrl);
    return true;
  });
}
```

**Commit:** `f4e4393`

---

### Bug #3: Future Dates Received Incorrect Recency Bonus ✅ FIXED

**Location:** `lib/sources/index.ts` - `scoreRelevance()` function

**Problem:** Articles with future publication dates (e.g., "2030-01-01") would incorrectly receive the highest recency bonus (+10 points). The `hoursAgo` calculation produced a negative number, which passed the `hoursAgo < 6` check.

**Example:**
```
hoursAgo = (Date.now() - futureDate) / 3600000
        = negative number
        → hoursAgo < 6 = true (WRONG!)
```

**Fix Applied:**
```typescript
// Only give recency bonus for past dates (hoursAgo > 0)
if (hoursAgo > 0 && hoursAgo < 6) score += 10;
else if (hoursAgo > 0 && hoursAgo < 24) score += 5;
else if (hoursAgo > 0 && hoursAgo < 72) score += 2;
```

**Commit:** `f4e4393`

---

## 📋 Edge Cases Tested

### 1. URL Deduplication Edge Cases

| Test | Status | Notes |
|------|--------|-------|
| Trailing slash handling | ✅ | `/article` and `/article/` deduplicated |
| WWW prefix handling | ✅ | `example.com` and `www.example.com` deduplicated |
| UTM parameter stripping | ✅ | `?utm_source=...` removed |
| Invalid URL handling | ✅ | Graceful fallback, no crashes |
| Empty array handling | ✅ | Returns empty array |
| Non-UTM query params | ✅ | `?page=1` and `?page=2` preserved as different |

### 2. Source Client Edge Cases

| Source | Test | Status | Notes |
|--------|------|--------|-------|
| RSS | Malformed XML | ✅ | Regex parser handles incomplete tags gracefully |
| RSS | Empty fields | ✅ | Skipped (returns null, filtered out) |
| RSS | CDATA handling | ✅ | Correctly parses `<![CDATA[...]]>` |
| RSS | Invalid dates | ✅ | Falls back to `new Date().toISOString()` |
| Reddit | Rate limiting | ✅ | 500ms delay between subreddits |
| Reddit | Network errors | ✅ | Returns empty array, logs error |
| Hacker News | API availability | ✅ | Returns empty array on failure |
| TheNewsAPI | Missing API key | ✅ | Gracefully skips with warning log |
| TheNewsAPI | Invalid API key | ✅ | Returns empty array after API error |
| TheNewsAPI | Rate limit reached | ✅ | Skips when daily limit (95) nearly reached |

### 3. Relevance Scoring Edge Cases

| Test | Status | Notes |
|------|--------|-------|
| Empty article (no title/snippet) | ✅ | Returns score 0 |
| Invalid date format | ✅ | No crash, skips recency bonus |
| Future date | ✅ | No recency bonus (fixed) |
| Multiple neighborhoods | ✅ | Correctly scores 3 points each |
| Local source bonus | ✅ | SF Standard, Mission Local get +5 |

### 4. Date Parsing Edge Cases

| Format | Status |
|--------|--------|
| `2025-01-15` | ✅ |
| `2025-01-15T12:00:00Z` | ✅ |
| `2025-01-15T12:00:00.000Z` | ✅ |
| `Wed, 15 Jan 2025 12:00:00 GMT` | ✅ |
| `January 15, 2025` | ✅ |

### 5. Combined Source Tests

| Test | Status | Notes |
|------|--------|-------|
| All sources combined | ✅ | Parallel fetching works |
| Cross-category deduplication | ✅ | No duplicate URLs across categories |
| Future date filter (empty results) | ✅ | Correctly returns empty arrays |
| Error handling (graceful degradation) | ✅ | Individual source failures don't crash system |

---

## 🔍 Source Client Analysis

### RSS Parser (`lib/sources/rss-parser.ts`)

**Strengths:**
- Simple regex-based parsing (no heavy XML library)
- Handles CDATA correctly
- Graceful error handling

**Potential Issues:**
- Regex-based parsing can fail on unusual XML structures
- No retry logic for transient failures

**Recommendation:** Consider adding a simple retry (1-2 attempts) for network failures.

### Reddit Client (`lib/sources/reddit-client.ts`)

**Strengths:**
- Proper rate limit handling (500ms delays)
- Category inference from post content/flair
- Filters out low-score and meta posts

**Potential Issues:**
- No handling for Reddit API changes
- User-Agent might need updating if Reddit blocks

**Recommendation:** Add exponential backoff for 429 responses.

### Hacker News Client (`lib/sources/hackernews-client.ts`)

**Strengths:**
- Uses reliable Firebase API
- Good SF relevance filtering
- Batched requests (20 at a time)

**Potential Issues:**
- Fetches 100 stories every time (could be reduced)

**Recommendation:** Consider caching story IDs for a few minutes.

### TheNewsAPI Client (`lib/sources/thenewsapi-client.ts`)

**Strengths:**
- Tracks daily usage to avoid hitting limits
- Auto-resets counter at midnight

**Potential Issues:**
- Usage counter resets on process restart
- No handling for API key expiration

**Recommendation:** Add API key validation on startup.

---

## 📈 API Route Edge Cases

### `/api/seed-weekly-news-real` (Tested via code review)

| Scenario | Handling |
|----------|----------|
| All sources fail | Returns 500 with "No news articles found" |
| Missing CRON_SECRET | Allows all requests (dev mode) |
| Invalid weekOf parameter | Parses gracefully or uses current week |
| WeeklyNews already exists | Uses `upsert` (updates existing record) |
| LLM timeout | Falls back to `generateCategorySummary()` |

### `/api/weekly-news`

| Scenario | Handling |
|----------|----------|
| No weekly news found | Returns 404 with error message |
| Invalid weekOf format | May fail silently (needs validation) |

---

## 🎯 Recommendations

### Critical (Fixed)
1. ~~URL deduplication stripping all query params~~ ✅
2. ~~Cross-category duplicates~~ ✅
3. ~~Future date scoring bug~~ ✅

### Medium Priority
4. Add weekOf parameter validation in `/api/weekly-news`
5. Add retry logic for RSS feeds (1-2 attempts)
6. Persist TheNewsAPI usage count (currently lost on restart)

### Low Priority
7. Add cache for Hacker News story IDs
8. Add exponential backoff for Reddit 429 responses
9. Consider rate limiting for API routes

---

## 📁 Test Files

- `scripts/test-edge-cases.ts` - Main test suite (25 tests)
- `scripts/test-bugs-detailed.ts` - Detailed bug investigation
- `test-results.json` - JSON output of test results

---

## ✅ Conclusion

The multi-source news aggregation system is robust with good error handling. Three bugs were found and fixed:

1. **URL deduplication** was too aggressive (stripping meaningful query params)
2. **Cross-category duplicates** were not being removed
3. **Future dates** incorrectly received recency bonuses

All 25 edge case tests now pass. The system gracefully handles source failures, malformed data, and API issues without crashing.
