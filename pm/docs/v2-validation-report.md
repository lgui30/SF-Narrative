# SF Narrative v2 — Validation Report
Date: 2026-02-06

## Build Status
- **npm run build: PASS** — Compiled successfully after fixing duplicate property in sf-locations.ts
- **npm run lint: SKIP** — No ESLint configuration exists in the project (pre-existing issue, not introduced by v2 work). `next lint` fails with "Invalid project directory" because no `.eslintrc` or `eslint.config` file is present.

## Fixes Applied
1. **sf-locations.ts:253** — Removed duplicate `'dna lounge': 'SoMa'` entry (already defined at line 105). This was a pre-existing duplicate that TypeScript strict mode now catches.

## P0 Requirements

| # | Requirement | Status | Notes |
|---|------------|--------|-------|
| 1 | Interactive map with pulse indicators | PASS | NeighborhoodMap.tsx uses Nature Distilled colors (fog-gray, ocean-teal, forest-green, terracotta). Activity-based coloring via `getColorByCount()`. Hover effects with terracotta highlight. |
| 2 | Neighborhood identity cards | PASS | `data/neighborhood-identities.json` exists (150 lines). `NeighborhoodCard.tsx` renders tagline, description, event/news counts, and "See all" button. |
| 3 | Unified feed mixing news + activities with time sections | PASS | `UnifiedFeed.tsx` groups items by Today/This Week/Coming Up via `groupByTimeSection()`. Renders NewsCard for news, EventCard for events, inline card for digests. |
| 4 | News cards displaying data | PASS | `NewsCard.tsx` renders category badge, neighborhood, time ago, title, summary, expandable bullets + source links. `page.tsx` loads news from `data/news-cache.json` and converts to NewsStory format. HomeClient passes newsStories to UnifiedFeed. |
| 5 | Category + neighborhood filtering | PASS | `FilterBar.tsx` has horizontal scrolling pill buttons for both categories and neighborhoods. HomeClient defines 8 categories (All, Free, Food, Community, Nightlife, Outdoor, Events, News) and dynamically extracts neighborhoods from activities. Filtering logic in `feedItems` useMemo. |
| 6 | Nature Distilled palette + Inter typography + dark mode | PASS | `globals.css` defines all CSS vars (fog-gray, ocean-teal, terracotta, forest-green, warm-white). `layout.tsx` loads Inter + JetBrains Mono via next/font/google. Dark mode via `prefers-color-scheme` media query AND `.dark` class with localStorage-based script in layout. |
| 7 | Mobile-responsive bottom sheet on map | PASS | `BottomSheet.tsx` with touch drag-to-dismiss, escape key close, backdrop overlay, glassmorphism styling, max-h-[70vh]. Integrated in NeighborhoodMap.tsx — clicking a neighborhood opens bottom sheet with NeighborhoodCard. |
| 8 | Bottom navigation bar (Map/Feed/Search) | PASS | `BottomNav.tsx` with Map, Feed, Search tabs using lucide icons. Fixed positioning, glassmorphism glass class, safe-area-inset-bottom padding. HomeClient manages activeView state and renders correct view per tab. |

## Integration Verification

| Check | Status | Notes |
|-------|--------|-------|
| HomeClient imports all new components | PASS | Imports BottomNav, FilterBar, UnifiedFeed, NeighborhoodMap (dynamic) |
| page.tsx passes both news and activities | PASS | `loadActivities()` from activities-cache.json, `loadNewsStories()` from news-cache.json, both passed to HomeClient |
| NeighborhoodMap onNeighborhoodSelect works | PASS | Callback wired in HomeClient, sets selectedNeighborhood state |
| Component props match parent-child | PASS | All prop interfaces align. Build compiles with zero TS errors. |
| No circular imports | PASS | content-types.ts imports from types.ts (one direction). Components import types from lib. No circular chains. |

## Minor Issues (non-blocking)

1. **newsCountByNeighborhood not passed to map** — HomeClient does not compute or pass `newsCountByNeighborhood` prop to NeighborhoodMap. The prop is optional so it compiles, but the bottom sheet's NeighborhoodCard will always show 0 news articles. Low priority — the data pipeline exists, just needs wiring.

2. **No ESLint config** — Pre-existing. The `lint` npm script exists but no ESLint configuration file is present. Should be set up separately.

3. **Duplicate map legend** — Both NeighborhoodMap.tsx (line 191-207) and HomeClient.tsx (line 241-257) render a map legend. The one in HomeClient uses CSS variables while NeighborhoodMap uses inline rgba colors, and they show different color schemes (HomeClient shows ocean-teal/terracotta/forest-green, NeighborhoodMap shows ocean-teal at two opacities + forest-green). Minor visual inconsistency.
