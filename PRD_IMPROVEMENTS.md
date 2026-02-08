# PRD: SF-Narrative Improvements

## Overview
Post-MVP improvements to SF Weekly News Digest focused on mobile UX, performance perception, shareability, and backend robustness.

## Current State
- Next.js 16 + React 19 + Tailwind 4 + Prisma + PostgreSQL
- Multi-source news aggregation (RSS, Reddit, HN, TheNewsAPI backup)
- LLM summarization via Novita API (Llama 3B)
- List/Map view toggle, News Q&A modal, Week selector
- Vercel-hosted with Friday 8AM cron job

## Improvements (6 tasks, 3 teams)

---

### TEAM 1: Frontend UX (Tasks 1-3)

#### Task 1: Shareable Week URLs
**File:** `components/HomeClient.tsx`
- Sync `selectedWeek` with URL query param `?week=YYYY-MM-DD`
- On mount: read `week` from `searchParams`, use as initial selection
- On week change: update URL via `window.history.replaceState` (no full reload)
- Fallback: if param missing or invalid, use latest week (current behavior)
- **Test:** Copy URL with `?week=...`, open in new tab → same week loads

#### Task 2: Skeleton Loaders
**New file:** `components/ui/SkeletonCard.tsx`
- Create skeleton card matching `NewsCard` dimensions
- Animated pulse effect (Tailwind `animate-pulse`)
- Show 4 skeleton cards in 2x2 grid during `isLoadingWeek`
- Replace current spinner in `HomeClient.tsx`
- **Test:** Slow network → skeleton cards visible during load

#### Task 3: Error Recovery + Retry Button
**File:** `components/HomeClient.tsx`
- Add "Try Again" button to error state
- Button calls `setSelectedWeek(selectedWeek)` to re-trigger fetch
- Style: match existing button style (border, font-mono, etc.)
- **Test:** Disconnect network → error shows → reconnect → click retry → loads

---

### TEAM 2: Mobile & Polish (Tasks 4-5)

#### Task 4: Mobile Responsive Q&A Modal
**File:** `components/ui/NewsQAModal.tsx`
- Below 640px (`sm` breakpoint): modal goes full-screen
- Add `max-h-screen overflow-y-auto` on mobile
- Close button: larger touch target (44x44px min)
- Input field: `text-base` to prevent iOS zoom on focus
- Add swipe-down-to-close gesture (optional, nice-to-have)
- **Test:** Open modal on mobile viewport → fills screen, easy to close

#### Task 5: Article Freshness Indicators
**File:** `components/ui/NewsCard.tsx`
- Add relative time to each source link: "2h ago", "3 days ago", "1 week ago"
- Helper function `formatRelativeTime(dateString: string): string`
- Place after source name: `SF Standard · 2 days ago`
- Don't import date-fns — write a simple helper (< 20 lines)
- **Test:** Sources show human-readable relative times

---

### TEAM 3: Backend Robustness (Task 6)

#### Task 6: DB Query Optimization + RSS Retry + weekOf Validation
**Files:** `app/api/weekly-news/route.ts`, `lib/sources/rss-parser.ts`

**6a. Fix DB query (weekly-news route):**
```typescript
// BEFORE (bad): fetches ALL weeks, filters in JS
const allWeeks = await prisma.weeklyNews.findMany();
const weeklyNewsRecord = allWeeks.find(...)

// AFTER (good): query directly
const weeklyNewsRecord = await prisma.weeklyNews.findFirst({
  where: { weekOf: new Date(weekOfParam) }
});
```

**6b. Add weekOf validation:**
- Validate `weekOfParam` is a valid date string before querying
- Return 400 if invalid: `{ success: false, error: "Invalid weekOf parameter" }`

**6c. RSS retry logic:**
- In `rss-parser.ts`, wrap fetch calls with 1 retry on failure
- Simple: `try { fetch } catch { await sleep(1000); fetch again }`
- Log retry attempts

**Test:** Invalid date param → 400 error. RSS feed timeout → retries once.

---

## Non-Goals (this round)
- Dark mode (larger design effort)
- PWA/service worker
- Newsletter/email digest
- Map mobile pinch-zoom improvements

## Tech Notes
- No new dependencies allowed
- All changes must be TypeScript strict-compatible
- Maintain existing code style (font-mono, border-gray-300, etc.)
- Test by running `npm run dev` locally or `npm run build`
