
var STORE = {
  get: (k) => JSON.parse(localStorage.getItem('monq_'+k) || 'null'),
  set: (k, v) => localStorage.setItem('monq_'+k, JSON.stringify(v)),
  del: (k) => localStorage.removeItem('monq_'+k)
};


const PersonaApp = {

  saveState() {
    STORE.set('persona_state', this.state);
  },
  
  async init() {
    // 1) 카테고리는 무조건 먼저 로드한다 (이게 1단계의 시작점이라 절대 막히면 안 됨)
    try {
      const res = await fetch('data/persona-categories.json');
      const data = await res.json();
      this.renderCategories(data.categories);
    } catch(e) {
      console.error('[PersonaApp] failed to load categories', e);
    }
  
    // 2) API 키 배너
    if (!this.getApiKey()) {
      const banner = document.getElementById('psn_key_banner');
      if(banner) banner.style.display = 'block';
    }
  
    // 3) 저장된 상태 복원 — 이 안 어떤 단계든 실패해도 카테고리 로드는 이미 끝났으므로 안전하다
    try {
      const saved = STORE.get('persona_state');
      if(saved) {
        this.state = saved;
        
        if(this.state.persona && typeof this.renderSheetCard === 'function') {
          this.renderSheetCard(this.state.persona);
          this.nextStep('sheet');
        }
        
        if(this.state.visuals && this.state.visuals.length > 0) {
          const mainVis = this.state.visuals.find(v => v.variant === 'main');
          if(mainVis) {
            const imgEl = document.getElementById('psn_main_img');
            if(imgEl) {
              imgEl.src = mainVis.image_data_url;
              imgEl.style.display = 'block';
            }
          }
        }
        // renderVariantsGrid와 renderContents는 미정의 → 호출 자체 제거
        // 콘텐츠 그리드는 사용자가 5단계에서 다시 "일괄 생성" 누르면 그때 그려진다
      }
    } catch(e) {
      console.warn('[PersonaApp] saved state restore failed', e);
    }
  },

  state: {
    category: { main: '', sub: '', positioning: '', differentiator: '', benchmarks: [] },
    world: { type: '3D', concept_keywords: [], signature_visual: '', backstory_draft: '' },
    persona: null,
    visuals: [],
    contents: []
  },
  
  saveApiKey() {
    const k = document.getElementById('psn_api_key_input').value.trim();
    if (!k) return;
    sessionStorage.setItem('social_api_key', k);
    document.getElementById('psn_key_banner').style.display = 'none';
  },
  
  renderCategories(cats) {
    const grid = document.getElementById('psn_cat_grid');
    if(!grid) return;
    grid.innerHTML = cats.map(c => `
      <div class="cat-card" onclick="PersonaApp.selectCategory('${c.label}', '${c.subcategories[0]}', this)">
        <div class="cat-icon">${c.icon}</div>
        <div class="cat-title">${c.label}</div>
      </div>
    `).join("");
  },
  
  selectCategory(main, sub, el) {
    document.querySelectorAll('.cat-card').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    this.state.category.main = main;
    this.state.category.sub = sub;
    this.updateSidebar();
  },
  
  
  async fillWorldGaps() {
    const name = document.getElementById('psn_name').value;
    const cat = this.state.category.main;
    if(!name || !cat) return alert('이름과 카테고리를 먼저 선택해주세요.');
    
    const btn = document.getElementById('btn_fill_world');
    if(btn) { btn.innerText = "채우는 중..."; btn.disabled = true; }
    
    try {
      const messages = [
        { role: 'system', content: '당신은 AI 페르소나 설정 기획자입니다. 사용자가 입력한 일부 정보를 바탕으로 세계관, 서사, 비주얼 특징을 JSON으로 자동 완성해 주세요. 반환 형식: {"backstory": "...", "signature_visual": "...", "concept_keywords": ["..."]}' },
        { role: 'user', content: `이름: ${name}, 카테고리: ${cat}, 현재 설정된 성격: ${document.getElementById('psn_personality').value}` }
      ];
      const res = await SocialAI.call(messages, { provider: 'gemini', apiKey: this.getApiKey() });
      const data = (function(str){ try{ return JSON.parse(str); } catch(e){ const m=str.match(/\{.*\}|\[.*\]/s); if(m) return JSON.parse(m[0]); throw e; } })(res);
      
      if(data.backstory) document.getElementById('psn_backstory').value = data.backstory;
      if(data.signature_visual) document.getElementById('psn_visual').value = data.signature_visual;
      if(data.concept_keywords) document.getElementById('psn_keywords').value = data.concept_keywords.join(', ');
      
      this.updateSidebar();
    } catch(e) {
      alert('자동 보강 실패: ' + e.message);
    }
    if(btn) { btn.innerText = "🤖 빈 칸 자동 채우기"; btn.disabled = false; }
  },

  updateSidebar() {
    const sCat = document.getElementById('psn_summary_cat');
    const sName = document.getElementById('psn_summary_name');
    const sDesc = document.getElementById('psn_summary_desc');
    
    if(this.state.category.main) {
      sCat.innerText = `[${this.state.category.main} > ${this.state.category.sub}]`;
    }
    
    if(this.state.persona && this.state.persona.name) {
      sName.innerText = this.state.persona.name;
      sDesc.innerText = this.state.persona.tagline || '';
    } else {
      const pos = document.getElementById('psn_pos')?.value;
      if(pos) sDesc.innerText = pos;
    }
  },
  
  nextStep(step) {
    const fullTab = step.startsWith('persona-') ? step : 'persona-' + step;
    const btn = document.querySelector(`#tabs-persona button[data-tab="${fullTab}"]`);
    if (btn) btn.click();
    else console.warn('[PersonaApp] nextStep: button not found for', fullTab);
  },
  
  getApiKey() {
    let k = (sessionStorage.getItem('social_api_key') || localStorage.getItem('monq_api_key'));
    if (document.getElementById('soc_api_key') && document.getElementById('soc_api_key').value) k = document.getElementById('soc_api_key').value;
    if (document.getElementById('psn_api_key_input') && document.getElementById('psn_api_key_input').value) k = document.getElementById('psn_api_key_input').value;
    
    if (k) {
      sessionStorage.setItem('social_api_key', k);
      return k;
    }
    return "AIzaSyC82QBkaq5XUG4xVdTwjHyfCoFCsAAUedU";
  },
  
  renderSheetCard(persona) {
    const el = document.getElementById('psn_sheet_render');
    if (!el) return;
    
    // Convert persona object to a nice HTML card
    el.innerHTML = `
      <div style="background: linear-gradient(135deg, #f8fafc, #f1f5f9); border: 1px solid #e2e8f0; border-radius: 16px; padding: 30px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); color: #1e293b;">
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #7C3AED; padding-bottom: 15px; margin-bottom: 20px;">
          <div>
            <h2 style="margin: 0; font-size: 28px; font-weight: 800; color: #0f172a;">${persona.name || '이름 미상'}</h2>
            <p style="margin: 5px 0 0; font-size: 16px; color: #64748b; font-weight: 500;">${persona.tagline || '태그라인'}</p>
          </div>
          <div style="text-align: right;">
            <span style="display: inline-block; background: #e2e8f0; padding: 4px 10px; border-radius: 20px; font-size: 13px; font-weight: 600; color: #475569;">
              ${persona.age || '?'}세 · ${persona.job || '직업'}
            </span>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div style="background: #fff; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0;">
            <h4 style="margin: 0 0 10px; color: #7C3AED; font-size: 14px;">🌟 외형 및 시그니처 (Visual)</h4>
            <p style="margin: 0; font-size: 14px; line-height: 1.6;">${persona.signature_visual || ''}</p>
          </div>
          <div style="background: #fff; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0;">
            <h4 style="margin: 0 0 10px; color: #EC4899; font-size: 14px;">🧠 성격 및 가치관 (MBTI & Values)</h4>
            <p style="margin: 0; font-size: 14px; line-height: 1.6;">${persona.mbti ? `[${persona.mbti}] ` : ''}${persona.personality || ''}</p>
          </div>
        </div>
        
        <div style="background: #fff; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px; color: #10b981; font-size: 14px;">📚 세계관 및 배경 (Backstory)</h4>
          <p style="margin: 0; font-size: 14px; line-height: 1.6;">${persona.backstory || ''}</p>
        </div>
        
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          ${(persona.concept_keywords || []).map(k => `<span style="background: #f1f5f9; color: #475569; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 600;">#${k}</span>`).join('')}
        </div>
      </div>
    `;
  },

  async generateSheet() {
    const pos = document.getElementById('psn_pos').value || '기본 포지셔닝';
    const diff = document.getElementById('psn_diff').value || '독특한 개성';
    if(!this.state.category.main) {
      this.state.category.main = '기타';
      this.state.category.sub = '크리에이터';
    }
    
    this.state.category.positioning = pos;
    this.state.category.differentiator = diff;
    this.state.category.benchmarks = [document.getElementById('psn_bench').value];
    
    this.state.world.type = document.getElementById('psn_type').value;
    this.state.world.concept_keywords = document.getElementById('psn_keywords').value.split(',').map(s=>s.trim());
    this.state.world.signature_visual = document.getElementById('psn_visual_sig').value;
    this.state.world.backstory_draft = document.getElementById('psn_backstory').value;
    
    document.getElementById('btn_gen_sheet').innerText = "⏳ 생성 중...";
    document.getElementById('btn_gen_sheet').disabled = true;
    
    try {
      const messages = [
        { role: 'system', content: PersonaPrompts.BUILD_SYSTEM },
        { role: 'user', content: PersonaPrompts.BUILD_USER(this.state) }
      ];
      const res = await SocialAI.call(messages, { provider: 'gemini', apiKey: this.getApiKey() });
      this.state.persona = (function(str){ try{ return JSON.parse(str); } catch(e){ const m=str.match(/\{.*\}|\[.*\]/s); if(m) return JSON.parse(m[0]); throw e; } })(res); this.saveState();
      
      this.updateSidebar();
      this.renderSheetCard(this.state.persona);
      this.nextStep('sheet');
    } catch(e) {
      alert('오류: ' + e.message);
    }
    document.getElementById('btn_gen_sheet').innerText = "🤖 Gemini로 캐릭터 시트 자동 완성 ➔";
    document.getElementById('btn_gen_sheet').disabled = false;
  },
  
  async generateMainVisual() {
    if(!this.state.persona) return alert('먼저 캐릭터 시트를 완성해주세요.');
    const prompt = PersonaImage.buildPrompt(this.state.persona, 'main');
    
    document.getElementById('psn_main_img').style.display = 'none';
    document.getElementById('psn_main_loading').style.display = 'block';
    
    try {
      // Use fallback for demonstration to avoid API limits, or try real API
      let imgData = '';
      try {
        const res = await PersonaImage.generate(prompt, this.getApiKey());
        imgData = res[0];
      } catch(e) {
        console.warn('Real image gen failed, using fallback', e);
        const fb = await PersonaImage.generateFallback(prompt);
        imgData = fb[0];
      }
      
      this.state.visuals.push({ variant: 'main', image_data_url: imgData });
      
      
      const imgEl = document.getElementById('psn_main_img');
      imgEl.onload = () => {
        imgEl.style.display = 'block';
        document.getElementById('psn_main_loading').style.display = 'none';
        
        // Update Sidebar preview
        document.getElementById('psn_summary_visual').style.display = 'flex';
        const previewEl = document.getElementById('psn_main_img_preview');
        previewEl.src = imgData;
        previewEl.style.display = 'block';
      };
      imgEl.onerror = () => {
        alert('이미지를 불러오는데 실패했습니다. (Adblock을 꺼주시거나 새로고침 해주세요)');
        document.getElementById('psn_main_loading').style.display = 'none';
      };
      imgEl.src = imgData;

      
    } catch(e) {
      alert('이미지 생성 실패: ' + e.message);
      document.getElementById('psn_main_loading').style.display = 'none';
    }
  },
  
  async generateVariants() {
    if(!this.state.persona) return;
    const variants = ["side", "smile", "serious", "signature_pose", "daily", "event", "content"];
    const grid = document.getElementById('psn_variants_grid');
    grid.innerHTML = '';
    
    for(const v of variants) {
      const card = document.createElement('div');
      card.style.cssText = "background:#f8fafc; border-radius:8px; overflow:hidden; position:relative; aspect-ratio:1/1; display:flex; align-items:center; justify-content:center; color:#94a3b8; font-size:12px;";
      card.innerText = v + '...';
      grid.appendChild(card);
      
      const prompt = PersonaImage.buildPrompt(this.state.persona, v);
      try {
        const fb = await PersonaImage.generateFallback(prompt); // Use fallback for batch to avoid limit
        card.innerHTML = `<img src="${fb[0]}" style="width:100%; height:100%; object-fit:cover;">
                          <div style="position:absolute; bottom:5px; right:5px; background:rgba(0,0,0,0.5); color:#fff; padding:2px 5px; border-radius:4px; font-size:10px;">${v}</div>`;
        this.state.visuals.push({ variant: v, image_data_url: fb[0] });
      } catch(e) {
        card.innerText = '실패';
      }
      // Wait 1 sec to avoid rate limits
      await new Promise(r => setTimeout(r, 1000));
    }
  },
  
  async generateContents() {
    if(!this.state.persona) return alert('먼저 캐릭터 시트를 완성해주세요.');
    document.getElementById('btn_gen_content').innerText = "⏳ 생성 중...";
    document.getElementById('btn_gen_content').disabled = true;
    
    try {
      const messages = [
        { role: 'system', content: PersonaPrompts.CONTENT_SYSTEM },
        { role: 'user', content: PersonaPrompts.CONTENT_USER(this.state.persona) }
      ];
      const res = await SocialAI.call(messages, { provider: 'gemini', apiKey: this.getApiKey() });
      let parsed = (function(str){ try{ return JSON.parse(str); } catch(e){ const m=str.match(/\{.*\}|\[.*\]/s); if(m) return JSON.parse(m[0]); throw e; } })(res);
      this.state.contents = Array.isArray(parsed) ? parsed : (parsed.contents || []);
      
      const list = document.getElementById('psn_content_list');
      list.innerHTML = this.state.contents.map(c => `
        <div style="background:#fff; border-radius:12px; padding:20px; box-shadow:0 2px 4px rgba(0,0,0,0.05); display:flex; gap:20px;">
          <div style="flex:1;">
            <div style="font-weight:bold; color:#7C3AED; margin-bottom:5px;">${c.platform} · ${c.format}</div>
            <h4 style="margin:0 0 10px 0; font-size:18px;">${c.title}</h4>
            ${c.hook ? `<div style="color:#ef4444; font-weight:bold; margin-bottom:10px;">🎬 ${c.hook}</div>` : ''}
            <div style="white-space:pre-wrap; font-size:14px; color:#334155; line-height:1.6; margin-bottom:10px;">${c.script_or_copy}</div>
            ${c.music_or_trend ? `<div style="font-size:12px; color:#059669; margin-bottom:5px;">🎵 ${c.music_or_trend}</div>` : ''}
            <div style="font-size:12px; color:#64748b;">🎨 ${c.visual_concept}</div>
          </div>
          <div style="width:150px; background:#f1f5f9; border-radius:8px; display:flex; align-items:center; justify-content:center; text-align:center; padding:10px; cursor:pointer;" onclick="alert('이미지 생성 프롬프트:\n${c.image_prompt}')">
             🖼<br>비주얼 생성
          </div>
        </div>
      `).join('');
      
    } catch(e) {
      alert('오류: ' + e.message);
    }
    document.getElementById('btn_gen_content').innerText = "📝 첫 주 콘텐츠 일괄 생성";
    document.getElementById('btn_gen_content').disabled = false;
  },
  
  exportPersona() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.state, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = "persona_brief.json";
    a.click();
  },
  
  sendToSocial() {
    alert("소셜 모드로 이동하여 페르소나 정보를 주입합니다. (연동 준비중)");
    window.switchMode('social');
  }
};
window.PersonaApp = PersonaApp;
document.addEventListener('DOMContentLoaded', () => PersonaApp.init());
