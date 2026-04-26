const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. CSS Updates
const premiumCSS = `
    /* === Premium Social UI/UX === */
    .hero-header {
      background: linear-gradient(135deg, #FF6B6B 0%, #C0202E 100%);
      color: white;
      padding: 30px 20px;
      border-radius: 12px 12px 0 0;
      text-align: center;
      margin-bottom: 20px;
      box-shadow: 0 4px 15px rgba(192, 32, 46, 0.2);
    }
    .hero-header h2 {
      margin: 0 0 10px 0;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -1px;
    }
    .hero-header p {
      margin: 0;
      font-size: 14px;
      opacity: 0.9;
    }
    
    .section-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 20px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.02);
      transition: box-shadow 0.3s ease;
    }
    .section-card:hover {
      box-shadow: 0 8px 20px rgba(0,0,0,0.06);
    }
    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: #1e293b;
      margin-top: 0;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding-bottom: 10px;
      border-bottom: 2px solid #f1f5f9;
    }
    
    .pulse-btn {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      border: none;
      border-radius: 12px;
      padding: 18px;
      font-size: 18px;
      font-weight: 800;
      width: 100%;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }
    .pulse-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
    }
    .pulse-btn::after {
      content: '';
      position: absolute;
      top: 0; left: -100%; width: 50%; height: 100%;
      background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%);
      transform: skewX(-25deg);
      animation: shine 3s infinite;
    }
    @keyframes shine {
      0% { left: -100%; }
      20% { left: 200%; }
      100% { left: 200%; }
    }
    
    /* Post Preview Card */
    .post-card {
      background: #fff;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
    }
    .post-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 12px 24px rgba(0,0,0,0.08);
      border-color: #cbd5e1;
    }
    .post-header {
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 10px;
      border-bottom: 1px solid #f1f5f9;
      background: #fafaf9;
    }
    .post-avatar {
      width: 32px; height: 32px;
      border-radius: 50%;
      background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 14px; font-weight: bold;
    }
    .post-channel-info {
      display: flex; flex-direction: column;
    }
    .post-channel-name { font-weight: 700; font-size: 13px; color: #1e293b; }
    .post-format { font-size: 11px; color: #64748b; }
    
    /* Timeline */
    .timeline {
      position: relative;
      padding-left: 30px;
      margin: 20px 0;
    }
    .timeline::before {
      content: '';
      position: absolute;
      left: 11px; top: 0; bottom: 0;
      width: 2px;
      background: #e2e8f0;
    }
    .timeline-item {
      position: relative;
      margin-bottom: 25px;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 15px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.02);
    }
    .timeline-item::before {
      content: '';
      position: absolute;
      left: -24px; top: 20px;
      width: 10px; height: 10px;
      border-radius: 50%;
      background: var(--primary);
      border: 3px solid #fff;
      box-shadow: 0 0 0 2px #e2e8f0;
    }
`;

if (!html.includes('/* === Premium Social UI/UX === */')) {
  html = html.replace('</style>', premiumCSS + '\n</style>');
}

