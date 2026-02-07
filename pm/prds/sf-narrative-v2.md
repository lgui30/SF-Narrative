---
markform:
  spec: MF/0.1
  title: "SF Narrative v2 — Your Neighborhood, Decoded"
  created: 2026-02-06
  roles:
    - user
    - agent
---

<!-- form id="prd" -->

# SF Narrative v2 — Your Neighborhood, Decoded

<!-- group id="meta" -->

<!-- field kind="enum" id="status" label="Status" role="user" options="Draft,In Review,Approved,In Progress,Complete,Abandoned" -->
```value
Draft
```
<!-- /field -->

<!-- field kind="string" id="author" label="Author" role="user" -->
Claude Code + User Research (Feb 2026)
<!-- /field -->

<!-- /group -->

---

<!-- group id="problem" -->

## Problem

<!-- field kind="text" id="problem_statement" label="What problem does this solve? Who has it?" role="user" -->

### The Disconnected Resident Problem

**Who:** ~840,000 San Francisco residents — newcomers, long-timers, and everyone in between.

**Core pain point:** SF residents feel disconnected from their own neighborhoods. Critical daily information — what's safe, what's happening, what's changing, and what's worth doing — is scattered across 10+ fragmented platforms (Nextdoor, Reddit, Instagram, SF Funcheap, Eddie's List, Facebook Events, Eventbrite, Citizen, local news sites, 311, etc.). No single source gives them a trustworthy, hyperlocal picture of their neighborhood.

**Five intersecting problems validated by research:**

**1. Information Fragmentation (Universal)**
Residents must monitor 10+ sources to stay informed. Reddit quote: *"There isn't one best way. You will always ping on a few different sources."* One highly-upvoted post asked: *"Where can I get all the information about events happening in SF if I were to delete Instagram today?"* — there was no good answer.

**2. Safety Perception Gap (Top Emotional Pain Point)**
Crime is down 25% in 2025, car break-ins at 22-year lows, homicides at 70-year lows — but residents *feel* more unsafe than ever. Why? They lack hyperlocal, real-time context. Safety varies block-by-block, hour-by-hour, and no tool gives them that granularity. Residents rely on outdated anecdotes and fear-driven Nextdoor posts instead of data.

**3. Event Discovery FOMO (Lifestyle Pain Point)**
Residents constantly learn about festivals, pop-ups, and neighborhood events *after* they've ended. SF has abundant activity but discovery is broken. The effort to track everything causes "discovery fatigue" — people give up and miss out, reinforcing isolation.

**4. Neighborhood Change Without Context (Civic Pain Point)**
82,000 new housing units mandated by 2031. Neighborhoods are being rezoned, businesses are opening/closing, demographics are shifting — and residents have no narrative layer explaining *what's happening* and *why*. They file 800,000+ 311 complaints/year but never see the story behind the data.

**5. Social Isolation Despite Proximity (Emotional Pain Point)**
Multiple Reddit threads with hundreds of upvotes: *"Is it just me or can SF make you feel very lonely?"* High mobility (friends leave), tech work culture, and smartphone isolation create a paradox — surrounded by people seeking connection, unable to connect. Run clubs and niche apps help, but are fragmented.

**The failed incumbent: Nextdoor** — the dominant neighborhood app is described by residents as "enabling irrational fear of crime," "toxic," "politically polarized," and "making neighborhoods more paranoid, not more neighborly." Users call it a "necessary evil." Its content moderation is described as "opaque, capricious, and ideologically motivated."

<!-- /field -->

<!-- field kind="text" id="why_now" label="Why solve this now?" role="user" -->

### Why Now

**1. Perfect Storm of Timing (2025-2026):**
- Crime at historic lows but perception hasn't caught up — narrative correction opportunity
- SF's $1B budget deficit means city services will get *worse*, increasing need for resident self-organization
- Super Bowl LX (Feb 2026) driving national attention to SF
- AI boom reshaping Mission Bay, SoMa, and downtown — neighborhoods changing fast
- 82,000 housing units mandated — biggest zoning changes in decades incoming

**2. Nextdoor Backlash at Peak:**
- Consistent, growing dissatisfaction across Reddit, news coverage, and user reviews
- Users actively searching for alternatives (Closeby, OneRoof, Nearlist all launching)
- Market moment for a quality replacement

**3. Technology Enablers:**
- Existing data pipelines already built (this project has news, activities, map infrastructure)
- LLM integration enables AI-powered neighborhood summaries at low cost
- Real-time data APIs (transit, 311, crime stats) readily available
- Mobile-first frameworks (Next.js) support responsive deployment

**4. Demographic Tailwind:**
- AI wealth influx creating high-income, tech-savvy residents willing to pay for quality
- Homes selling faster in SF than anywhere in America
- Young professionals arriving who need hyperlocal onboarding

**5. Local News Desert:**
- Only Mission Local does deep hyperlocal journalism (and only for one district)
- Hoodline's pivot to AI content drew criticism — quality gap widening
- SF Chronicle behind paywall — most residents don't subscribe

<!-- /field -->

<!-- /group -->

---

<!-- group id="solution" -->

## Solution

<!-- field kind="text" id="overview" label="What are we building? (1-2 sentences)" role="user" -->

**SF Narrative** is a hyperlocal neighborhood intelligence platform that gives SF residents a single, trustworthy view of their neighborhood — combining curated news, events/activities, safety context, and neighborhood change narratives on an interactive map. Think "Google Maps meets local newspaper meets neighborhood guide" — without Nextdoor's toxicity.

<!-- /field -->

<!-- field kind="text" id="how_it_works" label="How does it work?" role="user" -->

### Product Architecture: Three Layers

```
┌─────────────────────────────────────────────┐
│           LAYER 1: THE MAP (Entry Point)     │
│  Interactive SF map — tap any neighborhood   │
│  to see its pulse: news, events, safety,     │
│  what's changing                             │
├─────────────────────────────────────────────┤
│           LAYER 2: THE FEED (Daily Use)      │
│  Personalized stream of news + events +      │
│  neighborhood updates, organized by time     │
│  ("Today" / "This Week" / "Coming Up")       │
├─────────────────────────────────────────────┤
│           LAYER 3: THE DIGEST (Weekly)       │
│  AI-curated weekly summary per neighborhood: │
│  "What happened, what's coming, what you     │
│  missed" — delivered every Friday            │
└─────────────────────────────────────────────┘
```

### Core Feature Set

**A. Neighborhood Map (Home Screen)**
- Interactive Leaflet map of SF's 36+ neighborhoods
- Each neighborhood shows a "pulse" indicator: composite score of activity level (events count), news volume, and trending topics
- Tap a neighborhood → slide-up bottom sheet with:
  - **Identity card**: 2-sentence personality description (e.g., "The Mission: Murals, burritos, and the beating heart of SF's Latino culture. Rapidly changing but still fiercely itself.")
  - **This week's highlights**: Top 3 events + top news story
  - **Vibe indicators**: Busy/quiet, trending up/down, free things happening
- Color-coded by content density (not just events — news + events + changes combined)
- Category layer toggles: News / Events / Safety / Development

**B. Neighborhood Feed (Primary Daily View)**
- Mixed content stream combining:
  - **News cards** (sourced from local outlets, Reddit, RSS — with AI summary)
  - **Event/activity cards** (from Eventbrite, Meetup, FunCheap, venue sites)
  - **Neighborhood change cards** ("New restaurant opening on Valencia", "Rezoning proposal for Sunset")
  - **Weekly digest cards** (AI-generated neighborhood summaries)
- Time-based sections: "Today" → "This Week" → "Coming Up"
- Filter by: neighborhood(s), category, free-only, date range
- Organic card grid: hero cards for top stories, compact cards for regular items
- "What You Missed" section at bottom — events that already happened with highlights

**C. Weekly Neighborhood Digest (Friday Delivery)**
- AI-generated summary for each neighborhood the user follows:
  - "Here's what happened in [Neighborhood] this week"
  - Top 3 news stories with 1-sentence summaries
  - Events recap (attendance indicators if available)
  - Upcoming next week preview
  - One "hidden gem" recommendation
- Powered by existing LLM pipeline (Novita/DeepSeek)
- Available in-app and as a shareable link

**D. Neighborhood Context Layer (Differentiator)**
- **"Why is this happening?"** explainers attached to news stories
  - E.g., news about a new building → linked to the housing mandate context
  - E.g., encampment relocation → linked to enforcement policy changes
- **Neighborhood change timeline**: Visual history of what's changed in the last 6 months
- **Development tracker**: What's being built, proposed, or contested in each neighborhood
- **311 narrative**: Aggregated complaint trends with plain-English summaries ("Marina residents are mostly reporting blocked driveways; Tenderloin reports focus on street cleanliness")

**E. Safety Context (Not Crime Alerts)**
- NOT Citizen-style fear alerts. Instead: contextual safety information
- Neighborhood safety profile: data-driven overview with nuance
  - "Property crime is down 27% this year. Car break-ins at 22-year lows. Most incidents cluster around [specific corridors] between [hours]."
- Time-of-day guidance: "This area is busy and well-lit until 10pm; quieter after midnight"
- Transit safety notes: Which Muni lines have the most complaints, and when
- Framing is always **contextual and empowering**, never fear-driven

**F. Event Discovery (Enhanced)**
- All existing activity sources (Eventbrite, Meetup, FunCheap, Firecrawl) unified
- **Smart categorization**: Food, Outdoor, Music, Community, Nightlife, Free, Family
- **"Happening Now" indicator** for live events
- **Neighborhood grouping**: See all events in your neighborhood at a glance
- **"Don't Miss" flags**: AI-identified events that match your past interests or are trending
- **Post-event highlights**: Brief "what happened" for major events (sourced from social media/news)

### Design Language

**Visual Identity:**
- **Color palette**: "Nature Distilled" — fog gray (#E8E4E0), ocean teal (#2A7F8E), terracotta (#C4704B), forest green (#3D6B4F), warm white (#FAF8F5)
- **Typography**: Inter (primary), JetBrains Mono (data/stats only)
- **Map style**: Warm, muted CARTO basemap — not the default blue/gray
- **Card design**: Glassmorphism overlays on map, clean bordered cards in feed
- **Dark mode**: Full support from day one

**Interaction Patterns:**
- **Bottom sheet**: Tap map → info slides up (like Google Maps)
- **Pull-to-refresh**: Fog-themed loading animation
- **Swipeable pills**: Horizontal neighborhood/category filters
- **Card hover lift**: Subtle elevation + shadow on interaction
- **Smooth transitions**: Map ↔ Feed view with crossfade animation
- **Collapsible map**: Shrinks to strip at top when scrolling feed, pull down to expand

**Mobile-First Navigation:**
```
┌──────────────────────────────┐
│                              │
│     [Content Area]           │
│                              │
├──────────────────────────────┤
│  🗺️ Map  │  📰 Feed  │  🔍 Search  │
└──────────────────────────────┘
```

<!-- /field -->

<!-- /group -->

---

<!-- group id="scope" -->

## Scope

<!-- field kind="text" id="goals" label="Goals (what's in scope)" role="user" -->

### V2 Launch Goals (MVP)

**Must Have (P0):**
1. ✅ Interactive neighborhood map with pulse indicators (extend existing map)
2. ✅ Neighborhood identity cards (2-sentence descriptions for all 36+ neighborhoods)
3. ✅ Unified feed mixing news + activities with time-based sections
4. ✅ Reunified news UI (bring back news cards using existing DB/API pipeline)
5. ✅ Category + neighborhood filtering (extend existing filters)
6. ✅ "Nature Distilled" color palette + Inter typography + dark mode
7. ✅ Mobile-responsive bottom sheet pattern for map interactions
8. ✅ Bottom navigation bar (Map / Feed / Search)

**Should Have (P1):**
9. Weekly AI-generated neighborhood digest (leverage existing LLM pipeline)
10. "What You Missed" section for past events
11. Glassmorphism map overlays
12. Neighborhood change cards (development/business openings)
13. Collapsible map in feed view

**Nice to Have (P2):**
14. Safety context profiles per neighborhood
15. 311 complaint narrative aggregation
16. "Happening Now" live event indicators
17. Post-event highlight cards
18. Shareable weekly digest links

<!-- /field -->

<!-- field kind="text" id="non_goals" label="Non-goals (explicitly out of scope)" role="user" -->

### Explicitly Out of Scope

1. **User-generated content / comments** — We are NOT building Nextdoor. No user posts, no comments section, no community forums. Content is curated, not crowdsourced. This is intentional to avoid toxicity.
2. **Real-time crime alerts** — We are NOT building Citizen. No push notifications about incidents. Safety info is contextual and data-driven, not reactive.
3. **Social features / friend lists / messaging** — No social graph. This is a content platform, not a social network.
4. **Native mobile app** — Web-first (Next.js PWA potential later). No App Store submission for v2.
5. **Monetization / ads / paywalls** — v2 is free. Revenue model comes later.
6. **Original journalism** — We aggregate and summarize, we don't report. No editorial staff.
7. **Neighborhoods outside SF** — SF only. No Oakland, no wider Bay Area.
8. **User accounts / authentication** — v2 is anonymous. No login required.
9. **Push notifications** — No notification system in v2.
10. **Multilingual support** — English only for v2 (Spanish/Chinese in v3).

<!-- /field -->

<!-- /group -->

---

<!-- group id="details" -->

## Details

<!-- field kind="text" id="user_flow" label="User flow (step by step)" role="agent" -->

### Primary User Flow: "What's happening in my neighborhood?"

```
1. LAND → User opens SF Narrative
   └── See: Full SF map with neighborhood polygons, colored by activity pulse
   └── See: Bottom nav: Map (active) | Feed | Search

2. EXPLORE MAP → Tap a neighborhood (e.g., "Mission")
   └── See: Bottom sheet slides up with:
         - Neighborhood identity card ("The Mission: Murals, burritos...")
         - This week: 12 events, 4 news stories
         - Top 3 event cards + top news headline
         - "See all →" button

3. DIVE INTO FEED → Tap "See all" or switch to Feed tab
   └── See: Filtered feed for Mission district
         - Time sections: "Today" (3 items) → "This Week" (8 items) → "Coming Up" (5 items)
         - Mixed cards: news (blue accent) + events (teal accent)
         - Filter pills at top: All | News | Events | Free
   └── Action: Scroll, tap cards to expand, tap filter pills

4. READ CONTENT → Tap a news card
   └── See: Expanded card with:
         - AI summary (2-3 sentences)
         - Key bullet points
         - Source link(s)
         - Related neighborhood tag
         - "Why this matters" context line (P1)

5. DISCOVER EVENT → Tap an event card
   └── See: Expanded card with:
         - Full description
         - Date, time, venue, price
         - Neighborhood badge
         - "View Event →" CTA to source
         - Map pin showing location (P1)

6. BROWSE ANOTHER NEIGHBORHOOD → Switch back to Map tab
   └── Tap another neighborhood → repeat flow
   └── Or: Use Search tab to find specific topics/events
```

### Secondary Flow: "What's happening everywhere today?"

```
1. Open app → Tap "Feed" tab
2. See: City-wide feed, time-sorted ("Today" first)
3. Scroll through mixed news + events from all neighborhoods
4. Each card tagged with neighborhood pill
5. Tap neighborhood pill → filter to that neighborhood
```

### Weekly Flow: "What did I miss?"

```
1. Open app on Saturday/Sunday
2. See: Weekly Digest card pinned at top of feed
3. Tap → See neighborhood-by-neighborhood summary
4. "What You Missed" section shows past events with brief highlights
```

<!-- /field -->

<!-- field kind="text" id="edge_cases" label="Edge cases to handle" role="agent" -->

### Edge Cases

1. **Empty neighborhoods**: Some neighborhoods may have zero events/news in a given week. Show: "It's quiet in [neighborhood] this week. Here's what's nearby in [adjacent neighborhoods]."

2. **Stale data**: If news/activities cache hasn't been refreshed in 48+ hours, show a subtle "Last updated: [time]" indicator. Don't serve week-old data as "today."

3. **Events with no neighborhood match**: Some events (e.g., "Virtual Wine Tasting") can't be geo-located. Group under "Citywide / Virtual" category with a toggle to show/hide.

4. **Duplicate events across sources**: Same event listed on Eventbrite AND Meetup AND FunCheap. Deduplicate by fuzzy-matching title + date + venue. Show the richest data source.

5. **News stories spanning multiple neighborhoods**: A story about "Mission and Castro rezoning" should appear in both neighborhood feeds, tagged with both.

6. **Map on small screens**: On phones <375px wide, the map becomes too small to tap neighborhoods accurately. Use a list-based neighborhood picker as fallback, with map as secondary.

7. **GeoJSON boundary disputes**: Some locations fall on neighborhood borders. Use centroid-based assignment with manual overrides for known disputed locations (e.g., Duboce Triangle vs. Castro).

8. **LLM summary quality**: AI-generated digests may occasionally hallucinate or miss context. Include "AI-generated summary" disclaimer and link to original sources for verification.

9. **Event time zones**: All events should display in Pacific Time. Handle edge cases for events imported from APIs that use UTC.

10. **Seasonal variation**: Event density varies dramatically (summer street fairs vs. winter). Don't let heat-map coloring make winter look "dead" — use relative scaling per season.

<!-- /field -->

<!-- field kind="text" id="technical_notes" label="Technical approach" role="agent" -->

### Technical Approach

**Leverage Existing Infrastructure:**
The current codebase already has most backend pieces. The work is primarily frontend redesign + reconnecting orphaned pipelines.

```
EXISTING (reuse)              BUILD NEW
─────────────────             ─────────────
✅ Leaflet map + GeoJSON      🔨 Bottom sheet component
✅ Activities pipeline         🔨 News card component (re-create)
✅ News pipeline + Prisma DB   🔨 Unified feed with time sections
✅ LLM integration (Novita)    🔨 Neighborhood identity cards
✅ Category filtering           🔨 Bottom navigation bar
✅ Neighborhood matching        🔨 New color palette + typography
✅ API routes                   🔨 Dark mode CSS variables
✅ Content caching              🔨 Weekly digest generation
✅ sf-locations.ts database     🔨 Collapsible map behavior
```

**Architecture Changes:**

1. **page.tsx**: Fetch both news AND activities (currently only activities). Pass unified content array to HomeClient.

2. **HomeClient.tsx**: Major refactor
   - Add bottom navigation (Map / Feed / Search)
   - Add view state management (map view vs feed view)
   - Implement bottom sheet for neighborhood details
   - Replace current sidebar with responsive feed

3. **New components needed:**
   - `BottomSheet.tsx` — Slide-up panel for map interactions
   - `NeighborhoodCard.tsx` — Identity card with description + stats
   - `NewsCard.tsx` — Re-created news display card
   - `EventCard.tsx` — Refined event card (extract from HomeClient)
   - `UnifiedFeed.tsx` — Time-sectioned mixed content feed
   - `BottomNav.tsx` — App navigation bar
   - `WeeklyDigest.tsx` — AI-generated summary display
   - `FilterBar.tsx` — Horizontal scrolling filter pills

4. **Data layer:**
   - Add `data/neighborhood-identities.json` — 36+ neighborhood descriptions
   - Extend content-types.ts with unified `FeedItem` type (news | event | digest)
   - Add `/api/digest` route for weekly AI summary generation

5. **Styling:**
   - Replace JetBrains Mono with Inter as primary font
   - New CSS custom properties for Nature Distilled palette
   - Dark mode via `prefers-color-scheme` + manual toggle
   - Glassmorphism utility classes (backdrop-blur, bg-opacity)

**Performance Considerations:**
- Lazy-load map (Leaflet is heavy) — show feed first on mobile
- Virtual scrolling for long feeds (if > 50 items)
- Cache neighborhood identities in static JSON (no API call needed)
- Stale-while-revalidate pattern for news/activities data

**Data Refresh Strategy:**
- News: Fetched via cron (existing Friday schedule) + on-demand refresh
- Activities: Daily cache refresh via script
- Digests: Generated Friday evening after news fetch completes
- Map pulse data: Computed client-side from cached content counts

<!-- /field -->

<!-- /group -->

---

<!-- group id="tracking" -->

## Tracking

<!-- field kind="text" id="success_metrics" label="How do we know this worked?" role="user" -->

### Success Metrics

**Primary (Product-Market Fit):**
1. **Return visits**: >30% of users return within 7 days (indicates habit formation)
2. **Session depth**: Average >3 neighborhood explorations per session
3. **Feed scroll depth**: Users scroll past "Today" section into "This Week" (engagement)
4. **External click-through**: >15% of event card views lead to "View Event" clicks

**Secondary (Content Quality):**
5. **Content freshness**: News/activities updated within 24 hours of occurrence
6. **Neighborhood coverage**: >80% of neighborhoods have at least 1 content item per week
7. **Source diversity**: Content from 3+ sources per neighborhood per week

**Qualitative:**
8. Share feedback: "I discovered something I would have missed" responses
9. No complaints about fear-mongering or toxicity (anti-Nextdoor positioning holds)

<!-- /field -->

<!-- field kind="text" id="open_questions" label="Open questions" role="user" -->

### Open Questions

1. **Neighborhood count**: Do we support all 36 official neighborhoods, or start with the ~15 most active? Starting smaller means richer content per neighborhood but less coverage.

2. **News source licensing**: Are we scraping or using APIs for news content? Need to ensure we're not violating terms of service for SF Chronicle, SFist, etc. RSS feeds are safer.

3. **LLM cost**: Weekly digests for 36 neighborhoods × 52 weeks = ~1,900 LLM calls/year. Is the Novita/DeepSeek pricing sustainable? Should we batch-generate or generate on-demand?

4. **Safety data source**: Where do we get hyperlocal safety data? SFPD has an open data portal, but granularity and freshness vary. Is this P0 or can it wait for P2?

5. **Deployment target**: Continue on Vercel? The existing timeout issues with LLM calls suggest we may need background job processing (Vercel Cron + edge functions, or move to a different host).

6. **Content moderation**: Even without user-generated content, AI summaries could surface sensitive topics (violence, discrimination). Do we need a review layer?

7. **Mobile PWA**: Should we add a manifest.json + service worker for "Add to Home Screen" capability in v2, or defer?

8. **Analytics**: What analytics tool? Vercel Analytics, Plausible, or PostHog for privacy-respecting tracking?

<!-- /field -->

<!-- /group -->

---

## Research Sources

This PRD was informed by comprehensive web research conducted on 2026-02-06:

**Pain Point Validation:**
- Reddit r/sanfrancisco, r/AskSF, r/bayarea (multiple threads, 2024-2026)
- SF Chronicle, Mission Local, SF Standard, Axios SF
- SFPD crime statistics (2025 year-end data)
- SFMTA transit reports and complaint data
- SF 311 complaint data (800,000+ reports in 2025)

**Market Research:**
- Nextdoor user reviews and competitor analysis
- Local news landscape: SFist, Hoodline, Mission Local, 48 Hills, SF Public Press
- App ecosystem: Transit, Citizen, Eventbrite, Meetup, SF Funcheap
- Startup landscape: Closeby, OneRoof, Nearlist, SolveSF

**Design Trends:**
- Elementor, Figma, Squarespace, Wix design trend reports (2025-2026)
- Eleken, Mapme, Awwwards for map UI patterns
- CrawlSF neighborhood guide format as content model

**Key Statistics:**
- Crime down 25% citywide (2025 vs 2024)
- Car break-ins at 22-year lows
- Homicides at 70-year low (28 total, lowest since 1954)
- ~8,000 people experiencing homelessness nightly
- 800,000+ 311 complaints filed in 2025
- $3,100/month median 1-BR rent (12% YoY increase)
- $1B city budget deficit projected for 2026
- 82,069 new housing units mandated by 2031

<!-- /form -->
