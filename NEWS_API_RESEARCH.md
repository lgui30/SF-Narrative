# SF-Narrative News API Research

**Last Updated:** 2026-02-08  
**Purpose:** Find better news sources than current NewsAPI.org (100 req/day) + Google News RSS (no dates)

---

## 📊 Summary & Recommendations

### Best Options for SF-Narrative

| API | Free Tier | Best For | SF Relevance |
|-----|-----------|----------|--------------|
| **TheNewsAPI** ⭐ | 100/day, real-time | Best value free tier | Medium |
| **Hacker News API** ⭐ | Unlimited, free | Tech news | High (SF tech) |
| **Reddit JSON** ⭐ | Free w/ auth | Community pulse | Very High |
| **SF Standard RSS** ⭐ | Unlimited | Local news | Perfect |
| **Mission Local RSS** ⭐ | Unlimited | Hyperlocal | Perfect |
| CurrentsAPI | 600/mo | Cheap paid | Medium |
| GNews | 100/day | Google News mirror | Medium |
| Mediastack | 100/mo | Historical data | Medium |

### Recommended Stack
1. **Primary:** TheNewsAPI (free tier) + RSS feeds (SF Standard, Mission Local)
2. **Tech/Community:** Hacker News API + Reddit JSON
3. **Fallback:** GNews (Google News mirror)
4. **Upgrade path:** CurrentsAPI ($150/mo for 300k requests)

---

## 1. General News APIs

### 📰 TheNewsAPI ⭐ RECOMMENDED
**Website:** https://www.thenewsapi.com

**Pricing:**
| Plan | Cost | Daily Requests | Articles/Request |
|------|------|----------------|------------------|
| Free | $0 | 100 | 3 |
| Basic | $19/mo | 2,500 | 25 |
| Standard | $49/mo | 10,000 | 100 |
| Pro | $79/mo | 25,000 | 200 |

**Pros:**
- Real-time data on free tier (unlike others with delays)
- Historical data included on all tiers
- Headlines with similar articles grouping
- Full source/language access

**Cons:**
- Only 3 articles per request on free tier
- Limited to 100 requests/day free

**API Example:**
```bash
curl "https://api.thenewsapi.com/v1/news/all?api_token=YOUR_TOKEN&search=san+francisco&language=en&locale=us"
```

**SF Relevance:** Can filter by locale=us, search "san francisco" or "bay area"

---

### 📰 GNews (Google News Mirror)
**Website:** https://gnews.io

**Pricing:**
| Plan | Cost | Daily Requests | Articles/Request | Delay |
|------|------|----------------|------------------|-------|
| Free | €0 | 100 | 10 | 12 hours |
| Essential | €49.99/mo | 1,000 | 25 | Real-time |
| Business | €99.99/mo | 5,000 | 50 | Real-time |
| Enterprise | €249.99/mo | 25,000 | 100 | Real-time |

**Pros:**
- Mirrors Google News rankings
- 80,000+ sources, 41 languages
- Historical data back to 2020
- Full content available (paid)

**Cons:**
- 12-hour delay on free tier
- Free cannot be used commercially
- No source filtering yet

**API Example:**
```bash
curl "https://gnews.io/api/v4/search?q=San+Francisco&lang=en&max=10&apikey=YOUR_KEY"
```

---

### 📰 Mediastack
**Website:** https://mediastack.com

**Pricing:**
| Plan | Cost | Monthly Requests | Features |
|------|------|------------------|----------|
| Free | $0 | 100 | Delayed news, no HTTPS |
| Standard | $24.99/mo | 10,000 | Real-time, historical |
| Professional | $99.99/mo | 50,000 | All features |
| Business | $249.99/mo | 250,000 | All features |

**Pros:**
- 7,500+ sources, 50+ countries
- Historical data access (paid)
- Country/language filtering

**Cons:**
- Only 100 requests/MONTH on free tier (worst free tier)
- 30-minute delay on free tier
- No HTTPS on free tier

