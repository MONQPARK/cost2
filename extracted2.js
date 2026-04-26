
// --- 1. 데이터 ---
let QUOTE_DATA;

let currentCat = 'video';
let itemsState = {}; 

// --- 2. 초기화 및 유틸 ---
function gv(id) { return document.getElementById(id).value || ''; }
function sv(id, val) { document.getElementById(id).value = val; }
function fmt(n) { return '₩' + n.toLocaleString(); }
function fmtNum(n) { return n.toLocaleString(); }

async function init() {
  try {
    const qRes = await fetch('./data/quotes.json');
    QUOTE_DATA = await qRes.json();
    const sRes = await fetch('./data/salaries.json');
    SALARY_DATA = await sRes.json();
  } catch (e) {
    console.error('Failed to load data:', e);
    alert('데이터를 불러오는데 실패했습니다.');
  }
  const catDiv = document.getElementById('cat-selector');
  for(let key in QUOTE_DATA) {
    let btn = document.createElement('button');
    btn.className = 'cat-btn' + (key === currentCat ? ' active' : '');
    btn.innerText = QUOTE_DATA[key].label;
    btn.onclick = () => selectCat(key);
    catDiv.appendChild(btn);
  }
  
  loadInfo();
  selectCat(currentCat);
  
  if(!gv('p_date')) {
    document.getElementById('p_date').valueAsDate = new Date();
  }
}

function loadInfo() {
  const infoStr = localStorage.getItem('quote_info');
  if(infoStr) {
    const info = JSON.parse(infoStr);
    for(let k in info) { if(document.getElementById(k)) sv(k, info[k]); }
  }
}

function saveInfo() {
  const ids = ['s_company','s_ceo','s_biz_no','s_address','s_manager','s_tel','s_email',
               'c_company','c_manager','c_tel','p_title','p_no','p_date','p_valid','p_note'];
  const info = {};
  ids.forEach(id => info[id] = gv(id));
  localStorage.setItem('quote_info', JSON.stringify(info));
  alert('입력하신 정보가 이 PC의 브라우저에 저장되었습니다.\n공용 PC인 경우 사용 후 꼭 [정보 지우기]를 눌러주세요.');
}

function clearInfo() {
  localStorage.removeItem('quote_info');
  const ids = ['s_company','s_ceo','s_biz_no','s_address','s_manager','s_tel','s_email',
               'c_company','c_manager','c_tel','p_title','p_no','p_date','p_valid','p_note'];
  ids.forEach(id => sv(id, ''));
  alert('저장된 정보가 안전하게 삭제되었습니다.');
}

function checkInApp() {
  const ua = navigator.userAgent.toLowerCase();
  if(/kakaotalk|instagram|facebook|inapp|line/.test(ua)) {
    alert("⚠️ 앱 내 브라우저(카카오톡 등)에서는 파일 다운로드 및 인쇄가 차단될 수 있습니다. 정상적인 작동을 위해 우측 하단/상단 메뉴에서 [다른 브라우저로 열기(Safari, Chrome)]를 선택해주세요.");
  }
}

// --- 3. 항목 로직 ---
let activeQuote = []; // currently active template's sections and items

function selectCat(cat) {
  document.querySelectorAll('.cat-btn').forEach(b => {
    b.classList.remove('active');
    if(b.innerText === QUOTE_DATA[cat].label) b.classList.add('active');
  });
  currentCat = cat;
  
  if(!window.quoteStates) window.quoteStates = {};
  if(!window.quoteStates[cat]) {
    window.quoteStates[cat] = JSON.parse(JSON.stringify(QUOTE_DATA[cat].sections));
    window.quoteStates[cat].forEach(sec => {
      sec.items.forEach(item => {
        item.checked = false; item.qty = 1; item.price = item.avg || 0; item.isCustom = false;
      });
    });
  }
  activeQuote = window.quoteStates[cat];
  renderItems();
}

function renderItems() {
  const tbody = document.getElementById('items-tbody');
  tbody.innerHTML = '';
  
  activeQuote.forEach((sec, sIdx) => {
    const secRow = document.createElement('tr');
    secRow.className = 'section-row';
    secRow.innerHTML = `<td colspan="8">
      <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
        <input type="text" class="text-input" value="${sec.name}" style="font-weight:800; font-size:16px; width:100%; max-width:400px; padding:4px; background:transparent; border:1px solid transparent;" onchange="updateSection(${sIdx}, this.value)" onfocus="this.style.border='1px solid #cbd5e1'" onblur="this.style.border='1px solid transparent'">
      </div>
    </td>`;
    tbody.appendChild(secRow);
    
    sec.items.forEach((item, iIdx) => {
      const row = document.createElement('tr');
      row.className = 'item-row' + (item.checked ? '' : ' inactive');
      
      let nameHtml = item.isCustom 
        ? `<input type="text" class="text-input" value="${item.name}" onchange="updateItem(${sIdx}, ${iIdx}, 'name', this.value)">`
        : `<input type="text" class="text-input" readonly value="${item.name}"><span class="desc-text">${item.desc||''}</span>`;
        
      let unitHtml = item.isCustom
        ? `<input type="text" class="text-input" value="${item.unit}" onchange="updateItem(${sIdx}, ${iIdx}, 'unit', this.value)" style="text-align:center;">`
        : item.unit;

      let refPriceHtml = '';
      if(!item.isCustom && item.avg) refPriceHtml = `<span style="font-size:12px; color:var(--text-light); letter-spacing:-0.5px;">평균 ${fmtNum(item.avg)}</span>`;
      
      row.innerHTML = `
        <td data-label="선택" class="align-center"><input type="checkbox" style="transform:scale(1.3)" ${item.checked?'checked':''} onchange="toggleCheck(${sIdx}, ${iIdx}, this.checked)"></td>
        <td data-label="항목">${nameHtml}</td>
        <td data-label="단위" class="align-center">${unitHtml}</td>
        <td data-label="수량"><input type="number" class="num-input" min="1" value="${item.qty}" onchange="updateItem(${sIdx}, ${iIdx}, 'qty', this.value)" ${!item.checked?'disabled':''}></td>
        <td data-label="참고단가" class="align-right">${refPriceHtml}</td>
        <td data-label="단가(원)"><input type="number" class="price-input" min="0" step="1000" value="${item.price}" onchange="updateItem(${sIdx}, ${iIdx}, 'price', this.value)" ${!item.checked?'disabled':''}></td>
        <td data-label="금액(원)" class="align-right font-weight-bold" style="color:var(--primary);">${fmtNum(item.qty * item.price)}</td>
        <td data-label="비고"><input type="text" class="text-input" value="${item.note||''}" placeholder="비고입력" onchange="updateItem(${sIdx}, ${iIdx}, 'note', this.value)" ${!item.checked?'disabled':''}></td>
      `;
      tbody.appendChild(row);
    });
    
    const addRow = document.createElement('tr');
    addRow.innerHTML = `<td colspan="8" style="text-align:center; padding:10px 0 24px 0; border-bottom:1px dashed #e2e8f0;">
      <button onclick="addCustomItem(${sIdx})" style="padding:8px 20px; font-size:13px; font-weight:600; border:1px dashed #94a3b8; border-radius:8px; background:#f8fafc; cursor:pointer; color:#475569; transition:all 0.2s;">+ [ ${sec.name.split(' ')[0]} ] 그룹에 세부 항목 추가</button>
    </td>`;
    tbody.appendChild(addRow);
  });
  
  const addGroupRow = document.createElement('tr');
  addGroupRow.innerHTML = `<td colspan="8" style="text-align:center; padding:30px 0; border:none;">
    <button onclick="addCustomSection()" style="padding:12px 30px; font-size:15px; font-weight:800; border:2px dashed #ef4444; border-radius:10px; background:#eff6ff; cursor:pointer; color:var(--primary); transition:all 0.2s;">+ 새로운 상위 그룹(주제) 추가</button>
  </td>`;
  tbody.appendChild(addGroupRow);

  calculateTotal();
}

