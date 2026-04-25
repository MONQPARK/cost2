const axios = require('axios');
const cheerio = require('cheerio');

async function getUrl(name) {
  try {
    const res = await axios.get(`https://search.naver.com/search.naver?query=${encodeURIComponent(name + ' 홈페이지')}`);
    const $ = cheerio.load(res.data);
    let link = '';
    // Look for website links in Naver search results
    const siteLinks = [];
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (href && href.startsWith('http') && 
          !href.includes('naver.com') && 
          !href.includes('naver.net') && 
          !href.includes('namu.wiki') && 
          !href.includes('wikipedia') &&
          !href.includes('nheos.com')) {
        siteLinks.push(href);
      }
    });
    return siteLinks.length > 0 ? siteLinks[0] : '';
  } catch (e) {
    return '';
  }
}

async function test() {
  const t1 = await getUrl('이노션');
  console.log('이노션:', t1);
  const t2 = await getUrl('스타디엠코퍼레이션');
  console.log('스타디엠코퍼레이션:', t2);
}

test();