**API Example:**
```bash
curl "http://api.mediastack.com/v1/news?access_key=YOUR_KEY&keywords=san+francisco&countries=us"
```

---

### 📰 CurrentsAPI
**Website:** https://currentsapi.services

**Pricing:**
| Plan | Cost | Monthly Requests | History |
|------|------|------------------|---------|
| Developer | $0 | 600 | 3 months |
| Professional | $150/mo | 300,000 | 1 year |
| Enterprise | $300/mo | 600,000 | 1 year |

**Pros:**
- Claims to be "500x cheaper than competitors"
- 2000 requests per dollar
- 70+ countries, 18+ languages
- Real-time for all tiers

**Cons:**
- Only 600 requests/month free (limited)
- Huge jump to paid tier ($150)
- Only 3 months history on free

**API Example:**
```bash
curl -H "Authorization: YOUR_KEY" "https://api.currentsapi.services/v1/search?keywords=san+francisco"
```

---

### 📰 World News API
**Website:** https://worldnewsapi.com

**Pricing:**
- Free: Limited points/day, 1 month history
- Paid: Various tiers, history back to 2022
- Point-based system (varies by endpoint)

**Pros:**
- Front pages of 6,000 newspapers
- 99.9% uptime guarantee

**Cons:**
- Complex point-based pricing
- Requires backlink on free tier

---

### 📰 NewsAPI.org (Current)
**Website:** https://newsapi.org

**Pricing:**
| Plan | Requests |
|------|----------|
| Developer | 100/day |
| Paid | Monthly subscriptions |

**Limitations:**
- Free tier is development only (no production use)
- No full article content
- Must scrape URLs yourself

---

### 📰 Bing News Search API
**Status:** ⚠️ Appears deprecated/migrated

The standalone Bing News Search API has been migrated into Azure Cognitive Services / "Grounding with Bing." Pricing is now integrated with Azure's consumption model.

Not recommended as a primary source due to complexity of Azure setup.

---

## 2. SF-Specific Local Sources

### 📍 SF Standard RSS ⭐ PERFECT
**Feed URL:** `https://sfstandard.com/feed/`

**Status:** ✅ Working perfectly

**Data Quality:**
- Full articles with pubDate
- Categories/tags included
- Author bylines
- Updated every ~10 minutes (TTL: 10)

**Sample Fields:**
```xml
<item>
  <title>SF hosts a March for Billionaires</title>
  <link>https://sfstandard.com/2026/02/07/march-for-billionaires/</link>
  <pubDate>Sun, 08 Feb 2026 03:07:43 GMT</pubDate>
  <description>A small protest backing the ultra-rich...</description>
  <category>News</category>
  <category>Business</category>
  <dc:creator>Ezra Wallach</dc:creator>
</item>
```

**Integration:** Simple RSS parsing with feedparser or similar

---

### 📍 Mission Local RSS ⭐ PERFECT
**Feed URL:** `https://missionlocal.org/feed/`

**Status:** ✅ Working perfectly

**Data Quality:**
- Hyperlocal Mission District focus
- Full pubDate timestamps
- Categories and comment counts
- Post IDs for tracking

**Coverage:** Education, housing, local politics, community events

---

### 📍 SF Chronicle
**Status:** ⚠️ RSS page returns 410 (Gone)

The SF Chronicle has removed their public RSS feeds. Options:
1. **Paywall bypass:** Not recommended
2. **Web scraping:** Technically possible but ToS issues
3. **Alternative:** SF Standard covers similar stories

---

### 📍 KQED
**Website:** https://kqed.org

**Status:** RSS feeds exist but require discovery

**Known Podcasts with Feeds:**
- "The Bay" (Bay Area news podcast)

**Approach:** Check their help center for current RSS URLs

---

## 3. Community/Social APIs