function updateSection(sIdx, val) {
  activeQuote[sIdx].name = val;
  renderItems();
}

function updateItem(sIdx, iIdx, field, val) {
  if(field==='qty' || field==='price') val = Number(val) || 0;
  activeQuote[sIdx].items[iIdx][field] = val;
  if(field==='qty' || field==='price' || field==='name' || field==='unit') calculateTotal();
  if(field==='qty' || field==='price') renderItems(); 
}

function toggleCheck(sIdx, iIdx, isChecked) {
  activeQuote[sIdx].items[iIdx].checked = isChecked;
  renderItems();
}

function addCustomItem(sIdx) {
  activeQuote[sIdx].items.push({
    id: 'c_' + Date.now(), name: '직접 입력 항목', unit: '식', avg: 0, desc: '',
    checked: true, qty: 1, price: 1000000, note: '', isCustom: true
  });
  renderItems();
}

function addCustomSection() {
  activeQuote.push({
    id: 'sec_' + Date.now(), name: '새로운 직접 입력 그룹', items: []
  });
  renderItems();
}

function calculateTotal() {
  let net = 0;
  if(window.quoteStates) {
    Object.values(window.quoteStates).forEach(catData => {
      catData.forEach(sec => {
        sec.items.forEach(item => {
          if(item.checked) net += (item.qty * item.price);
        });
      });
    });
  } else {
    activeQuote.forEach(sec => {
      sec.items.forEach(item => {
        if(item.checked) net += (item.qty * item.price);
      });
    });
  }
  
  let vat = Math.floor(net * 0.1);
  let total = net + vat;
  document.getElementById('sum-net').innerText = fmtNum(net);
  document.getElementById('sum-vat').innerText = fmtNum(vat);
  document.getElementById('sum-total').innerText = fmtNum(total);
}

// --- 4. 탭 이동 및 미리보기 ---
function enterMode(mode) {
  const overlay = document.getElementById('splash-overlay');
  overlay.classList.add('fade-out');
  setTimeout(() => overlay.remove(), 500);
  switchMode(mode);
}

function switchMode(mode) {
  ['quote', 'info', 'social'].forEach(m => {
    const btn = document.getElementById('mode-btn-' + m);
    if(btn) btn.classList.remove('active');
    const tabs = document.getElementById('tabs-' + m);
    if(tabs) tabs.style.display = 'none';
  });
  
  document.querySelectorAll('.tab-content').forEach(c => {
    c.classList.remove('active');
  });

  const actBtn = document.getElementById('mode-btn-' + mode);
  if(actBtn) actBtn.classList.add('active');
  const actTabs = document.getElementById('tabs-' + mode);
  if(actTabs) actTabs.style.display = 'flex';
  
  if (mode === 'quote') switchTab('info', 'quote', document.querySelector('#tabs-quote button'));
  else if (mode === 'info') switchTab('stats', 'info', document.querySelector('#tabs-info button'));
  else if (mode === 'social') switchTab('social-input', 'social', document.querySelector('#tabs-social button'));
}

function switchTab(tabId, mode, btnEl) {
  const grp = mode || 'quote';
  document.querySelectorAll('#tabs-' + grp + ' .tab-btn').forEach(b => b.classList.remove('active'));
  if (btnEl) {
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
  }
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById('tab-' + tabId).classList.add('active');
  if (tabId === 'preview') renderPreview();
  if (tabId === 'news' && !newsLoaded) loadNews();
  if (tabId === 'salary') renderSalaryGrid();
  if (tabId === 'map' && !window.mapInitialized) initAgencyMap();
}

// --- 5-0. 연봉 위젯 (100인 이하 광고대행사 기준 중간값) ---
let SALARY_DATA;
let salaryStageIdx = 0;
let salaryUnit = 'annual';

