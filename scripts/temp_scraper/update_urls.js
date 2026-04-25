const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const dataJsPath = '../../data.js';

async function getUrl(name) {
  try {
    const res = await axios.get("https://html.duckduckgo.com/html/?q=" + encodeURIComponent(name + ' 공식 홈페이지'), {
      headers: {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    });
    const $ = cheerio.load(res.data);
    
    // find the first result
    const link = $("a.result__url").first().attr("href");
    if (!link) return '';
    const match = link.match(/uddg=([^&]+)/);
    if (match) {
      const decoded = decodeURIComponent(match[1]);
      return decoded;
    }
    return '';
  } catch (e) {
    return '';
  }
}

async function run() {
  const content = fs.readFileSync(dataJsPath, 'utf8');
  const match = content.match(/const companyData = (\[[\s\S]*?\]);/);
  if (!match) return;
  
  let data;
  eval(`data = ${match[1]}`);
  
  console.log(`Processing remaining missing URLs...`);
  
  for (let i = 0; i < data.length; i++) {
    if (!data[i].url) {
      const url = await getUrl(data[i].name);
      if (url) {
        data[i].url = url;
        console.log(`[${i+1}/${data.length}] ${data[i].name} -> ${url}`);
      } else {
        console.log(`[${i+1}/${data.length}] ${data[i].name} -> Not Found`);
      }
      // wait 500ms to avoid rate limiting
      await new Promise(r => setTimeout(r, 500));
    }
  }
  
  const newDataString = JSON.stringify(data, null, 2);
  const newContent = content.replace(/const companyData = \[[\s\S]*?\];/, `const companyData = ${newDataString};`);
  fs.writeFileSync(dataJsPath, newContent, 'utf8');
  console.log('Saved to data.js');
}

run();
