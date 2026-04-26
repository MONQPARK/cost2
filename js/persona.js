
const PersonaApp = {
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

  async init() {
    if (!this.getApiKey()) {
      const banner = document.getElementById('psn_key_banner');
      if(banner) banner.style.display = 'block';
    }
    try {
      const res = await fetch('data/persona-categories.json');
      const data = await res.json();
      this.renderCategories(data.categories);
    } catch(e) { console.error('Failed to load categories', e); }
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
    document.querySelector(`#tabs-persona button[onclick*="'${step}'"]`)?.click();
  },
  
  getApiKey() {
    return sessionStorage.getItem('social_api_key') || '';
  },
  
  async generateSheet() {
    const pos = document.getElementById('psn_pos').value;
    const diff = document.getElementById('psn_diff').value;
    if(!this.state.category.main || !pos || !diff) {
      alert('카테고리, 세부 포지셔닝, 차별화 한 줄을 모두 입력해주세요.');
      return;
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
      this.state.persona = JSON.parse(res);
      
      this.updateSidebar();
      document.getElementById('psn_sheet_render').innerText = JSON.stringify(this.state.persona, null, 2);
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
      imgEl.src = imgData;
      imgEl.style.display = 'block';
      document.getElementById('psn_main_loading').style.display = 'none';
      
      // Update Sidebar preview
      document.getElementById('psn_summary_visual').style.display = 'flex';
      const previewEl = document.getElementById('psn_main_img_preview');
      previewEl.src = imgData;
      previewEl.style.display = 'block';
      
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
      this.state.contents = JSON.parse(res);
      
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