function setSalaryStage(idx, btn) {
  salaryStageIdx = idx;
  document.querySelectorAll('.salary-stage-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderSalaryGrid();
}
function setSalaryUnit(unit, btn) {
  salaryUnit = unit;
  document.querySelectorAll('.salary-unit-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderSalaryGrid();
}
function renderSalaryGrid() {
  const grid = document.getElementById('salary-grid');
  if (!grid) return;
  const vals = SALARY_DATA.industries.map(d => d.vals[salaryStageIdx]);
  const maxVal = Math.max(...vals);
  const avgVal = Math.round(vals.reduce((a,b)=>a+b,0)/vals.length);
  grid.innerHTML = SALARY_DATA.industries.map((ind, i) => {
    const v = ind.vals[salaryStageIdx];
    const display = salaryUnit === 'annual'
      ? v.toLocaleString() + ' 만원/년'
      : Math.round(v/12).toLocaleString() + ' 만원/월';
    const pct = Math.round((v / maxVal) * 100);
    const diff = v - avgVal;
    const diffStr = diff >= 0 ? `평균 +${diff.toLocaleString()}만` : `평균 ${diff.toLocaleString()}만`;
    const diffCls = diff >= 0 ? 'color:#059669' : 'color:#ef4444';
    return `<div class="salary-industry-card">
      <div class="salary-industry-name">${ind.name}</div>
      <div class="salary-big-num">${display}</div>
      <div class="salary-sub-txt" style="${diffCls}">${diffStr}</div>
      <div class="salary-bar-wrap">
        <div class="salary-bar"><div class="salary-bar-fill" style="width:${pct}%"></div></div>
      </div>
    </div>`;
  }).join('');
}

// --- 5-1. 뉴스 탭 로직 ---
let allNews = [];
let filteredNews = [];
let newsPage = 1;
const NEWS_PER_PAGE = 12;
let newsLoaded = false;
let activeNewsFilter = 'all';

const CAT_INFO = {
  ai:      { label: '🤖 AI/데이터',     cls: 'cat-ai' },
  digital: { label: '📱 디지털/SNS',    cls: 'cat-digital' },
  ad:      { label: '🎯 광고/캠페인',   cls: 'cat-ad' },
  brand:   { label: '🏷 브랜드/PR',     cls: 'cat-brand' },
  media:   { label: '📺 미디어/플랫폼', cls: 'cat-media' },
  trend:   { label: '📈 업계동향',      cls: 'cat-trend' },
};

function categorizeArticle(title) {
  const t = (title || '').toLowerCase();
  if (/ai|인공지능|챗gpt|gpt|머신러닝|딥러닝|자동화|빅데이터|알고리즘|llm|생성형|에이전트/.test(t)) return 'ai';
  if (/sns|소셜|유튜브|인스타|틱톡|메타|페이스북|릴스|숏폼|크리에이터|인플루언서/.test(t)) return 'digital';
  if (/광고제|어워즈|캠페인|크리에이티브|cf |광고 영상|광고 캠페인|필름|광고대행|이노션|제일기획|대홍기획|이노레드/.test(t)) return 'ad';
  if (/브랜드|리브랜딩|런칭|pr |홍보|스폰서|파트너십|앰배서더|협찬|모델/.test(t)) return 'brand';
  if (/미디어|방송|플랫폼|ott|넷플릭스|네이버|카카오|구글|매체|신문/.test(t)) return 'media';
  return 'trend';
}

async function loadNews() {
  const grid = document.getElementById('news-grid');
  try {
    // GitHub Pages / Vercel 환경 모두 호환
    const res = await fetch('./data/news.json');
    if (!res.ok) throw new Error('news.json 로드 실패: ' + res.status);
    const raw = await res.json();
    // 썸네일 있는 기사 먼저, 그 다음 날짜 내림차순
    allNews = raw.sort((a, b) => {
      if (!!a.thumbnail === !!b.thumbnail) return new Date(b.date) - new Date(a.date);
      return a.thumbnail ? -1 : 1;
    });
    newsLoaded = true;
    filteredNews = [...allNews];
    newsPage = 1;
    renderNewsGrid(true);
  } catch(e) {
    grid.innerHTML = `<div class="news-empty"><div class="empty-icon">😢</div><p>뉴스를 불러올 수 없습니다.<br><small>${e.message}</small></p></div>`;
    console.error('뉴스 로드 오류:', e);
  }
}

function setNewsFilter(cat, btn) {
  activeNewsFilter = cat;
  document.querySelectorAll('.news-filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  filterNews();
}

function filterNews() {
  const query = (document.getElementById('news-search').value || '').trim().toLowerCase();
  filteredNews = allNews.filter(a => {
    const articleCat = a.category || categorizeArticle(a.title);
    const matchCat = activeNewsFilter === 'all' || articleCat === activeNewsFilter;
    const matchQuery = !query || a.title.toLowerCase().includes(query);
    return matchCat && matchQuery;
  });
  newsPage = 1;
  renderNewsGrid(true);
}

function loadMoreNews() {
  newsPage++;
  renderNewsGrid(false);
}

function renderNewsGrid(reset) {
  const grid = document.getElementById('news-grid');
  const loadMoreBtn = document.getElementById('news-load-more');
  const statsEl = document.getElementById('news-stats');
  
  const pageItems = filteredNews.slice(0, newsPage * NEWS_PER_PAGE);
  
  statsEl.innerHTML = `총 <strong>${filteredNews.length}</strong>건의 기사`;
  
  if (filteredNews.length === 0) {
    grid.innerHTML = `<div class="news-empty"><div class="empty-icon">🔍</div><p>검색 결과가 없습니다.</p></div>`;
    loadMoreBtn.style.display = 'none';
    return;
  }
  
  if (reset) grid.innerHTML = '';
  
  const startIdx = reset ? 0 : (newsPage - 1) * NEWS_PER_PAGE;
  const endIdx = newsPage * NEWS_PER_PAGE;
  const itemsToRender = filteredNews.slice(startIdx, endIdx);
  
  itemsToRender.forEach(article => {
    const card = document.createElement('div');
    card.className = 'news-card';
    
    const articleCat = article.category || categorizeArticle(article.title);
    const catInfo = CAT_INFO[articleCat] || CAT_INFO.trend;
    const catGradients = {
      ai: 'linear-gradient(135deg,#ede9fe,#c4b5fd)', digital: 'linear-gradient(135deg,#e0f2fe,#7dd3fc)',
      ad: 'linear-gradient(135deg,#fef3c7,#fcd34d)', brand: 'linear-gradient(135deg,#d1fae5,#6ee7b7)',
      media: 'linear-gradient(135deg,#fee2e2,#fca5a5)', trend: 'linear-gradient(135deg,#f1f5f9,#cbd5e1)'
    };
    const catEmojis = { ai:'🤖', digital:'📱', ad:'🎯', brand:'🏷', media:'📺', trend:'📈' };
    
    const date = article.date ? new Date(article.date).toLocaleDateString('ko-KR', {month:'long', day:'numeric'}) : '';
    
    const thumbHtml = article.thumbnail
      ? `<div class="news-card-thumb"><img src="${article.thumbnail}" alt="썸네일" loading="lazy" onerror="this.parentNode.style.background='${catGradients[articleCat]||catGradients.trend}';this.parentNode.innerHTML='<span style=\\'font-size:32px\\'>${catEmojis[articleCat]||'📰'}</span>';"></div>`
      : `<div class="news-card-thumb no-img" style="background:${catGradients[articleCat]||catGradients.trend}"><span style="font-size:32px">${catEmojis[articleCat]||'📰'}</span></div>`;
    
    card.innerHTML = `
      ${thumbHtml}
      <div class="news-card-body">
        <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:4px;">
          <span class="cat-badge ${catInfo.cls}">${catInfo.label}</span>
          <span class="news-card-source source-default">${article.source || '뉴스'}</span>
        </div>
        <div class="news-card-title">${article.title}</div>
        <div class="news-card-footer">
          <span class="news-card-date">📅 ${date}</span>
          <a href="${article.link}" target="_blank" rel="noopener" class="news-card-link">읽기 →</a>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
  
  // 더보기 버튼 표시 여부
  if (filteredNews.length > newsPage * NEWS_PER_PAGE) {
    loadMoreBtn.style.display = 'block';
    loadMoreBtn.disabled = false;
  } else {
    loadMoreBtn.style.display = 'none';
  }
}

function selectDesign(theme) {
  document.getElementById('preview-doc').className = 'theme-' + theme;
  renderPreview();
}

function renderPreview() {
  const theme = document.getElementById('theme-select').value;
  const doc = document.getElementById('preview-doc');
  doc.className = 'theme-' + theme;
  
  let net = 0;
  let rowsHtml = '';
  
    if(window.quoteStates) {
    Object.keys(window.quoteStates).forEach(catKey => {
      const catData = window.quoteStates[catKey];
      catData.forEach(sec => {
        let hasChecked = sec.items.some(i => i.checked);
        if(hasChecked) {
          if(theme === 'minimal') {
            rowsHtml += `<tr class="sec-row"><td colspan="6">${sec.name}</td></tr>`;
          } else if(theme === 'standard') {
            rowsHtml += `<tr class="sec-row"><td colspan="6">${sec.name}</td></tr>`;
          } else {
            rowsHtml += `<tr class="section-row"><td colspan="7">${sec.name}</td></tr>`;
          }
          sec.items.forEach(item => {
            if(item.checked) {
              const sum = item.qty * item.price;
              net += sum;
              if(theme === 'minimal') {
                rowsHtml += `
                  <tr>
                    <td data-label="항목명">${item.name}</td>
                    <td data-label="수량" class="align-center">${fmtNum(item.qty)}</td>
                    <td data-label="단위" class="align-center">${item.unit}</td>
                    <td data-label="단가 (원)" class="align-right">${fmtNum(item.price)}</td>
                    <td data-label="금액 (원)" class="align-right font-weight-bold">${fmtNum(sum)}</td>
                    <td data-label="비고" style="color:#64748b; font-size:11px;">${item.note||item.desc||''}</td>
                  </tr>
                `;
              } else if(theme === 'standard') {
                rowsHtml += `
                  <tr>
                    <td class="desc-col">${item.name}</td>
                    <td class="align-center">${fmtNum(item.qty)}</td>
                    <td class="align-center">${item.unit}</td>
                    <td class="align-right">${fmtNum(item.price)}</td>
                    <td class="align-right font-weight-bold">${fmtNum(sum)}</td>
                    <td style="color:#888; font-size:11px;">${item.note||item.desc||''}</td>
                  </tr>
                `;
              } else {
                rowsHtml += `
                  <tr>
                    <td>${item.name}</td>
                    <td style="text-align:center;">${item.unit}</td>
                    <td style="text-align:right;">${fmtNum(item.qty)}</td>
                    <td style="text-align:right;">${fmtNum(item.price)}</td>
                    <td style="text-align:right;"><strong>${fmtNum(sum)}</strong></td>
                    <td>${item.note||item.desc||''}</td>
                  </tr>
                `;
              }
            }
          });
        }
      });
    });
  }
  const vat = net * 0.1;
  const total = net + vat;

  let html = '';
  
  if(theme === 'standard') {
    html = `
      <div class="doc-header">
        <div class="top-address">주식회사 몽규. 서울시 마포구 성미산로 103 1~3F</div>
        <div class="top-contact">T. 02-6404-9204 / E. monq@monq.kr / H. www.monq.kr</div>
        <div class="doc-title-box">
          <div class="doc-title">${gv('p_title') || '프로젝트 견적서'}</div>
          <div class="doc-subtitle">제작물 유형별 단가표</div>
        </div>
        <div class="doc-info-grid">
          <div>
            <div class="client-box">${gv('c_company')} 귀하</div>
            <div>Attn: ${gv('c_manager')}</div>
            <div style="margin-top:10px; color:#666;">Date: ${gv('p_date')} | No: ${gv('p_no')}</div>
          </div>
        </div>
        <div class="total-box">
          <div class="label">제안가<br><span style="font-size:11px; font-weight:normal;">(부가세별도)</span></div>
          <div class="amount">₩${fmtNum(net)}</div>
        </div>
      </div>
      <table class="doc-items">
        <thead>
          <tr>
            <th style="text-align:left;">Description</th>
            <th width="10%">Quantity</th>
            <th width="10%">Unit</th>
            <th width="15%" style="text-align:right;">Rate</th>
            <th width="15%" style="text-align:right;">공급가</th>
            <th width="15%" style="text-align:left;">비고</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
        <tfoot style="border-top: 2px solid #333;">
          <tr>
            <td colspan="4" class="align-right" style="padding:12px 10px; font-weight:bold;">공급가액</td>
            <td class="align-right font-weight-bold" style="padding:12px 10px;">${fmtNum(net)}</td>
            <td></td>
          </tr>
          <tr>
            <td colspan="4" class="align-right" style="padding:12px 10px;">부가가치세 (10%)</td>
            <td class="align-right" style="padding:12px 10px;">${fmtNum(vat)}</td>
            <td></td>
          </tr>
          <tr>
            <td colspan="4" class="align-right" style="padding:15px 10px; color:#e84648; font-weight:800; font-size:14px;">총 청구금액</td>
            <td class="align-right" style="padding:15px 10px; color:#e84648; font-weight:800; font-size:14px;">${fmtNum(total)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
      <div class="doc-footer">
        <p>※ 특기사항: ${gv('p_note')||'본 견적서는 제출일로부터 ' + (gv('p_valid')||'30일') + '간 유효합니다.'}</p>
      </div>
    `;
  } else if(theme === 'minimal') {
    html = `
      <div class="doc-header">
        <div class="doc-title">QUOTATION</div>
        <div style="color:#666">${gv('p_date')} | ${gv('p_no')}</div>
      </div>
      <div class="doc-info-grid">
        <div>
          <strong style="font-size:15px; border-bottom:1px solid #000; padding-bottom:5px; display:inline-block; margin-bottom:10px;">${gv('c_company')} 귀하</strong><br>
          Project: ${gv('p_title')}<br>
          Attn: ${gv('c_manager')}
        </div>
        <div style="text-align:right">
          <strong>${gv('s_company')}</strong><br>
          ${gv('s_ceo')} | ${gv('s_biz_no')}<br>
          ${gv('s_address')}<br>
          ${gv('s_manager')} | ${gv('s_email')}
        </div>
      </div>
      <div class="doc-total">
        Total: ${fmt(total)} <span style="font-size:12px; font-weight:normal; color:#666">(VAT Inc.)</span>
      </div>
      <table class="doc-items">
        <thead>
          <tr>
            <th>항목 (Item)</th>
            <th width="10%" class="align-center">수량</th>
            <th width="10%" class="align-center">단위</th>
            <th width="15%" class="align-right">단가 (원)</th>
            <th width="15%" class="align-right">금액 (원)</th>
            <th width="15%">비고</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
        <tfoot style="font-weight:bold; background:#f8fafc; border-top: 2px solid #cbd5e1;">
          <tr>
            <td colspan="4" class="hide-mobile align-right" style="padding:12px 10px;">공급가액</td>
            <td data-label="공급가액" class="align-right" style="padding:12px 10px;">${fmtNum(net)}</td>
            <td class="hide-mobile"></td>
          </tr>
          <tr>
            <td colspan="4" class="hide-mobile align-right" style="padding:12px 10px;">부가가치세 (10%)</td>
            <td data-label="부가가치세 (10%)" class="align-right" style="padding:12px 10px;">${fmtNum(vat)}</td>
            <td class="hide-mobile"></td>
          </tr>
          <tr>
            <td colspan="4" class="hide-mobile align-right" style="padding:15px 10px; color:var(--primary); font-size:15px;">총 청구금액</td>
            <td data-label="총 청구금액" class="align-right" style="padding:15px 10px; color:var(--primary); font-size:15px;">${fmtNum(total)}</td>
            <td class="hide-mobile"></td>
          </tr>
        </tfoot>
      </table>
      <div class="doc-footer">
        * 본 견적서는 제출일로부터 ${gv('p_valid') || '30일'}간 유효합니다.<br>
        * ${gv('p_note')}
      </div>
    `;
  } else {
    html = `
      <div class="doc-header">
        <div class="doc-title">견 적 서</div>
        <div class="doc-info-grid">
          <div class="supplier-info">
            <div class="info-row"><strong>공급자</strong></div>
            <div class="info-row"><span>상호:</span> <span>${gv('s_company')}</span></div>
            <div class="info-row"><span>대표:</span> <span>${gv('s_ceo')}</span></div>
            <div class="info-row"><span>등록번호:</span> <span>${gv('s_biz_no')}</span></div>
            <div class="info-row"><span>주소:</span> <span>${gv('s_address')}</span></div>
            <div class="info-row"><span>담당자:</span> <span>${gv('s_manager')} (${gv('s_tel')} / ${gv('s_email')})</span></div>
          </div>
          <div class="client-info">
            <div class="info-row"><strong>공급받는 자</strong></div>
            <div class="info-row"><span>상호:</span> <span>${gv('c_company')} 귀하</span></div>
            <div class="info-row"><span>담당자:</span> <span>${gv('c_manager')} (${gv('c_tel')})</span></div>
            <br>
            <div class="info-row"><span>견적명:</span> <span><strong>${gv('p_title')}</strong></span></div>
            <div class="info-row"><span>문서번호:</span> <span>${gv('p_no')}</span></div>
            <div class="info-row"><span>견적일자:</span> <span>${gv('p_date')}</span></div>
            <div class="info-row"><span>유효기간:</span> <span>${gv('p_valid')}</span></div>
          </div>
        </div>
      </div>
      <div class="doc-total-box">
        <div><strong>총 견적 금액:</strong> <span class="doc-total-num">₩${total.toLocaleString()}</span> (VAT 포함)</div>
        <div style="font-size:13px; color:#555;">(공급가액: ₩${net.toLocaleString()} / 부가세: ₩${vat.toLocaleString()})</div>
      </div>
      <table class="doc-table">
        <thead>
          <tr>
            <th>항목명</th><th style="width:60px;">단위</th><th style="width:60px;">수량</th>
            <th style="width:100px;">단가(원)</th><th style="width:120px;">공급가액(원)</th><th>비고</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
      <div class="doc-footer">
        <p>※ 특기사항: ${gv('p_note')||'본 견적서는 발행일로부터 ' + (gv('p_valid')||'30일') + '간 유효합니다.'}</p>
        <p style="text-align:center; font-weight:700; margin-top:40px;">주식회사 몽규 (MONQ Park) 직인생략</p>
      </div>
    `;
  }
  
  doc.innerHTML = html;
}

function exportPDF() {
  checkInApp();
  renderPreview();
  window.print();
}

async function exportExcel() {
  checkInApp();
  if(typeof ExcelJS === 'undefined') {
    alert('ExcelJS 라이브러리를 불러오지 못했습니다. 인터넷 연결을 확인해주세요.');
    return;
  }
  
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('견적서', {
    pageSetup: { paperSize: 9, orientation: 'portrait' }
  });

  ws.columns = [
    { width: 30 }, { width: 10 }, { width: 10 }, { width: 20 }, { width: 25 }, { width: 25 }
  ];

  const borderAll = {
    top: {style:'thin', color:{argb:'FFCBD5E1'}},
    left: {style:'thin', color:{argb:'FFCBD5E1'}},
    bottom: {style:'thin', color:{argb:'FFCBD5E1'}},
    right: {style:'thin', color:{argb:'FFCBD5E1'}}
  };
  const borderThick = {
    top: {style:'medium', color:{argb:'FF0F172A'}},
    left: {style:'thin', color:{argb:'FFCBD5E1'}},
    bottom: {style:'medium', color:{argb:'FF0F172A'}},
    right: {style:'thin', color:{argb:'FFCBD5E1'}}
  };

  ws.mergeCells('A1:F2');
  const titleCell = ws.getCell('A1');
  titleCell.value = '견 적 서';
  titleCell.font = { name:'Malgun Gothic', size: 24, bold: true };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

  ws.mergeCells('A4:C4'); ws.getCell('A4').value = '[공급받는 자]'; ws.getCell('A4').font = {bold:true};
  ws.mergeCells('A5:C5'); ws.getCell('A5').value = '상호: ' + gv('c_company') + ' 귀하';
  ws.mergeCells('A6:C6'); ws.getCell('A6').value = '담당자: ' + gv('c_manager') + ' (' + gv('c_tel') + ')';
  
  ws.mergeCells('A8:C8'); ws.getCell('A8').value = '견적명: ' + gv('p_title'); ws.getCell('A8').font = {bold:true};
  ws.mergeCells('A9:C9'); ws.getCell('A9').value = '문서번호: ' + gv('p_no');
  ws.mergeCells('A10:C10'); ws.getCell('A10').value = '견적일자: ' + gv('p_date');
  ws.mergeCells('A11:C11'); ws.getCell('A11').value = '유효기간: ' + gv('p_valid');

  ws.mergeCells('D4:F4'); ws.getCell('D4').value = '[공급자]'; ws.getCell('D4').font = {bold:true};
  ws.mergeCells('D5:F5'); ws.getCell('D5').value = '상호: ' + gv('s_company');
  ws.mergeCells('D6:F6'); ws.getCell('D6').value = '대표: ' + gv('s_ceo');
  ws.mergeCells('D7:F7'); ws.getCell('D7').value = '등록번호: ' + gv('s_biz_no');
  ws.mergeCells('D8:F8'); ws.getCell('D8').value = '주소: ' + gv('s_address');
  ws.mergeCells('D9:F9'); ws.getCell('D9').value = '담당자: ' + gv('s_manager');
  ws.mergeCells('D10:F10'); ws.getCell('D10').value = '연락처: ' + gv('s_tel');
  ws.mergeCells('D11:F11'); ws.getCell('D11').value = '이메일: ' + gv('s_email');

  ws.addRow(['', '', '', '', '', '']);
  
  let net = 0;
  if(window.quoteStates) {
    Object.values(window.quoteStates).forEach(catData => {
      catData.forEach(sec => {
        sec.items.forEach(item => {
          if(item.checked) net += (item.qty * item.price);
        });
      });
    });
  } else {
    activeQuote.forEach(sec => {
      sec.items.forEach(item => {
        if(item.checked) net += (item.qty * item.price);
      });
    });
  }
  const vat = Math.floor(net * 0.1);
  const total = net + vat;

  const totRow = ws.addRow(['총 견적 금액', '', '', '', '₩' + total.toLocaleString(), '(VAT 포함)']);
  ws.mergeCells(`A${totRow.number}:D${totRow.number}`);
  totRow.font = { bold: true, size: 14, color: {argb:'FFE84648'} };
  ws.getCell(`E${totRow.number}`).font = { bold: true, size: 14, color: {argb:'FFE84648'} };
  ws.getCell(`A${totRow.number}`).alignment = { horizontal: 'right' };
  
  const subRow = ws.addRow(['', '', '', '', `공급가액: ₩${net.toLocaleString()}`, `부가세: ₩${vat.toLocaleString()}`]);
  subRow.font = { size: 11, color: {argb:'FF64748B'} };

  ws.addRow(['', '', '', '', '', '']);

  const headerRow = ws.addRow(['항목명', '수량', '단위', '단가(원)', '공급가액(원)', '비고']);
  headerRow.font = { bold: true };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  headerRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern:'solid', fgColor:{argb:'FFF1F5F9'} };
    cell.border = borderThick;
  });

  if(window.quoteStates) {
    Object.values(window.quoteStates).forEach(catData => {
      catData.forEach(sec => {
        let hasChecked = sec.items.some(i => i.checked);
        if(hasChecked) {
          let r = ws.addRow([sec.name, '', '', '', '', '']);
          ws.mergeCells(`A${r.number}:F${r.number}`);
          r.font = { bold: true, color: {argb:'FF0F172A'} };
          r.fill = { type: 'pattern', pattern:'solid', fgColor:{argb:'FFF8FAFC'} };
          r.getCell(1).border = borderAll;

          sec.items.forEach(item => {
            if(item.checked) {
              const sum = item.qty * item.price;
              let row = ws.addRow([
                item.name, item.qty, item.unit, item.price, sum, item.note||item.desc||''
              ]);
              row.getCell(5).value = { formula: `B${row.number}*D${row.number}`, result: sum };
              row.getCell(2).alignment = { horizontal: 'center' };
              row.getCell(3).alignment = { horizontal: 'center' };
              row.getCell(4).alignment = { horizontal: 'right' };
              row.getCell(5).alignment = { horizontal: 'right' };
              row.getCell(4).numFmt = '#,##0';
              row.getCell(5).numFmt = '#,##0';
              row.getCell(5).font = { bold: true };
              row.eachCell(c => c.border = borderAll);
            }
          });
        }
      });
    });
  } else {
    // fallback
    activeQuote.forEach(sec => {
      let hasChecked = sec.items.some(i => i.checked);
      if(hasChecked) {
        let r = ws.addRow([sec.name, '', '', '', '', '']);
        ws.mergeCells(`A${r.number}:F${r.number}`);
        r.font = { bold: true, color: {argb:'FF0F172A'} };
        r.fill = { type: 'pattern', pattern:'solid', fgColor:{argb:'FFF8FAFC'} };
        r.getCell(1).border = borderAll;

        sec.items.forEach(item => {
          if(item.checked) {
            const sum = item.qty * item.price;
            let row = ws.addRow([
              item.name, item.qty, item.unit, item.price, sum, item.note||item.desc||''
            ]);
            row.getCell(2).alignment = { horizontal: 'center' };
            row.getCell(3).alignment = { horizontal: 'center' };
            row.getCell(4).numFmt = '#,##0';
            row.getCell(5).numFmt = '#,##0';
            row.getCell(5).font = { bold: true };
            row.eachCell(c => c.border = borderAll);
          }
        });
      }
    });
  }

  ws.addRow(['', '', '', '', '', '']);
  const footerRow = ws.addRow(['※ 특기사항: ' + (gv('p_note') || '본 견적서는 발행일로부터 ' + (gv('p_valid')||'30일') + '간 유효합니다.'), '', '', '', '', '']);
  ws.mergeCells(`A${footerRow.number}:F${footerRow.number}`);
  footerRow.font = { color: {argb:'FF475569'} };

  ws.addRow(['', '', '', '', '', '']);
  const signRow = ws.addRow(['주식회사 몽규 (MONQ Park) 직인생략', '', '', '', '', '']);
  ws.mergeCells(`A${signRow.number}:F${signRow.number}`);
  signRow.font = { bold: true, size: 14 };
  signRow.alignment = { horizontal: 'center' };

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `견적서_${gv('p_title')}_${gv('c_company')}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// 시작
function initSplash() {
  // 로고 1.2초 후 선택 화면 페이드인
  setTimeout(() => {
    const logo = document.getElementById('splash-logo');
    const sel  = document.getElementById('splash-select');
    if (!logo || !sel) return;
    logo.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    logo.style.opacity = '0';
    logo.style.transform = 'translateY(-20px)';
    setTimeout(() => {
      logo.style.display = 'none';
      sel.style.display = 'flex';
    }, 400);
  }, 1400);
}
window.onload = () => { init(); initSplash(); };


// --- 6. 대행사 지도 로직 ---
window.mapInitialized = false;
let globalLeafletMap = null;
let allMapMarkers = [];

// fullAgencyData will be populated dynamically from data.js + extraAgencies
let mapItems = [];

function initAgencyMap() {
  window.mapInitialized = true;
  if (typeof L === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => buildMap();
    document.head.appendChild(script);
  } else {
    buildMap();
  }
}

function buildMap() {
  const extraAgencies = [
    {"name": "TBWA 코리아", "url": "https://www.tbwa.co.kr", "address": "서울 강남구 도산대로 217", "lat": 37.5218, "lng": 127.0345},
    {"name": "오리콤 (ORICOM)", "url": "https://www.oricom.com", "address": "서울 종로구 우정국로 26", "lat": 37.5714, "lng": 126.9831},
    {"name": "레오버넷 (Leo Burnett)", "url": "https://www.leoburnett.co.kr", "address": "서울 중구 남대문로 84", "lat": 37.5645, "lng": 126.9824},
    {"name": "차이커뮤니케이션", "url": "http://www.chai.co.kr", "address": "서울 강남구 논현로 606", "lat": 37.5085, "lng": 127.0336},
    {"name": "펜타클 (Pentacle)", "url": "https://pentacle.co.kr", "address": "서울 강남구 테헤란로 501", "lat": 37.5081, "lng": 127.0567},
    {"name": "맥캔에릭슨", "url": "https://www.mccann.com", "address": "서울 중구 소월로 10", "lat": 37.5567, "lng": 126.9749},
    {"name": "애드쿠아인터렉티브", "url": "https://www.adqua.co.kr", "address": "서울 강남구 도산대로 221", "lat": 37.5215, "lng": 127.035},
    {"name": "나스미디어", "url": "https://www.nasmedia.co.kr", "address": "서울 강남구 테헤란로 423", "lat": 37.5056, "lng": 127.0496},
    {"name": "메조미디어", "url": "https://www.mezzomedia.co.kr", "address": "서울 서초구 반포대로 144", "lat": 37.4912, "lng": 127.0076},
    {"name": "인크로스", "url": "https://www.incross.com", "address": "서울 관악구 남부순환로 1926", "lat": 37.4764, "lng": 126.968},
    {"name": "와이더플래닛", "url": "https://www.widerplanet.com", "address": "서울 서초구 서초대로 398", "lat": 37.4965, "lng": 127.0261},
    {"name": "다트미디어", "url": "https://www.dartmedia.co.kr", "address": "서울 강남구 테헤란로 504", "lat": 37.5076, "lng": 127.0578},
    {"name": "메가존 (Megazone)", "url": "https://www.megazone.com", "address": "서울 강남구 역삼로 166", "lat": 37.495, "lng": 127.0378},
    {"name": "엣지랭크", "url": "https://edgerank.co.kr", "address": "서울 서초구 신반포로45길 18", "lat": 37.5113, "lng": 127.0189},
    {"name": "FSN (퓨쳐스트림네트웍스)", "url": "https://www.fsn.co.kr", "address": "서울 강남구 학동로 343", "lat": 37.5169, "lng": 127.0405},
    {"name": "아이디엇 (Ideot)", "url": "https://ideot.co.kr", "address": "서울 강남구 테헤란로 152", "lat": 37.5, "lng": 127.036},
    {"name": "더워터멜론", "url": "https://thewatermelon.com", "address": "서울 중구 남대문로 9길 40", "lat": 37.567, "lng": 126.982},
    {"name": "BAT (비에이티)", "url": "https://batcrew.co.kr", "address": "서울 강남구 도산대로 138", "lat": 37.5185, "lng": 127.025},
    {"name": "스튜디오좋", "url": "https://studiozot.com", "address": "서울 마포구 와우산로 29길 48", "lat": 37.555, "lng": 126.93},
    {"name": "돌고래유괴단", "url": "https://dolphiners.com", "address": "서울 강남구 논현로 150길 21", "lat": 37.52, "lng": 127.03},
    {"name": "디마이너스원", "url": "https://dminusone.co.kr", "address": "서울 성동구 뚝섬로 1나길 5", "lat": 37.54, "lng": 127.045},
    {"name": "오버맨 (Overman)", "url": "https://overman.kr", "address": "서울 강남구 선릉로 806", "lat": 37.525, "lng": 127.04},
    {"name": "이노레드 (INNORED)", "url": "https://innored.co.kr", "address": "서울 강남구 테헤란로 411", "lat": 37.505, "lng": 127.05},
    {"name": "뉴얼리 (Newly)", "url": "https://newly.kr", "address": "서울 성동구 왕십리로 115", "lat": 37.545, "lng": 127.045},
    {"name": "엔자임헬스", "url": "https://enzaim.co.kr", "address": "서울 중구 세종대로 136", "lat": 37.568, "lng": 126.978},
    {"name": "마콘컴퍼니", "url": "https://maconcorp.com", "address": "서울 강남구 역삼로 204", "lat": 37.498, "lng": 127.04},
    {"name": "퍼틸레인", "url": "https://fertilerain.com", "address": "서울 서초구 방배천로 2길 15", "lat": 37.48, "lng": 126.985},
    {"name": "마더브레인", "url": "https://motherbrain.co.kr", "address": "서울 강남구 봉은사로 114", "lat": 37.504, "lng": 127.027},
    {"name": "애드맥스", "url": "https://admax.kr", "address": "서울 구로구 디지털로 306", "lat": 37.482, "lng": 126.896},
    {"name": "코마스인터렉티브", "url": "https://comas.co.kr", "address": "서울 마포구 성암로 189", "lat": 37.58, "lng": 126.89},
    {"name": "대홍기획 디지털", "url": "https://www.daehong.com", "address": "서울 중구 통일로 10", "lat": 37.556, "lng": 126.973},
    {"name": "이노션 디지털", "url": "https://www.innocean.com", "address": "서울 강남구 강남대로 308", "lat": 37.491, "lng": 127.03},
    {"name": "제일기획 디지털", "url": "https://www.cheil.com", "address": "서울 용산구 이태원로 222", "lat": 37.537, "lng": 127.0},
    {"name": "HS Ad 디지털", "url": "https://www.hsad.co.kr", "address": "서울 마포구 마포대로 155", "lat": 37.546, "lng": 126.953},
    {"name": "SM C&C 디지털", "url": "https://www.smcnc.com", "address": "서울 성동구 왕십리로 83-21", "lat": 37.542, "lng": 127.043},
    {"name": "미디컴 (Medicomm)", "url": "https://medicompr.co.kr", "address": "서울 중구 칠패로 36", "lat": 37.558, "lng": 126.97},
    {"name": "피알원 (PRONE)", "url": "https://prone.co.kr", "address": "서울 서대문구 충정로 53", "lat": 37.565, "lng": 126.965},
    {"name": "KPR", "url": "https://kpr.co.kr", "address": "서울 중구 퇴계로 173", "lat": 37.561, "lng": 126.993},
    {"name": "프레인글로벌", "url": "https://prain.com", "address": "서울 중구 남대문로 9길 24", "lat": 37.567, "lng": 126.98},
    {"name": "마코어뮤즈먼트", "url": "https://maco.kr", "address": "서울 서초구 서초대로 396", "lat": 37.496, "lng": 127.026},
    {"name": "시너지힐앤놀튼", "url": "https://hkstrategies.co.kr", "address": "서울 강남구 영동대로 511", "lat": 37.512, "lng": 127.058},
    {"name": "웨버샌드윅 코리아", "url": "https://webershandwick.co.kr", "address": "서울 중구 세종대로 136", "lat": 37.568, "lng": 126.978},
    {"name": "플레시먼힐러드 코리아", "url": "https://fleishmanhillard.co.kr", "address": "서울 중구 다동길 43", "lat": 37.568, "lng": 126.981},
    {"name": "버슨마스텔러 코리아", "url": "https://bcw-global.com", "address": "서울 종로구 율곡로 88", "lat": 37.576, "lng": 126.987},
    {"name": "에델만 코리아", "url": "https://edelman.kr", "address": "서울 중구 을지로 100", "lat": 37.566, "lng": 126.988},
    {"name": "마크로밀엠브레인", "url": "https://embrain.com", "address": "서울 강남구 강남대로 318", "lat": 37.492, "lng": 127.031},
    {"name": "닐슨코리아", "url": "https://nielsen.com", "address": "서울 중구 소월로 2", "lat": 37.556, "lng": 126.975},
    {"name": "칸타코리아", "url": "https://kantar.com", "address": "서울 영등포구 여의대로 108", "lat": 37.526, "lng": 126.928},
    {"name": "갤럽코리아", "url": "https://gallup.co.kr", "address": "서울 종로구 사직로 8", "lat": 37.575, "lng": 126.968},
    {"name": "마인드쉐어", "url": "https://mindshareworld.com", "address": "서울 강남구 테헤란로 134", "lat": 37.498, "lng": 127.034}
  ];

  let baseData = [];
  if (typeof companyData !== 'undefined') {
    baseData = companyData;
  }
  mapItems = baseData.concat(extraAgencies);

  globalLeafletMap = L.map('agency-map').setView([37.5665, 126.9780], 12);
  L.tileLayer('https://mt0.google.com/vt/lyrs=m&hl=kr&x={x}&y={y}&z={z}', {
      attribution: '&copy; <a href="https://www.google.com/intl/ko_kr/help/terms_maps/">Google Maps</a>'
  }).addTo(globalLeafletMap);

  allMapMarkers = [];

  mapItems.forEach((agency, idx) => {
    if(agency.lat && agency.lng) {
      const iconHtml = `<div style="
          background-color: var(--primary);
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 2px solid #fff;
          box-shadow: 0 0 5px rgba(0,0,0, 0.4);
      "></div>`;
      
      const customIcon = L.divIcon({
          className: 'custom-div-icon',
          html: iconHtml,
          iconSize: [14, 14],
          iconAnchor: [7, 7]
      });

      let popupContent = `
        <div style="font-family:'Pretendard', sans-serif; padding:5px;">
          <h4 style="margin:0 0 8px 0; color:var(--primary); font-size:15px;">${agency.name}</h4>
          <p style="margin:0 0 10px 0; font-size:12px; color:#555;">${agency.address}</p>
      `;
      const popupLinkUrl = agency.url ? agency.url : `https://duckduckgo.com/?q=!ducky+${encodeURIComponent(agency.name + ' 공식 홈페이지')}`;
      popupContent += `<a href="${popupLinkUrl}" target="_blank" style="display:inline-block; padding:6px 12px; background:var(--primary); color:#fff; text-decoration:none; border-radius:4px; font-size:12px; font-weight:bold;">홈페이지 방문하기</a>`;
      popupContent += `</div>`;

      const marker = L.marker([agency.lat, agency.lng], { icon: customIcon }).addTo(globalLeafletMap)
       .bindPopup(popupContent);
       
      allMapMarkers.push({ idx: idx, name: agency.name, address: agency.address, marker: marker });
    }
  });

  renderSidebarList(mapItems);
}

function getInitialLetter(name) {
  const str = name.trim();
  if(!str) return '';
  const c = str.charCodeAt(0);
  if(c >= 0xAC00 && c <= 0xD7A3) {
    const cho = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
    return cho[Math.floor((c - 0xAC00) / 28 / 21)];
  }
  const char = str.charAt(0).toUpperCase();
  if(/[A-Z]/.test(char)) return char;
  return '기타';
}

function renderSidebarList(list) {
  const container = document.getElementById('mapCompanyList');
  document.getElementById('mapTotalCount').innerText = list.length;
  container.innerHTML = '';
  
  const oldNav = document.querySelector('.index-nav');
  if(oldNav) oldNav.remove();

  if (list.length === 0) {
    container.innerHTML = '<div style="color:#64748b; font-size:13px; text-align:center; padding:20px;">검색 결과가 없습니다.</div>';
    return;
  }

  const sorted = [...list].sort((a,b) => a.name.localeCompare(b.name, 'ko-KR'));
  const groups = {};
  sorted.forEach(agency => {
    let init = getInitialLetter(agency.name);
    const mapCons = {'ㄲ':'ㄱ', 'ㄸ':'ㄷ', 'ㅃ':'ㅂ', 'ㅆ':'ㅅ', 'ㅉ':'ㅈ'};
    if(mapCons[init]) init = mapCons[init];
    if(!groups[init]) groups[init] = [];
    groups[init].push(agency);
  });

  const sortedKeys = Object.keys(groups).sort((a,b)=>{
    if(a==='기타') return 1; if(b==='기타') return -1;
    return a.localeCompare(b, 'ko-KR');
  });

  sortedKeys.forEach(key => {
    const header = document.createElement('div');
    header.className = 'index-header';
    header.id = 'index-group-' + key;
    header.innerText = key;
    container.appendChild(header);

    groups[key].forEach(agency => {
      const markerObj = allMapMarkers.find(m => m.name === agency.name);
      const card = document.createElement('div');
      card.className = 'map-company-card';
      const cardLinkUrl = agency.url ? agency.url : `https://duckduckgo.com/?q=!ducky+${encodeURIComponent(agency.name + ' 공식 홈페이지')}`;
      card.innerHTML = `<h4>${agency.name}</h4><p>${agency.address}</p>` + 
                       `<a href="${cardLinkUrl}" target="_blank" style="font-size:11px; color:var(--primary); text-decoration:none; margin-top:5px; display:inline-block;" onclick="event.stopPropagation()">🔗 홈페이지 방문</a>`;
      card.onclick = () => {
        if(markerObj) {
          globalLeafletMap.setView(markerObj.marker.getLatLng(), 15);
          markerObj.marker.openPopup();
        }
      };
      container.appendChild(card);
    });
  });

  if(sortedKeys.length > 1) {
    const nav = document.createElement('div');
    nav.className = 'index-nav';
    sortedKeys.forEach(key => {
      const item = document.createElement('div');
      item.className = 'index-nav-item';
      item.innerText = key;
      item.onclick = () => {
        const target = document.getElementById('index-group-' + key);
        if(target) {
          container.scrollTo({ top: target.offsetTop - container.offsetTop - 10, behavior: 'smooth' });
        }
      };
      nav.appendChild(item);
    });
    document.querySelector('.map-sidebar').appendChild(nav);
  }
}

function searchAgencyMap() {
  const query = document.getElementById('mapSearchInput').value.trim().toLowerCase();
  if(!query) {
    renderSidebarList(mapItems);
    return;
  }
  
  const filtered = mapItems.filter(agency => 
    agency.name.toLowerCase().includes(query) || 
    (agency.address && agency.address.toLowerCase().includes(query))
  );
  
  renderSidebarList(filtered);
  
  // also open popup for the first matched marker
  if (filtered.length > 0) {
    const firstObj = allMapMarkers.find(m => m.name === filtered[0].name);
    if(firstObj) {
      globalLeafletMap.setView(firstObj.marker.getLatLng(), 14);
      firstObj.marker.openPopup();
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const mapInput = document.getElementById('mapSearchInput');
  if(mapInput) {
    mapInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        searchAgencyMap();
      }
    });
  }
});

let isEditMode = false;
function toggleEditMode() {
  isEditMode = !isEditMode;
  const btn = document.getElementById('btn-edit-mode');
  const tds = document.querySelectorAll('#preview-doc td, #preview-doc th, #preview-doc .doc-title, #preview-doc .top-address, #preview-doc .top-contact, #preview-doc .client-box');
  
  if(isEditMode) {
    btn.innerHTML = '✅ 편집 완료';
    btn.style.background = '#10b981';
    tds.forEach(td => {
      td.setAttribute('contenteditable', 'true');
      td.style.border = '1px dashed #cbd5e1';
      td.style.background = '#f8fafc';
    });
  } else {
    btn.innerHTML = '✍️ 견적서 직접 편집 모드';
    btn.style.background = '#64748b';
    tds.forEach(td => {
      td.removeAttribute('contenteditable');
      td.style.border = '';
      td.style.background = '';
    });
  }
}
