const axios = require('axios');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/news.json');
const MAX_AGE_DAYS = 90;

function extractImage(item) {
  // Check for enclosure or media:content
  if (item.enclosure && item.enclosure[0] && item.enclosure[0].$) {
    return item.enclosure[0].$.url;
  }
  if (item['media:content'] && item['media:content'][0] && item['media:content'][0].$) {
    return item['media:content'][0].$.url;
  }
  
  // Parse from description or content:encoded
  const htmlContent = (item['content:encoded'] ? item['content:encoded'][0] : '') || 
                      (item.description ? item.description[0] : '');
                      
  const imgMatch = htmlContent.match(/<img[^>]+src="([^">]+)"/);
  if (imgMatch && imgMatch[1]) {
    return imgMatch[1];
  }
  
  return null; // Fallback image will be handled by frontend
}

async function fetchRSS(url, sourceName) {
  try {
    const res = await axios.get(url, { timeout: 10000 });
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(res.data);
    
    let items = [];
    if (result.rss && result.rss.channel && result.rss.channel[0].item) {
      items = result.rss.channel[0].item;
    } else if (result.feed && result.feed.entry) {
      items = result.feed.entry;
    }
    
    return items.map(item => {
      let pubDate = item.pubDate ? new Date(item.pubDate[0]) : new Date();
      if(isNaN(pubDate)) pubDate = new Date();
      
      return {
        title: item.title[0],
        link: item.link[0],
        date: pubDate.toISOString(),
        source: sourceName,
        thumbnail: extractImage(item)
      };
    });
  } catch (err) {
    console.error(`Error fetching ${sourceName}:`, err.message);
    return [];
  }
}

async function main() {
  console.log('Starting news scrape...');
  
  const sources = [
    { url: 'https://www.mobiinside.co.kr/feed/', name: 'MobiInside' },
    { url: 'https://www.madtimes.org/rss/allArticle.xml', name: 'MadTimes' }
  ];
  
  let newArticles = [];
  for (const src of sources) {
    const articles = await fetchRSS(src.url, src.name);
    console.log(`Fetched ${articles.length} articles from ${src.name}`);
    newArticles = newArticles.concat(articles);
  }
  
  // Load existing
  let existingArticles = [];
  if (fs.existsSync(DATA_FILE)) {
    try {
      existingArticles = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      console.log(`Loaded ${existingArticles.length} existing articles.`);
    } catch(e) {
      console.error('Failed to parse existing news.json. Starting fresh.');
    }
  } else {
    // Create data dir if not exists
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }
  
  // Merge and deduplicate by link
  const allArticles = [...existingArticles, ...newArticles];
  const uniqueArticles = [];
  const links = new Set();
  
  for (const article of allArticles) {
    if (!links.has(article.link)) {
      links.add(article.link);
      uniqueArticles.push(article);
    }
  }
  
  // Filter by date (last 90 days)
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - MAX_AGE_DAYS);
  
  const filteredArticles = uniqueArticles.filter(a => new Date(a.date) >= cutoffDate);
  
  // Sort by date desc (newest first)
  filteredArticles.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  fs.writeFileSync(DATA_FILE, JSON.stringify(filteredArticles, null, 2));
  console.log(`Successfully saved ${filteredArticles.length} articles to data/news.json.`);
}

main();
