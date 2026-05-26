import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';

const CONFIG_PATH = path.resolve('scripts/newsletters_config.json');
const DATABASE_PATH = path.resolve('public/articles.json');

// Average reading speed (words per minute)
const WPM = 225;

// Helper to sanitize HTML content
function sanitizeHtml(html) {
  if (!html) return '';
  return html
    // Remove script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove iframe tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    // Remove tracker pixels
    .replace(/<img\s+[^>]*\bwidth=["']?1["']?\s+[^>]*\bheight=["']?1["']?[^>]*>/gi, '')
    .replace(/<img\s+[^>]*\bsrc=["']?https:\/\/api\.substack\.com\/feed\/pixel[^>]*>/gi, '')
    // Remove Substack specific share wrappers/buttons
    .replace(/<div\s+class=["']?button-wrapper[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<a\s+class=["']?button[^>]*>[\s\S]*?<\/a>/gi, '')
    // Strip trailing tracking query parameters from links
    .replace(/\?utm_[a-z0-9_=&]+/gi, '');
}

// Helper to calculate reading time
function calculateReadingTime(text) {
  const cleanText = text.replace(/<[^>]*>/g, ''); // strip HTML tags
  const wordCount = cleanText.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(wordCount / WPM));
  return { wordCount, minutes };
}

// Parse date into standard YYYY-MM-DD
function parseCleanDate(dateStr) {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      return new Date().toISOString().split('T')[0];
    }
    return d.toISOString().split('T')[0];
  } catch (e) {
    return new Date().toISOString().split('T')[0];
  }
}

async function scrapeFeeds() {
  console.log('🏁 Starting China-Reader Scraper Pipeline...');

  // 1. Load Newsletter config
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error(`❌ Config file not found at: ${CONFIG_PATH}`);
    process.exit(1);
  }
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

  // 2. Load legacy database to incrementally merge and keep history
  let database = {};
  if (fs.existsSync(DATABASE_PATH)) {
    try {
      database = JSON.parse(fs.readFileSync(DATABASE_PATH, 'utf8'));
      console.log(`📂 Loaded existing cache containing ${Object.keys(database).length} publications.`);
    } catch (e) {
      console.warn('⚠️ Legacy database was corrupted or empty. Starting fresh database.');
    }
  }

  // Ensure public folder exists
  const publicDir = path.dirname(DATABASE_PATH);
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const finalDatabase = {};

  // 3. Loop through newsletter feeds
  for (const pub of config) {
    console.log(`\n📚 Scrape Target: ${pub.title} (${pub.rssUrl})...`);

    // Fetch existing articles from cache for this publication
    const existingPubData = database[pub.id] || { ...pub, articles: [] };
    const articleCache = new Map(existingPubData.articles.map(a => [a.id, a]));

    try {
      const response = await axios.get(pub.rssUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/xml, text/xml, */*'
        },
        timeout: 15000
      });

      const parsed = await parseStringPromise(response.data);
      let items = [];

      // Handle RSS vs Atom XML structures
      if (parsed.rss && parsed.rss.channel && parsed.rss.channel[0].item) {
        // Standard RSS
        items = parsed.rss.channel[0].item;
      } else if (parsed.feed && parsed.feed.entry) {
        // Atom Feed (like Substack or Carnegie)
        items = parsed.feed.entry;
      } else if (parsed.channel && parsed.channel[0] && parsed.channel[0].item) {
        // Alternative RSS
        items = parsed.channel[0].item;
      }

      console.log(`  Found ${items.length} items in feed.`);

      let parsedCount = 0;
      for (const item of items) {
        try {
          // Extract ID/GUID
          let rawId = '';
          if (item.guid && item.guid[0]) {
            rawId = typeof item.guid[0] === 'object' ? item.guid[0]._ || item.guid[0].id : item.guid[0];
          } else if (item.id && item.id[0]) {
            rawId = item.id[0];
          } else if (item.link && item.link[0]) {
            rawId = typeof item.link[0] === 'object' ? item.link[0].$.href : item.link[0];
          }
          
          if (!rawId) continue;
          
          // Form a clean alphanumeric ID
          const cleanId = `${pub.id}-${rawId.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`.replace(/-+/g, '-').slice(0, 100);

          // Extract link
          let link = '';
          if (item.link && item.link[0]) {
            link = typeof item.link[0] === 'object' ? item.link[0].$.href : item.link[0];
          } else if (item.guid && item.guid[0] && typeof item.guid[0] === 'string' && item.guid[0].startsWith('http')) {
            link = item.guid[0];
          }

          // Extract title
          const title = item.title && item.title[0] ? (typeof item.title[0] === 'object' ? item.title[0]._ : item.title[0]).trim() : 'Untitled Article';

          // Extract Date
          const rawDate = (item.pubDate && item.pubDate[0]) || (item.published && item.published[0]) || (item.updated && item.updated[0]) || '';
          const publishDate = parseCleanDate(rawDate);

          // Extract Content / Summary
          let rawContent = '';
          if (item['content:encoded'] && item['content:encoded'][0]) {
            rawContent = item['content:encoded'][0];
          } else if (item.description && item.description[0]) {
            rawContent = item.description[0];
          } else if (item.content && item.content[0]) {
            rawContent = typeof item.content[0] === 'object' ? item.content[0]._ : item.content[0];
          } else if (item.summary && item.summary[0]) {
            rawContent = typeof item.summary[0] === 'object' ? item.summary[0]._ : item.summary[0];
          }

          const cleanContent = sanitizeHtml(rawContent);
          const { wordCount, minutes } = calculateReadingTime(cleanContent);

          const article = {
            id: cleanId,
            title,
            link,
            publishDate,
            content: cleanContent,
            wordCount,
            readingTime: minutes,
            newsletterId: pub.id,
            newsletterTitle: pub.title
          };

          // Cache or update article
          articleCache.set(cleanId, article);
          parsedCount++;
        } catch (itemErr) {
          console.warn(`  ⚠️ Failed to parse article: ${itemErr.message}`);
        }
      }

      console.log(`  Processed ${parsedCount} items successfully.`);

    } catch (netErr) {
      console.error(`  ❌ Failed to fetch feed for ${pub.title}: ${netErr.message}`);
      console.log('  ⚠️ Using cached articles for this publication.');
    }

    // Convert map back to sorted array (newest first)
    const sortedArticles = Array.from(articleCache.values())
      .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
      // Limit to max 100 articles per publication to save space
      .slice(0, 100);

    finalDatabase[pub.id] = {
      ...pub,
      articles: sortedArticles
    };

    console.log(`  Consolidated total articles in database: ${sortedArticles.length}`);
  }

  // 4. Save consolidated database
  fs.writeFileSync(DATABASE_PATH, JSON.stringify(finalDatabase, null, 2), 'utf8');
  console.log(`\n🎉 Success! Consolidated reader database written to: ${DATABASE_PATH}`);
}

scrapeFeeds();
