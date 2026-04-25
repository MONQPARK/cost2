const SocialAI = {
  async call(messages, { provider, apiKey, model }) {
    if (provider === 'demo' || !apiKey) {
      return this.callDemo();
    }
    
    try {
      if (provider === 'openai') {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: model || 'gpt-4o',
            messages: messages,
            response_format: { type: "json_object" }
          })
        });
        const data = await res.json();
        if(!res.ok) throw new Error(data.error?.message || 'OpenAI API Error');
        return data.choices[0].message.content;
      } 
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

  async startInsight() {
    const config = this.collectInput();
    if (!config) return;
    
    document.getElementById('tab-social-insight').innerHTML = '<div style="text-align:center; padding:50px;">⏳ 광고주 분석 중입니다... 잠시만 기다려주세요.</div>';
    switchTab('social-insight', 'social', document.querySelector('#tabs-social button:nth-child(2)'));
    
    try {
      const messages = [
        { role: 'system', content: SocialPrompts.INSIGHT_SYSTEM },
        { role: 'user', content: SocialPrompts.INSIGHT_USER(config.input) }
      ];
      
      const responseText = await SocialAI.call(messages, config);
      const data = JSON.parse(responseText);
      this.state.insight = data;
      this.saveState();
      
      this.renderInsight(this.state.insight);
    } catch(e) {
      document.getElementById('tab-social-insight').innerHTML = `<div style="text-align:center; padding:50px; color:var(--danger);">오류 발생: ${e.message}</div>`;
    }
  },

  renderInsight(insight) {
    const container = document.getElementById('tab-social-insight');
    if(!insight || !insight.personas) {
      container.innerHTML = '<div style="text-align:center; padding:50px;">데이터가 올바르지 않습니다.</div>';
      return;
    }
    
    let personasHtml = insight.personas.map(p => 
      `<li><strong>${p.name}</strong> (${p.age}, ${p.job}) - ${p.motivation}</li>`
    ).join('');
    
    let channelHtml = Object.entries(insight.channel_mix || {}).map(([k,v]) => 
      `<div style="display:flex; justify-content:space-between;"><span>${k}</span><strong>${v}%</strong></div>`
    ).join('');

    container.innerHTML = `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px;">
        <div class="card">
          <h3 style="margin-bottom:10px;">🏷 브랜드 한 줄 정의</h3>
          <p style="font-size:16px; font-weight:bold; color:var(--primary);">"${insight.tagline}"</p>
        </div>
        <div class="card">
          <h3 style="margin-bottom:10px;">🎯 페르소나</h3>
          <ul style="padding-left:20px; line-height:1.6;">${personasHtml}</ul>
        </div>
        <div class="card">
          <h3 style="margin-bottom:10px;">🎨 톤 & 매너 키워드</h3>
          <div style="display:flex; gap:10px;">
            ${insight.tone_keywords.map(k => `<span style="background:var(--bg-gradient); padding:4px 10px; border-radius:4px; font-weight:bold;">#${k}</span>`).join('')}
          </div>
        </div>
        <div class="card">
          <h3 style="margin-bottom:10px;">📡 추천 채널·비율</h3>
          ${channelHtml}
        </div>
      </div>
      <button class="btn" style="width:100%; padding:15px; font-size:18px;" onclick="SocialApp.startContent()">✨ 콘텐츠 기획 시작</button>
    `;
  },

  async startContent() {
    if (!this.state.insight || !this.state.input) {
      alert('광고주 분석 결과가 필요합니다. 먼저 [분석 시작]을 진행해주세요.');
      return;
    }
    
    const config = this.collectInput(); // just to get API key
    if (!config) return;
    
    document.getElementById('content-grid').innerHTML = '<div style="text-align:center; padding:50px; grid-column:1/-1;">⏳ 한 달 치 콘텐츠를 기획 중입니다... (10~20초 소요)</div>';
    switchTab('social-content', 'social', document.querySelector('#tabs-social button:nth-child(3)'));
    
    try {
      const freqMap = {"주 2회":8, "주 3회":13, "주 5회":22, "매일":30};
      const freqNum = freqMap[this.state.input.freq] || 13;
      const today = new Date();
      const startDate = today.toISOString().split('T')[0];
      
      const messages = [
        { role: 'system', content: SocialPrompts.CONTENT_SYSTEM },
        { role: 'user', content: SocialPrompts.CONTENT_USER(this.state.insight, this.state.input, freqNum, 30, startDate) }
      ];
      
      const responseText = await SocialAI.call(messages, config);
      const data = JSON.parse(responseText);
      
      // If demo mode, data might contain full JSON including contents array.
      if (data.contents) {
        this.state.contents = data.contents;
      } else if (Array.isArray(data)) {
        this.state.contents = data;
      } else {
        this.state.contents = [];
      }
      
      // assign ids
      this.state.contents.forEach((c, i) => c.id = 'c' + (i+1).toString().padStart(2, '0'));
      this.saveState();
      
      this.renderContent(this.state.contents);
      this.renderSchedule(this.state.contents);
      
    } catch(e) {
      document.getElementById('content-grid').innerHTML = `<div style="text-align:center; padding:50px; color:var(--danger); grid-column:1/-1;">오류 발생: ${e.message}</div>`;
    }
  },

  renderContent(contents) {
    const grid = document.getElementById('content-grid');
    if(!contents || contents.length === 0) {
      grid.innerHTML = '<div style="text-align:center; padding:50px; grid-column:1/-1;">생성된 콘텐츠가 없습니다.</div>';
      return;
    }
    
    grid.innerHTML = contents.map(c => {
      const dateStr = new Date(c.scheduled_at).toLocaleString('ko-KR', { month:'short', day:'numeric', weekday:'short', hour:'2-digit', minute:'2-digit' });
      return `
        <div class="card" style="border-left:4px solid var(--primary); display:flex; flex-direction:column;">
          <div style="font-size:12px; color:var(--text-light); margin-bottom:10px;">
            <strong>${c.channel}</strong> · ${c.format} · ${dateStr}
          </div>
          <h4 style="margin-bottom:10px; color:var(--secondary);">${c.core_message}</h4>
          <div style="background:#f8fafc; padding:10px; border-radius:6px; font-size:13px; line-height:1.5; white-space:pre-wrap; margin-bottom:10px; flex-grow:1;">${c.copy}</div>
          <div style="margin-bottom:10px;">
            <span style="font-size:12px; color:#3b82f6;">${(c.hashtags||[]).join(' ')}</span>
          </div>
          <div style="font-size:12px; background:#f1f5f9; padding:8px; border-radius:4px; margin-bottom:15px; color:#475569;">
            🎨 <strong>이미지 제안:</strong> ${c.image_prompt}
          </div>
          <div style="display:flex; justify-content:flex-end; gap:5px; border-top:1px solid #e2e8f0; padding-top:10px;">
            <button class="btn" style="padding:4px 8px; font-size:11px; background:white; color:var(--text-main); border:1px solid #cbd5e1;" onclick="SocialApp.regenerateCard('${c.id}')">🔄 재생성</button>
            <button class="btn" style="padding:4px 8px; font-size:11px; background:white; color:var(--danger); border:1px solid #cbd5e1;" onclick="SocialApp.deleteCard('${c.id}')">🗑 삭제</button>
          </div>
        </div>
      `;
    }).join('');
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
    
    const colors = {
      'Instagram': '#E1306C', 'Reels': '#E1306C', 'TikTok': '#000000', 
      'Threads': '#000000', 'X': '#1DA1F2', 'YouTube Shorts': '#FF0000', 
      'Naver Blog': '#03C75A', 'LinkedIn': '#0A66C2'
    };
    
    cal.innerHTML = '<div style="display:flex; flex-direction:column; gap:8px;">' + sorted.map(c => {
      const d = new Date(c.scheduled_at);
      const dateStr = d.toLocaleDateString('ko-KR', {month:'short', day:'numeric', weekday:'short'});
      const timeStr = d.toLocaleTimeString('ko-KR', {hour:'2-digit', minute:'2-digit', hour12:false});
      const color = colors[c.channel] || 'var(--primary)';
      return `
        <div style="display:flex; align-items:center; padding:10px 15px; background:white; border:1px solid #e2e8f0; border-radius:6px; border-left:4px solid ${color};">
          <div style="width:120px; font-weight:bold; color:var(--secondary);">${dateStr} ${timeStr}</div>
          <div style="width:100px; font-size:12px; color:white; background:${color}; text-align:center; padding:3px 0; border-radius:12px; margin-right:15px;">${c.channel}</div>
          <div style="flex-grow:1; font-size:14px;">${c.core_message}</div>
          <div style="font-size:12px; color:var(--text-light);">${c.format}</div>
        </div>
      `;
    }).join('') + '</div>';
  },
  
  saveState() {
    localStorage.setItem('social_state', JSON.stringify(this.state));
  }
};

window.SocialApp = SocialApp;
document.addEventListener('DOMContentLoaded', () => { SocialApp.init(); });