### 💬 Reddit JSON API ⭐ HIGHLY RECOMMENDED
**Documentation:** https://www.reddit.com/dev/api

**Endpoints for SF:**
```
https://www.reddit.com/r/sanfrancisco.json
https://www.reddit.com/r/bayarea.json
https://www.reddit.com/r/sfbayhousing.json
```

**Pricing:** Free with OAuth registration

**Rate Limits:**
- 60 requests/minute (authenticated)
- User-Agent required

**Data Quality:**
- Real-time community discussions
- Voting scores indicate importance
- Comments for sentiment analysis
- Perfect for "what SF is talking about"

**API Example:**
```bash
curl -H "User-Agent: SF-Narrative/1.0" "https://www.reddit.com/r/sanfrancisco/hot.json?limit=25"
```

**Response includes:**
- Title, selftext, score, upvote_ratio
- Created timestamp (Unix)
- Comment count
- Post flair/categories

---

### 💬 Hacker News API ⭐ PERFECT FOR TECH
**Documentation:** https://github.com/HackerNews/API

**Pricing:** 🎉 **Completely free, no rate limits!**

**Base URL:** `https://hacker-news.firebaseio.com/v0/`

**Endpoints:**
```
/topstories.json     # Top 500 story IDs
/newstories.json     # Newest 500
/beststories.json    # Best stories
/askstories.json     # Ask HN
/showstories.json    # Show HN
/jobstories.json     # Job postings (SF tech jobs!)
/item/{id}.json      # Individual item
```

**Data Quality:**
- Real-time via Firebase
- Full story metadata
- Comments with threading
- Author, score, timestamp

**SF Relevance:**
- Heavy SF/Bay Area tech presence
- Job postings often SF-based
- Tech industry news first appears here

**API Example:**
```bash
# Get top stories
curl "https://hacker-news.firebaseio.com/v0/topstories.json"

# Get story details
curl "https://hacker-news.firebaseio.com/v0/item/8863.json?print=pretty"
```

---

### 💬 X/Twitter API
**Documentation:** https://docs.x.com

**Pricing:** Pay-per-usage (no subscriptions)
- Credits purchased through Developer Console
- Costs vary by endpoint

**Pros:**
- Real-time local accounts
- Breaking news often appears first
- Geo-filtering possible

**Cons:**
- Pay-per-usage adds up quickly
- API access increasingly restricted
- Complex authentication

**SF Accounts to Monitor:**
- @sflostandfound
- @sfexaminer
- @sfchronicle
- @SFist
- @maborowitz

**Recommendation:** Unless budget allows, skip Twitter in favor of Reddit/HN

---

## 4. Alternative Approaches

### 📡 RSS Feed Aggregation
**Best approach for SF-Narrative**

**Working Feeds:**
```
SF Standard:    https://sfstandard.com/feed/
Mission Local:  https://missionlocal.org/feed/
KQED:          (discover via help center)
Hoodline:      https://hoodline.com/feed.rss
SFist:         https://sfist.com/feed/
```

**Tools:**
- Python: `feedparser`
- Node: `rss-parser`

**Advantages:**
- Completely free
- No rate limits
- Real pubDates
- Full descriptions

---

### 🔧 Web Scraping
**For sources without APIs**

**Legal Sources (public data):**
- SF Gov press releases
- SFPD crime reports (open data)
- Planning dept notices

**Tools:**
- Python: BeautifulSoup, Scrapy
- Playwright for JS-rendered sites

**SF Open Data:**
- https://datasf.org/opendata/
- Crime incidents, 311 calls, permits

---

### 🔔 Google Alerts (Webhook Alternative)
**Note:** Google Alerts doesn't have a direct API/webhook

**Workaround Options:**
1. Email-to-webhook services (Zapier, Make)
2. RSS feed from Google Alerts
3. IFTTT integration

**Setup:**
1. Create Google Alert for "San Francisco"
2. Set delivery to RSS feed
3. Parse RSS programmatically

