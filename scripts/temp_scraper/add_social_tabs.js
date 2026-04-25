const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add mode button
const modeHtml = `<button class="mode-btn" id="mode-btn-social" onclick="switchMode('social')">🚀 소셜 콘텐츠</button>`;
html = html.replace(/(<button class="mode-btn" id="mode-btn-info"[^>]*>.*?<\/button>)/, '$1\n      ' + modeHtml);

// 2. Add tabs container
const tabsHtml = `
    <!-- Social Content Tabs -->
    <div class="tabs" id="tabs-social" style="display:none;">
      <button class="tab-btn active" onclick="switchTab('social-input','social',this)">9. 광고주 입력</button>
      <button class="tab-btn" onclick="switchTab('social-insight','social',this)">10. 분석 결과</button>
      <button class="tab-btn" onclick="switchTab('social-content','social',this)">11. 콘텐츠</button>
      <button class="tab-btn" onclick="switchTab('social-schedule','social',this)">12. 스케줄링</button>
    </div>
`;
html = html.replace(/(<div class="tabs" id="tabs-info"[^>]*>[\s\S]*?<\/div>)/, '$1\n' + tabsHtml);

// 3. Add tab contents
const tabContentsHtml = `
  <!-- ==================== SOCIAL MODE ==================== -->
  
  <!-- Tab 9: Social Input -->
  <div id="tab-social-input" class="tab-pane" style="display:none;">
    <div class="card">
      <h2 style="margin-bottom:20px; color:var(--secondary);">광고주 정보 입력</h2>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-bottom:20px;">
        <div class="form-group">
          <label for="soc_company">광고주 회사명 <span style="color:var(--primary)">*</span></label>
          <input type="text" id="soc_company" placeholder="예: 유어브랜드">
        </div>
        <div class="form-group">
          <label for="soc_industry">산업군 <span style="color:var(--primary)">*</span></label>
          <select id="soc_industry">
            <option value="F&B">F&B</option>
            <option value="패션">패션</option>
            <option value="테크">테크</option>
            <option value="뷰티">뷰티</option>
            <option value="교육">교육</option>
            <option value="B2B SaaS">B2B SaaS</option>
            <option value="기타">기타</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label for="soc_products">핵심 제품·서비스 <span style="color:var(--primary)">*</span></label>
        <textarea id="soc_products" rows="3" placeholder="예: 수제 크래프트 맥주, 4종 시그니처"></textarea>
      </div>
      <div class="form-group">
        <label for="soc_target">핵심 타깃 <span style="color:var(--primary)">*</span></label>
        <input type="text" id="soc_target" placeholder="예: 20대 후반 ~ 30대 직장인, 미식 감도 높음">
      </div>
      <div class="form-group">
        <label>톤 & 매너 (1~3개 선택)</label>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <label><input type="checkbox" name="soc_tone" value="친근함"> 친근함</label>
          <label><input type="checkbox" name="soc_tone" value="전문성"> 전문성</label>
          <label><input type="checkbox" name="soc_tone" value="유머"> 유머</label>
          <label><input type="checkbox" name="soc_tone" value="감성"> 감성</label>
          <label><input type="checkbox" name="soc_tone" value="도발적"> 도발적</label>
          <label><input type="checkbox" name="soc_tone" value="신뢰"> 신뢰</label>
          <label><input type="checkbox" name="soc_tone" value="트렌디"> 트렌디</label>
        </div>
      </div>
      <div class="form-group">
        <label for="soc_competitors">경쟁사 / 벤치마킹</label>
        <input type="text" id="soc_competitors" placeholder="예: 구스아일랜드, 제주맥주">
      </div>
      <div class="form-group">
        <label>캠페인 목적 <span style="color:var(--primary)">*</span></label>
        <div style="display:flex; gap:15px;">
          <label><input type="radio" name="soc_goal" value="인지도" checked> 인지도</label>
          <label><input type="radio" name="soc_goal" value="구매 전환"> 구매 전환</label>
          <label><input type="radio" name="soc_goal" value="팬덤 형성"> 팬덤 형성</label>
          <label><input type="radio" name="soc_goal" value="런칭"> 런칭</label>
        </div>
      </div>
      <div class="form-group">
        <label>주력 채널 (다중선택) <span style="color:var(--primary)">*</span></label>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <label><input type="checkbox" name="soc_channel" value="Instagram" checked> Instagram</label>
          <label><input type="checkbox" name="soc_channel" value="Reels" checked> Reels</label>
          <label><input type="checkbox" name="soc_channel" value="TikTok"> TikTok</label>
          <label><input type="checkbox" name="soc_channel" value="Threads"> Threads</label>
          <label><input type="checkbox" name="soc_channel" value="YouTube Shorts"> YouTube Shorts</label>
          <label><input type="checkbox" name="soc_channel" value="X"> X</label>
          <label><input type="checkbox" name="soc_channel" value="Naver Blog"> Naver Blog</label>
          <label><input type="checkbox" name="soc_channel" value="LinkedIn"> LinkedIn</label>
        </div>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
        <div class="form-group">
          <label for="soc_freq">발행 빈도 <span style="color:var(--primary)">*</span></label>
          <select id="soc_freq">
            <option value="주 2회">주 2회</option>
            <option value="주 3회" selected>주 3회</option>
            <option value="주 5회">주 5회</option>
            <option value="매일">매일</option>
          </select>
        </div>
        <div class="form-group" style="display:flex; align-items:flex-end;">
          <button type="button" class="btn" style="width:100%;" onclick="importTrendKeywords()">📊 정보트렌드 키워드 가져오기</button>
        </div>
      </div>
      <div class="form-group">
        <label for="soc_trend_kw">적용된 트렌드 키워드</label>
        <input type="text" id="soc_trend_kw" placeholder="가져온 키워드가 여기에 표시됩니다">
      </div>
      
      <div style="margin-top:30px; padding-top:20px; border-top:1px solid var(--border-color);">
        <h3 style="margin-bottom:15px; font-size:14px;">🛠 AI 모델 설정 (선택)</h3>
        <div style="display:flex; gap:10px;">
          <select id="soc_ai_provider" style="width:150px;">
            <option value="demo">Demo (데모 모드)</option>
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="gemini">Gemini</option>
          </select>
          <input type="password" id="soc_api_key" placeholder="API 키 입력 (sessionStorage에만 임시 저장됨)" style="flex:1;">
        </div>
        <p style="font-size:11px; color:var(--text-light); margin-top:5px;">API 키가 없으면 기본 데모 응답을 사용합니다.</p>
      </div>
      
      <button class="btn" style="width:100%; margin-top:20px; padding:15px; font-size:18px; font-weight:bold;" onclick="SocialApp.startInsight()">🔍 광고주 분석 시작</button>
    </div>
  </div>

  <!-- Tab 10: Social Insight -->
  <div id="tab-social-insight" class="tab-pane" style="display:none;">
    <div id="insight-container">
      <div style="text-align:center; padding:50px; color:var(--text-light);">
        이전 탭에서 분석을 시작해주세요.
      </div>
    </div>
  </div>

  <!-- Tab 11: Social Content -->
  <div id="tab-social-content" class="tab-pane" style="display:none;">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
      <h3 style="margin:0;">콘텐츠 기획</h3>
      <div>
        <button class="btn" style="padding:6px 12px; font-size:12px;" onclick="SocialApp.startContent()">전체 재생성</button>
      </div>
    </div>
    <div id="content-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:20px;">
      <div style="text-align:center; padding:50px; color:var(--text-light); grid-column:1/-1;">
        인사이트 탭에서 분석 완료 후 콘텐츠 기획을 시작해주세요.
      </div>
    </div>
    <div style="text-align:right; margin-top:20px;">
      <button class="btn" onclick="switchTab('social-schedule', 'social', document.querySelector('#tabs-social button:nth-child(4)'))">📅 스케줄링으로</button>
    </div>
  </div>

  <!-- Tab 12: Social Schedule -->
  <div id="tab-social-schedule" class="tab-pane" style="display:none;">
    <div class="card" style="margin-bottom:20px;">
      <h2 style="margin-bottom:15px;">월간 스케줄</h2>
      <div id="schedule-calendar" style="min-height:300px; border:1px solid var(--border-color); border-radius:8px; padding:10px;">
        <div style="text-align:center; padding:50px; color:var(--text-light);">
          콘텐츠 생성 후 스케줄이 여기에 표시됩니다.
        </div>
      </div>
      
      <div style="display:flex; gap:10px; margin-top:20px;">
        <button class="save-btn" style="flex:1;" onclick="SocialExport.exportJson()">📦 한 파일로 내보내기 (.json)</button>
        <button class="btn" style="flex:1;" onclick="SocialExport.exportXlsx()">📊 엑셀로 (.xlsx)</button>
        <button class="btn" style="flex:1;" onclick="SocialExport.sendToQuote()">📝 견적서로 보내기</button>
      </div>
      <div style="margin-top:15px;">
        <p style="font-size:12px; color:var(--text-light);">이전 파일 불러오기:</p>
        <input type="file" id="soc_import_file" accept=".json" onchange="SocialExport.importJson(event)">
      </div>
    </div>
  </div>
`;

