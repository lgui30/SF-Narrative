/**
 * Test script for multi-source news aggregation
 * Run: npx tsx scripts/test-sources.ts
 */

import { 
  fetchRSSArticles,
  fetchRedditArticles,
  fetchHackerNewsArticles,
  fetchAllCategories,
} from '../lib/sources';

async function main() {
  console.log('🧪 Testing multi-source news aggregation...\n');

  // Test RSS
  console.log('=== Testing RSS Feeds ===');
  try {
    const rss = await fetchRSSArticles();
    console.log('RSS Results:', {
      tech: rss.tech.length,
      politics: rss.politics.length,
      economy: rss.economy.length,
      'sf-local': rss['sf-local'].length,
    });
    if (rss['sf-local'].length > 0) {
      console.log('Sample RSS article:', rss['sf-local'][0].title);
    }
  } catch (e) {
    console.error('RSS Error:', e);
  }

  console.log('\n=== Testing Reddit ===');
  try {
    const reddit = await fetchRedditArticles();
    console.log('Reddit Results:', {
      tech: reddit.tech.length,
      politics: reddit.politics.length,
      economy: reddit.economy.length,
      'sf-local': reddit['sf-local'].length,
    });
    if (reddit['sf-local'].length > 0) {
      console.log('Sample Reddit post:', reddit['sf-local'][0].title);
    }
  } catch (e) {
    console.error('Reddit Error:', e);
  }

  console.log('\n=== Testing Hacker News ===');
  try {
    const hn = await fetchHackerNewsArticles();
    console.log('HN Results:', hn.length, 'SF-relevant articles');
    if (hn.length > 0) {
      console.log('Sample HN story:', hn[0].title);
    }
  } catch (e) {
    console.error('HN Error:', e);
  }

  console.log('\n=== Testing Full Aggregation ===');
  try {
    const all = await fetchAllCategories({
      limit: 10,
      fromDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      skipBackup: true, // Skip backup API for test
    });
    console.log('Full Aggregation Results:', {
      tech: all.tech.length,
      politics: all.politics.length,
      economy: all.economy.length,
      'sf-local': all['sf-local'].length,
    });
    
    console.log('\n📰 Top articles by category:');
    for (const [cat, articles] of Object.entries(all)) {
      if (articles.length > 0) {
        console.log(`\n${cat.toUpperCase()}:`);
        articles.slice(0, 3).forEach((a, i) => {
          console.log(`  ${i + 1}. [${a.source}] ${a.title.substring(0, 60)}...`);
        });
      }
    }
  } catch (e) {
    console.error('Aggregation Error:', e);
  }

  console.log('\n✅ Test complete!');
}

main().catch(console.error);
