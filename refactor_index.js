const fs = require('fs');

let content = fs.readFileSync('index.html', 'utf8');

// 1. Remove QUOTE_DATA and SALARY_DATA
content = content.replace(/const QUOTE_DATA = \{[\s\S]*?\n\};/, 'let QUOTE_DATA;');
content = content.replace(/const SALARY_DATA = \{[\s\S]*?\n\};/, 'let SALARY_DATA;');

// 2. Make init() async and fetch data
content = content.replace(/function init\(\) \{/, `async function init() {
  try {
    const qRes = await fetch('./data/quotes.json');
    QUOTE_DATA = await qRes.json();
    const sRes = await fetch('./data/salaries.json');
    SALARY_DATA = await sRes.json();
  } catch (e) {
    console.error('Failed to load data:', e);
    alert('데이터를 불러오는데 실패했습니다.');
  }`);

// 3. Update switchTab signature and body
content = content.replace(/function switchTab\(tabId, mode\) \{/g, 'function switchTab(tabId, mode, btnEl) {');
content = content.replace(/if \(event\) event\.target\.classList\.add\('active'\);/g, `if (btnEl) {
    btnEl.classList.add('active');
  } else {
    // fallback if called programmatically
    const btns = document.querySelectorAll('.tabs button');
    btns.forEach(b => {
      const onclickAttr = b.getAttribute('onclick');
      if (onclickAttr && onclickAttr.includes("'" + tabId + "'")) {
        b.classList.add('active');
      }
    });
  }`);

// 4. Update all onclick calls to switchTab to pass `this`
content = content.replace(/onclick="switchTab\('([^']+)',\s*'([^']+)'\)"/g, `onclick="switchTab('$1', '$2', this)"`);

// 5. Update splash-card markup
content = content.replace(/<div class="splash-card" onclick="enterMode\('quote'\)">/g, '<button class="splash-card" type="button" onclick="enterMode(\'quote\')">');
content = content.replace(/<div class="splash-card" onclick="enterMode\('info'\)">/g, '<button class="splash-card" type="button" onclick="enterMode(\'info\')">');

content = content.replace(/(<button class="splash-card" type="button" onclick="enterMode\('quote'\)">\s*<div class="splash-card-icon">📝<\/div>\s*<h3>견적서 작성<\/h3>\s*<p>[^<]*<br>[^<]*<\/p>\s*)<\/div>/g, '$1</button>');
content = content.replace(/(<button class="splash-card" type="button" onclick="enterMode\('info'\)">\s*<div class="splash-card-icon">📊<\/div>\s*<h3>정보 &amp; 트렌드<\/h3>\s*<p>[^<]*<br>[^<]*<\/p>\s*)<\/div>/g, '$1</button>');

// 6. Fix minibar widths (width:100% -> width:52.8%, width:38.6% -> width:20.4%, etc.)
content = content.replace(/style="width:100%;background:var\(--primary\)"(.*?)<span class="mini-bar-val">52\.8%<\/span>/g, 'style="width:52.8%;background:var(--primary)"$1<span class="mini-bar-val">52.8%</span>');
content = content.replace(/style="width:38\.6%;background:#94a3b8"(.*?)<span class="mini-bar-val">20\.4%<\/span>/g, 'style="width:20.4%;background:#94a3b8"$1<span class="mini-bar-val">20.4%</span>');
content = content.replace(/style="width:14\.6%;background:#cbd5e1"(.*?)<span class="mini-bar-val">7\.7%<\/span>/g, 'style="width:7.7%;background:#cbd5e1"$1<span class="mini-bar-val">7.7%</span>');
content = content.replace(/style="width:9\.7%;background:#e2e8f0"(.*?)<span class="mini-bar-val">5\.1%<\/span>/g, 'style="width:5.1%;background:#e2e8f0"$1<span class="mini-bar-val">5.1%</span>');
content = content.replace(/style="width:26\.5%;background:#f1f5f9"(.*?)<span class="mini-bar-val">14\.0%<\/span>/g, 'style="width:14.0%;background:#f1f5f9"$1<span class="mini-bar-val">14.0%</span>');

fs.writeFileSync('index.html', content);
console.log('Refactored index.html successfully!');
