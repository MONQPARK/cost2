const axios = require('axios');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/news.json');
const MAX_AGE_DAYS = 90;

function extractImage(item) {
  if (item.enclosure && item.enclosure[0] && item.enclosure[0].$) {
    return item.enclosure[0].$.url;
  }
  if (item['media:content'] && item['media:content'][0] && item['media:content'][0].$) {
    return item['media:content'][0].$.url;
  }
  const htmlContent = (item['content:encoded'] ? item['content:encoded'][0] : '') ||
                      (item.description ? item.description[0] : '');
  const imgMatch = htmlContent.match(/<img[^>]+src="([^">]+)"/);
  if (imgMatch && imgMatch[1]) return imgMatch[1];
  return null;
}

function categorizeArticle(title) {
  const t = (title || '').toLowerCase();

  if (/ai|인공지능|챗gpt|gpt|머신러닝|딥러닝|자동화|빅데이터|알고리즘|llm|생성형|에이전트/.test(t))
    return 'ai';
  if (/sns|소셜|유튜브|인스타|틱톡|메타|페이스북|릴스|숏폼|크리에이터|콘텐츠 마케팅|인플루언서/.test(t))
    return 'digital';
  if (/광고제|어워즈|캠페인|크리에이티브|cf |광고 영상|광고 캠페인|필름|광고대행|이노션|제일기획|대홍기획/.test(t))
    return 'ad';
  if (/브랜드|리브랜딩|런칭|pr |홍보|스폰서|파트너십|앰배서더|모델|협찬/.test(t))
    return 'brand';
  if (/미디어|방송|플랫폼|ott|넷플릭스|네이버|카카오|구글|유튜브 광고|매체|신문|잡지/.test(t))
    return 'media';
  return 'trend';
}

async function fetchRSS(url, sourceName) {
  try {
    const res = await axios.get(url, {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)' }
    });
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
      if (isNaN(pubDate)) pubDate = new Date();

      const title = Array.isArray(item.title) ? item.title[0] : (item.title || '');
      const link = Array.isArray(item.link) ? item.link[0] : (item.link || '');

      return {
        title: typeof title === 'object' ? title._ || '' : title,
        link: typeof link === 'object' ? link._ || link.$.href || '' : link,
        date: pubDate.toISOString(),
        source: sourceName,
        category: categorizeArticle(typeof title === 'object' ? title._ || '' : title),
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
    { url: 'https://www.mobiinside.co.kr/feed/',            name: 'MobiInside' },
    { url: 'https://www.madtimes.org/rss/allArticle.xml',   name: 'MadTimes' },
    { url: 'https://www.brandbrief.co.kr/rss/allArticle.xml', name: 'BrandBrief' },
    { url: 'https://www.mediatoday.co.kr/rss/allArticle.xml', name: '미디어오늘' },
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
      // 기존 기사에 category 없으면 추가
      existingArticles = existingArticles.map(a => ({
        ...a,
        category: a.category || categorizeArticle(a.title)
      }));
      console.log(`Loaded ${existingArticles.length} existing articles.`);
    } catch (e) {
      console.error('Failed to parse existing news.json. Starting fresh.');
    }
  } else {
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
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

  // Sort by date desc
  filteredArticles.sort((a, b) => new Date(b.date) - new Date(a.date));

  fs.writeFileSync(DATA_FILE, JSON.stringify(filteredArticles, null, 2));
  console.log(`Successfully saved ${filteredArticles.length} articles to data/news.json.`);
}

main();
