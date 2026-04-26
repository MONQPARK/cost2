
const SocialAI = {
  updateDebug(type, val, raw="") {
    if(!document.getElementById('soc_debug_toggle')?.checked) return;
    const el = document.getElementById('dbg_'+type);
    if(el) el.innerText = val;
    if(raw && document.getElementById('dbg_raw')) {
      document.getElementById('dbg_raw').innerText = "\n--- Raw Text ---\n" + raw;
    }
  },

  async call(messages, { provider, apiKey, model }) {
    if (provider === 'demo' || !apiKey) {
      return this.callDemo();
    }
    
    const reqStartTime = Date.now();
    this.updateDebug('provider', `${provider} · ${model || (provider==='gemini'?'gemini-2.5-flash':'default')}`);
    this.updateDebug('req', `${new Date().toLocaleTimeString()} · Req Start`);
    this.updateDebug('res', '-');
    this.updateDebug('parse', '-');
    this.updateDebug('err', '(없음)');
    
    try {
      if (provider === 'gemini') {
        const geminiModel = model || "gemini-2.5-flash";
        const systemPrompt = messages.find(m => m.role === "system")?.content || "";
        const userPrompt = messages.find(m => m.role === "user")?.content || "";
        
        const reqBody = {
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.85,
            topP: 0.95,
            maxOutputTokens: 8192
          },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }
          ]
        };
        
        const reqStr = JSON.stringify(reqBody);
        this.updateDebug('req', `${new Date().toLocaleTimeString()} · ${(reqStr.length/1024).toFixed(1)}KB`);
        
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: reqStr
        });
        const data = await res.json();
        const duration = Date.now() - reqStartTime;
        
        if (!res.ok) {
          throw new Error(data.error?.message || `Gemini ${res.status}`);
        }
        if (!data.candidates || !data.candidates[0]) {
          throw new Error("Gemini 응답이 비어있음 (safety block 가능성)");
        }
        
        let text = data.candidates[0].content.parts[0].text;
        
        this.updateDebug('res', `${res.status} · ${duration}ms · ${(text.length/1024).toFixed(1)}KB`);
        
        // 마크다운 코드펜스 제거
        text = text.replace(/^\`\`(?:json)?\s*/i, "").replace(/\s*\`\`\s*$/i, "").trim();
        
        // JSON 파싱 검증용 (내부에서 에러나면 캐치하기 위함)
        try {
          JSON.parse(text);
          this.updateDebug('parse', '✅ ok');
        } catch(e) {
          this.updateDebug('parse', '❌ failed', text);
          // throw e; // Let the caller handle or just return the text
        }
        
        return text;
      }
      // ... keep existing openai/anthropic ...

      else if (provider === 'anthropic') {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
          body: JSON.stringify({
            model: model || 'claude-3-opus-20240229',
            max_tokens: 4096,
            system: messages.find(m => m.role === 'system')?.content || '',
            messages: messages.filter(m => m.role !== 'system')
          })
        });
        const data = await res.json();
        if(!res.ok) throw new Error(data.error?.message || 'Anthropic API Error');
        return data.content[0].text;
      }
      

    } catch (e) {
      console.error(e);
      alert('AI 요청 중 오류가 발생했습니다: ' + e.message + '\n데모 모드로 전환하여 응답합니다.');
      return this.callDemo();
    }
  },
  
  async callDemo() {
    // Artificial delay
    await new Promise(r => setTimeout(r, 1500));
    try {
      const res = await fetch('./data/social-templates.json');
      const data = await res.json();
      return JSON.stringify(data);
    } catch(e) {
      return JSON.stringify({ error: 'Demo data not found' });
    }
  }
};

const SocialApp = {

  toggleDebug(isOn) {
    document.getElementById('soc_debug_panel').style.display = isOn ? 'block' : 'none';
  },

  async verifyApiKey() {
    const apiKey = document.getElementById('soc_api_key').value;
    const statusEl = document.getElementById('soc_key_status');
    if(!apiKey) {
      statusEl.innerHTML = '<span style="color:#ef4444;">키를 입력하세요</span>';
      return;
    }
    statusEl.innerHTML = '⏳ 점검 중...';
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      if (!res.ok) {
        const err = await res.json();
        statusEl.innerHTML = `<span style="color:#ef4444;">❌ ${err.error?.message || "Invalid key"}</span>`;
        return;
      }
      const data = await res.json();
      const has25 = data.models?.some(m => m.name.includes("gemini-2.5-flash"));
      statusEl.innerHTML = `<span style="color:#10b981;">✅ OK · ${has25 ? "gemini-2.5-flash 사용 가능" : "2.5-flash 미지원"}</span>`;
    } catch (e) {
      statusEl.innerHTML = `<span style="color:#ef4444;">❌ ${e.message}</span>`;
    }
  },

  state: {
    input: null,
    insight: null,
    contents: [],
    scheduleSummary: {}
  },
  
  init() {
    const savedKey = sessionStorage.getItem('social_api_key');
    if (savedKey) document.getElementById('soc_api_key').value = savedKey;
    
    // Auto-load state if available
    const savedState = localStorage.getItem('social_state');
    if (savedState) {
      try {
        this.state = JSON.parse(savedState);
        if (this.state.insight) {
          this.renderInsight(this.state.insight);
        }
        if (this.state.contents && this.state.contents.length > 0) {
          this.renderContent(this.state.contents);
          this.renderSchedule(this.state.contents);
        }
      } catch(e) { console.error('Failed to parse saved state', e); }
    }
  },

  
  collectInput() {
    const company = document.getElementById('soc_company').value;
    const industry = document.getElementById('soc_industry').value;
    const products = document.getElementById('soc_products').value;
    const target = document.getElementById('soc_target').value;
    const goal = document.querySelector('input[name="soc_goal"]:checked')?.value;
    
    const tones = Array.from(document.querySelectorAll('input[name="soc_tone"]:checked')).map(el => el.value);
    const channels = Array.from(document.querySelectorAll('input[name="soc_channel"]:checked')).map(el => el.value);
    
    const freq = document.getElementById('soc_freq').value;
    const trend_kw = document.getElementById('soc_trend_kw').value.split(',').map(s=>s.trim()).filter(s=>s);
    
    if(!company || !products || !target) {
      alert('회사명, 제품/서비스, 타깃은 필수 입력 항목입니다.');
      return null;
    }
    
    this.state.input = {
      company, industry, products, target, goal, tone: tones, channels, freq, trend_keywords: trend_kw,
      competitors: document.getElementById('soc_competitors').value
    };
    
    const apiKey = document.getElementById('soc_api_key').value;
    const provider = document.getElementById('soc_ai_provider').value;
    if(apiKey) sessionStorage.setItem('social_api_key', apiKey);
    
    return { input: this.state.input, provider, apiKey };
  },


  
  async fetchTrendKeywords() {
    const config = this.collectInput();
    if (!config) return;
    if (config.provider === 'demo' || !config.apiKey) { alert('API 키가 필요합니다.'); return; }
    const kwInput = document.getElementById("soc_trend_kw");
    kwInput.value = "⏳ 실시간 트렌드 분석 중...";
    
    try {
      const prompt = `현재 한국 SNS(인스타그램, 유튜브 등)에서 다음 제품/산업군과 관련된 가장 핫한 트렌드 키워드나 밈, 유행어 5개를 쉼표로 구분해서 알려줘. 다른 말은 하지말고 딱 키워드 5개만 출력해.
      회사: ${config.input.company}
      산업군: ${config.input.industry}
      제품: ${config.input.products}`;
      
      const messages = [{ role: "user", content: prompt }];
      // Use text format for this specific request if possible, but our call() defaults to JSON format.
      // To bypass JSON format requirement temporarily for trend:
      config.model = "gemini-1.5-flash-latest"; // faster for keywords
      let result = await SocialAI.call(messages, config);
      
      // Since response_format is JSON object in openai/gemini (application/json), it might return JSON.
      try { 
        const parsed = JSON.parse(result);
        if (parsed.keywords) result = parsed.keywords.join(", ");
        else if (Array.isArray(parsed)) result = parsed.join(", ");
      } catch(e) {}
      
      kwInput.value = result.replace(/[\[\]"'\n]/g, "").trim();
    } catch (e) {
      kwInput.value = "";
      alert("키워드 분석 실패: " + e.message);
    }
  },

  
  async startFullGeneration() {
    const config = this.collectInput();
    if (!config) return;

    if (config.provider === "demo" || !config.apiKey) {
      alert("AI 모델 및 키 설정이 필요합니다. (Gemini 2.5 권장)");
      return;
    }

    const btn = document.getElementById('soc_generate_btn');
    const progContainer = document.getElementById('soc_progress_container');
    const progText = document.getElementById('soc_progress_text');
    const progBar = document.getElementById('soc_progress_bar');

    btn.disabled = true;
    progContainer.style.display = "block";
    
    try {
      // Step 1: Insight
      progText.innerText = "[●●●●●○○○○○] 광고주 분석 중...";
      progBar.style.width = "30%";
      
      const insightMessages = [
        { role: 'system', content: SocialPrompts.INSIGHT_SYSTEM },
        { role: 'user', content: SocialPrompts.INSIGHT_USER(config.input) }
      ];
      const insightRes = await SocialAI.call(insightMessages, config);
      this.state.insight = JSON.parse(insightRes);
      
      // Step 2: Content
      progText.innerText = "[●●●●●●●●●○] 콘텐츠 기획 중... (약 15초 소요)";
      progBar.style.width = "70%";
      
      // For startDate, just use tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const startDate = tomorrow.toISOString().split('T')[0];
      
      const contentMessages = [
        { role: 'system', content: SocialPrompts.CONTENT_SYSTEM },
        { role: 'user', content: SocialPrompts.CONTENT_USER(this.state.insight, config.input, config.input.freq, 30, startDate) }
      ];
      
      const contentRes = await SocialAI.call(contentMessages, config);
      const parsedContent = JSON.parse(contentRes);
      
      // Assign IDs if missing
      this.state.contents = parsedContent.map((c, i) => ({ ...c, id: 'c_' + Date.now() + '_' + i }));
      
      this.saveState();
      
      progText.innerText = `[●●●●●●●●●●] ✅ 완료! ${this.state.contents.length}개 콘텐츠 생성됨.`;
      progBar.style.width = "100%";
      
      setTimeout(() => {
        window.switchTab('social-content', 'social');
        this.renderContent();
        this.renderSchedule();
        btn.disabled = false;
        progContainer.style.display = "none";
        progBar.style.width = "0%";
      }, 1000);
      
    } catch (e) {
      console.error(e);
      alert('생성 중 오류 발생: ' + e.message);
      btn.disabled = false;
      progContainer.style.display = "none";
      progBar.style.width = "0%";
    }
  },


  renderContent(contents) {
    const grid = document.getElementById('content-grid');
    if(!contents || contents.length === 0) {
      grid.innerHTML = '<div style="text-align:center; padding:50px; grid-column:1/-1;">생성된 콘텐츠가 없습니다.</div>';
      return;
    }
    
    
    grid.innerHTML = contents.map(c => {
      const dateStr = new Date(c.scheduled_at).toLocaleString("ko-KR", { month:"short", day:"numeric", weekday:"short", hour:"2-digit", minute:"2-digit" });
      const avatarColors = {
        "Instagram": "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
        "Reels": "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
        "YouTube Shorts": "linear-gradient(135deg, #FF0000, #990000)",
        "TikTok": "linear-gradient(135deg, #00f2fe, #4facfe, #000000)",
        "X": "linear-gradient(135deg, #1DA1F2, #1a8cd8)",
        "Threads": "linear-gradient(135deg, #000000, #333333)",
        "Naver Blog": "linear-gradient(135deg, #03C75A, #029b46)",
        "LinkedIn": "linear-gradient(135deg, #0A66C2, #084e96)"
      };
      const bg = avatarColors[c.channel] || "linear-gradient(135deg, #64748b, #475569)";
      const shortCh = c.channel.substring(0,2).toUpperCase();
      
      return `
        <div class="post-card">
          <div class="post-header">
            <div class="post-avatar" style="background:${bg}; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">${shortCh}</div>
            <div class="post-channel-info">
              <span class="post-channel-name">${c.channel}</span>
              <span class="post-format">${c.format} · ${dateStr}</span>
            </div>
          </div>
          <div style="padding:20px; flex-grow:1; display:flex; flex-direction:column;">
            <h4 style="margin:0 0 15px 0; font-size:16px; color:#0f172a; line-height:1.5;">${c.core_message}</h4>
            <div style="background:#f8fafc; padding:15px; border-radius:10px; font-size:13px; line-height:1.6; color:#334155; white-space:pre-wrap; margin-bottom:15px; flex-grow:1; border:1px solid #e2e8f0;">${c.copy}</div>
            <div style="margin-bottom:15px; display:flex; flex-wrap:wrap; gap:6px;">
              ${(c.hashtags||[]).map(h => `<span style="color:#0284c7; font-size:13px; font-weight:600; background:#e0f2fe; padding:2px 8px; border-radius:10px;">${h}</span>`).join("")}
            </div>
            <div style="font-size:13px; background:#f0fdf4; padding:12px; border-radius:8px; color:#166534; display:flex; gap:10px; align-items:flex-start; border: 1px solid #dcfce7;">
              <span style="font-size:18px;">📸</span>
              <span style="line-height:1.5; font-weight:500;">${c.image_prompt}</span>
            </div>
          </div>
          <div style="display:flex; border-top:1px solid #e2e8f0; background:#f8fafc;">
            <button style="flex:1; padding:15px; background:none; border:none; border-right:1px solid #e2e8f0; cursor:pointer; color:#475569; font-size:13px; font-weight:700; transition:all 0.2s;" onmouseover="this.style.color='var(--primary)'; this.style.background='#f1f5f9'" onmouseout="this.style.color='#475569'; this.style.background='none'" onclick="SocialApp.regenerateCard('${c.id}')">🔄 AI 내용 수정</button>
            <button style="padding:15px 20px; background:none; border:none; cursor:pointer; color:#ef4444; font-size:13px; transition:all 0.2s;" onmouseover="this.style.background='#fef2f2'" onmouseout="this.style.background='none'" onclick="SocialApp.deleteCard('${c.id}')">🗑</button>
          </div>
        </div>
      `;
    }).join("");

  },

  deleteCard(cardId) {
    if(confirm('이 카드를 삭제하시겠습니까?')) {
      this.state.contents = this.state.contents.filter(c => c.id !== cardId);
      this.saveState();
      this.renderContent(this.state.contents);
      this.renderSchedule(this.state.contents);
    }
  },

  async regenerateCard(cardId) {
    const feedback = prompt('수정 피드백을 입력해주세요 (예: 더 유머러스하게 바꿔줘)');
    if(!feedback) return;
    
    const card = this.state.contents.find(c => c.id === cardId);
    if(!card) return;
    
    const config = this.collectInput();
    if (!config) return;
    
    try {
      const messages = [
        { role: 'system', content: '당신은 카피라이터입니다. 피드백을 반영해 JSON 하나만 반환하세요.' },
        { role: 'user', content: SocialPrompts.REGEN_USER(card, feedback) }
      ];
      const responseText = await SocialAI.call(messages, config);
      const newData = JSON.parse(responseText);
      
      const idx = this.state.contents.findIndex(c => c.id === cardId);
      this.state.contents[idx] = { ...this.state.contents[idx], ...newData, id: cardId, scheduled_at: card.scheduled_at };
      this.saveState();
      this.renderContent(this.state.contents);
    } catch(e) {
      alert('재생성 실패: ' + e.message);
    }
  },

  renderSchedule(contents) {
    const cal = document.getElementById('schedule-calendar');
    if(!contents || contents.length === 0) {
      cal.innerHTML = '<div style="text-align:center; padding:50px;">데이터가 없습니다.</div>';
      return;
    }
    
    // Simple chronological list view for schedule (A true calendar view would require complex CSS grid)
    
    const sorted = [...contents].sort((a,b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
    
    cal.innerHTML = '<div class="timeline">' + sorted.map(c => {
      const d = new Date(c.scheduled_at);
      const dateStr = d.toLocaleDateString("ko-KR", {month:"short", day:"numeric", weekday:"short"});
      const timeStr = d.toLocaleTimeString("ko-KR", {hour:"2-digit", minute:"2-digit", hour12:false});
      
      const colors = {
        "Instagram": "#E1306C", "Reels": "#E1306C", "TikTok": "#000000", 
        "Threads": "#000000", "X": "#1DA1F2", "YouTube Shorts": "#FF0000", 
        "Naver Blog": "#03C75A", "LinkedIn": "#0A66C2"
      };
      const color = colors[c.channel] || "var(--primary)";
      
      return `
        <div class="timeline-item">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:15px;">
            <div style="flex:1; min-width:200px;">
              <div style="font-weight:800; font-size:16px; color:#1e293b; margin-bottom:6px;">${dateStr} <span style="color:#64748b; font-weight:500; margin-left:5px;">${timeStr}</span></div>
              <div style="font-size:15px; color:#334155; line-height:1.5;">${c.core_message}</div>
            </div>
            <div style="display:flex; flex-direction:column; align-items:flex-end;">
              <span style="background:${color}; color:white; font-size:12px; font-weight:800; padding:4px 12px; border-radius:12px; margin-bottom:6px; box-shadow:0 2px 6px rgba(0,0,0,0.2);">${c.channel}</span>
              <span style="font-size:12px; color:#64748b; font-weight:700; text-transform:uppercase; background:#f1f5f9; padding:2px 8px; border-radius:6px;">${c.format}</span>
            </div>
          </div>
        </div>
      `;
    }).join("") + '</div>';

  },
  
  saveState() {
    localStorage.setItem('social_state', JSON.stringify(this.state));
  }
};

window.SocialApp = SocialApp;
document.addEventListener('DOMContentLoaded', () => { SocialApp.init(); });