// Insert after <div id="tab-content">
html = html.replace(/(<div id="tab-content">)/, '$1\n' + tabContentsHtml);

// 4. Update switchMode
const oldSwitchModeRegex = /function switchMode\(mode\) \{([\s\S]*?)\}/;
const newSwitchMode = `function switchMode(mode) {
  ['quote', 'info', 'social'].forEach(m => {
    const btn = document.getElementById('mode-btn-' + m);
    if(btn) btn.classList.remove('active');
    const tabs = document.getElementById('tabs-' + m);
    if(tabs) tabs.style.display = 'none';
  });
  
  const cont = document.getElementById('tab-content');
  for (let ch of cont.children) {
    if(ch.classList.contains('tab-pane')) ch.style.display = 'none';
  }

  const actBtn = document.getElementById('mode-btn-' + mode);
  if(actBtn) actBtn.classList.add('active');
  const actTabs = document.getElementById('tabs-' + mode);
  if(actTabs) actTabs.style.display = 'flex';
  
  if (mode === 'quote') switchTab('info', 'quote', document.querySelector('#tabs-quote button'));
  else if (mode === 'info') switchTab('stats', 'info', document.querySelector('#tabs-info button'));
  else if (mode === 'social') switchTab('social-input', 'social', document.querySelector('#tabs-social button'));
}`;
html = html.replace(oldSwitchModeRegex, newSwitchMode);

// 5. Add scripts inclusion for social.js and social-export.js before </body>
html = html.replace(/(<\/body>)/, '  <script src="./js/social-prompts.js"></script>\n  <script src="./js/social-export.js"></script>\n  <script src="./js/social.js"></script>\n$1');

fs.writeFileSync('index.html', html);
console.log('Modified index.html with Social Content structure');