---

## 5. Implementation Recommendations

### Phase 1: Free Tier Stack
```python
sources = {
    'local_rss': [
        'https://sfstandard.com/feed/',
        'https://missionlocal.org/feed/',
    ],
    'community': [
        'https://www.reddit.com/r/sanfrancisco.json',
        'https://www.reddit.com/r/bayarea.json',
    ],
    'tech': [
        'https://hacker-news.firebaseio.com/v0/topstories.json',
    ],
    'general_news': {
        'api': 'thenewsapi',  # 100 req/day
        'fallback': 'gnews',  # 100 req/day
    }
}
```

### Phase 2: Paid Upgrade Path
If usage grows beyond free tiers:
1. **CurrentsAPI** - $150/mo for 300k requests
2. **TheNewsAPI Standard** - $49/mo for 10k/day
3. **GNews Essential** - €49.99/mo for real-time

### Fetch Priority
```
1. SF Standard RSS     (every 10 min, local breaking)
2. Mission Local RSS   (every 15 min, hyperlocal)
3. Reddit r/sf         (every 30 min, community pulse)
4. Hacker News         (every 30 min, tech news)
5. TheNewsAPI          (every 2 hours, save quota)
```

---

## 6. Quick Reference: API Keys Needed

| Service | Auth Type | Free? | Link |
|---------|-----------|-------|------|
| TheNewsAPI | API token | ✅ | https://thenewsapi.com/register |
| GNews | API key | ✅ | https://gnews.io/register |
| Reddit | OAuth | ✅ | https://www.reddit.com/prefs/apps |
| Hacker News | None | ✅ | Just use it! |
| CurrentsAPI | API key | ✅ | https://currentsapi.services/en/register |
| X/Twitter | OAuth + Credits | 💰 | https://developer.x.com |

---

## 7. Code Snippets

### RSS Parsing (Python)
```python
import feedparser

def fetch_sf_standard():
    feed = feedparser.parse('https://sfstandard.com/feed/')
    articles = []
    for entry in feed.entries:
        articles.append({
            'title': entry.title,
            'link': entry.link,
            'published': entry.published,
            'summary': entry.description,
            'author': entry.get('dc_creator', 'Unknown'),
            'categories': [tag.term for tag in entry.get('tags', [])]
        })
    return articles
```

### Reddit (Python)
```python
import requests

def fetch_sf_reddit(limit=25):
    headers = {'User-Agent': 'SF-Narrative/1.0'}
    url = f'https://www.reddit.com/r/sanfrancisco/hot.json?limit={limit}'
    resp = requests.get(url, headers=headers)
    data = resp.json()
    
    posts = []
    for child in data['data']['children']:
        post = child['data']
        posts.append({
            'title': post['title'],
            'score': post['score'],
            'url': post['url'],
            'created': post['created_utc'],
            'comments': post['num_comments'],
            'selftext': post.get('selftext', '')
        })
    return posts
```

### Hacker News (Python)
```python
import requests

def fetch_hn_top(limit=30):
    base = 'https://hacker-news.firebaseio.com/v0'
    story_ids = requests.get(f'{base}/topstories.json').json()[:limit]
    
    stories = []
    for sid in story_ids:
        story = requests.get(f'{base}/item/{sid}.json').json()
        stories.append({
            'title': story.get('title'),
            'url': story.get('url'),
            'score': story.get('score'),
            'time': story.get('time'),
            'by': story.get('by'),
            'descendants': story.get('descendants', 0)
        })
    return stories
```

---

## Conclusion

**Don't pay for news APIs yet.** The free stack of:
- SF Standard + Mission Local RSS
- Reddit JSON
- Hacker News API
- TheNewsAPI (100/day backup)

...provides comprehensive SF coverage at $0/month.

Only upgrade to paid tiers if you need:
- Higher volume (>500 requests/day)
- Full article content
- Historical archives
- Broader national/world coverage