// 2. Replace Tab 9: Social Input entirely
const oldSocialInputRegex = /<!-- Tab 9: Social Input -->[\s\S]*?<!-- Tab 10: Social Insight -->/;
const newSocialInput = `<!-- Tab 9: Social Input -->
  <div id="tab-social-input" class="tab-content">
    <div style="background:#fff; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.05); margin-bottom:30px;">
      
      <div class="hero-header">
        <h2>🚀 소셜 콘텐츠 자동 기획</h2>
        <p>AI가 타깃과 채널에 딱 맞는 한 달 치 콘텐츠를 자동으로 기획합니다.</p>
      </div>

      <div style="padding: 20px;">
        
        <!-- Group 1: 브랜드 기본 정보 -->
        <div class="section-card">
          <h3 class="section-title">🏢 브랜드 기본 정보</h3>
          <div class="responsive-grid" style="margin-bottom:15px;">
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
            <textarea id="soc_products" rows="2" placeholder="예: 수제 크래프트 맥주, 4종 시그니처"></textarea>
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <label for="soc_target">핵심 타깃 <span style="color:var(--primary)">*</span></label>
            <input type="text" id="soc_target" placeholder="예: 20대 후반 ~ 30대 직장인, 미식 감도 높음">
          </div>
        </div>

        <!-- Group 2: 캠페인 전략 -->
        <div class="section-card">
          <h3 class="section-title">🎨 캠페인 전략 및 방향성</h3>
          <div class="form-group">
            <label>캠페인 목적 <span style="color:var(--primary)">*</span></label>
            <div class="chip-container">
              <label class="chip-label"><input type="radio" name="soc_goal" value="인지도" checked> 인지도 확보</label>
              <label class="chip-label"><input type="radio" name="soc_goal" value="구매 전환"> 구매 전환</label>
              <label class="chip-label"><input type="radio" name="soc_goal" value="팬덤 형성"> 팬덤 형성</label>
              <label class="chip-label"><input type="radio" name="soc_goal" value="런칭"> 신제품 런칭</label>
            </div>
          </div>
          <div class="form-group">
            <label>브랜드 톤 & 매너 (1~3개 선택)</label>
            <div class="chip-container">
              <label class="chip-label"><input type="checkbox" name="soc_tone" value="친근함"> 친근함</label>
              <label class="chip-label"><input type="checkbox" name="soc_tone" value="전문성"> 전문성</label>
              <label class="chip-label"><input type="checkbox" name="soc_tone" value="유머"> 유머러스</label>
              <label class="chip-label"><input type="checkbox" name="soc_tone" value="감성"> 감성적</label>
              <label class="chip-label"><input type="checkbox" name="soc_tone" value="도발적"> 도발적</label>
              <label class="chip-label"><input type="checkbox" name="soc_tone" value="신뢰"> 신뢰감</label>
              <label class="chip-label"><input type="checkbox" name="soc_tone" value="트렌디"> 트렌디</label>
            </div>
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <label for="soc_competitors">경쟁사 / 벤치마킹 레퍼런스</label>
            <input type="text" id="soc_competitors" placeholder="예: 구스아일랜드, 제주맥주">
          </div>
        </div>

        <!-- Group 3: 채널 설정 -->
        <div class="section-card">
          <h3 class="section-title">📡 플랫폼 및 발행 설정</h3>
          <div class="form-group">
            <label>주력 채널 (다중선택) <span style="color:var(--primary)">*</span></label>
            <div class="chip-container">
              <label class="chip-label"><input type="checkbox" name="soc_channel" value="Instagram" checked> Instagram</label>
              <label class="chip-label"><input type="checkbox" name="soc_channel" value="Reels" checked> Reels</label>
              <label class="chip-label"><input type="checkbox" name="soc_channel" value="TikTok"> TikTok</label>
              <label class="chip-label"><input type="checkbox" name="soc_channel" value="Threads"> Threads</label>
              <label class="chip-label"><input type="checkbox" name="soc_channel" value="YouTube Shorts"> YT Shorts</label>
              <label class="chip-label"><input type="checkbox" name="soc_channel" value="X"> X(Twitter)</label>
              <label class="chip-label"><input type="checkbox" name="soc_channel" value="Naver Blog"> Naver Blog</label>
            </div>
          </div>
          <div class="responsive-grid">
            <div class="form-group">
              <label for="soc_freq">발행 빈도 <span style="color:var(--primary)">*</span></label>
              <select id="soc_freq" style="background-color:#f8fafc;">
                <option value="주 2회">주 2회 (월 8회)</option>
                <option value="주 3회" selected>주 3회 (월 13회)</option>
                <option value="주 5회">주 5회 (월 22회)</option>
                <option value="매일">매일 (월 30회)</option>
              </select>
            </div>
            <div class="form-group" style="display:flex; align-items:flex-end;">
              <button type="button" class="btn" style="width:100%; height:44px;" onclick="alert('기능 준비중입니다.')">📊 트렌드 키워드 가져오기</button>
            </div>
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <input type="text" id="soc_trend_kw" placeholder="가져온 키워드가 여기에 표시됩니다" disabled style="background:#f1f5f9; border-color:#e2e8f0; cursor:not-allowed;">
          </div>
        </div>
        
        <!-- Group 4: AI 설정 -->
        <div style="margin-top:10px; padding: 15px; background: #f8fafc; border-radius: 8px; display:flex; flex-direction:column; gap:10px;">
          <div style="font-size:12px; font-weight:bold; color:#64748b;">🛠 AI 모델 고급 설정 (선택)</div>
          <div style="display:flex; gap:10px;">
            <select id="soc_ai_provider" style="width:120px; font-size:13px; padding:8px;">
              <option value="demo">데모 모드</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="gemini">Gemini</option>
            </select>
            <input type="password" id="soc_api_key" placeholder="API Key 입력 (세션 임시 저장)" style="flex:1; font-size:13px; padding:8px;">
          </div>
        </div>
        
        <div style="margin-top: 30px;">
          <button class="pulse-btn" onclick="SocialApp.startInsight()">
            ✨ 광고주 심층 분석 시작하기
          </button>
        </div>

      </div>
    </div>
  </div>

  <!-- Tab 10: Social Insight -->`;

html = html.replace(oldSocialInputRegex, newSocialInput);
fs.writeFileSync('index.html', html);
console.log('index.html premium UI updated.');
