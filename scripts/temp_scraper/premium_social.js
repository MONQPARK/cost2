const fs = require("fs");
let js = fs.readFileSync("js/social.js", "utf8");

// Update renderInsight
const newInsight = `
    let personasHtml = insight.personas.map(p => 
      \`<li style="margin-bottom:10px; background:#f8fafc; padding:15px; border-radius:12px; border:1px solid #e2e8f0;">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:5px;">
          <span style="font-size:20px;">👤</span>
          <strong style="color:var(--primary); font-size:16px;">\${p.name}</strong> 
          <span style="font-size:13px; color:#64748b; background:#e2e8f0; padding:2px 8px; border-radius:10px;">\${p.age}, \${p.job}</span>
        </div>
        <div style="font-size:14px; color:#334155; line-height:1.5; padding-left:28px;">\${p.motivation}</div>
      </li>\`
    ).join("");
    
    let channelHtml = Object.entries(insight.channel_mix || {}).map(([k,v]) => 
      \`<div style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid #f1f5f9;">
        <span style="font-weight:600; color:#475569; display:flex; align-items:center; gap:8px;"><span style="color:var(--primary); font-size:10px;">●</span> \${k}</span>
        <strong style="color:var(--secondary); background:#e0e7ff; padding:4px 12px; border-radius:12px; font-size:14px;">\${v}%</strong>
      </div>\`
    ).join("");

    container.innerHTML = \`
      <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: white; padding: 50px 30px; border-radius: 16px; text-align: center; margin-bottom: 30px; position:relative; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.15);">
        <div style="position:absolute; top:-30px; left:-10px; font-size:160px; font-family:serif; opacity:0.05; line-height:1;">"</div>
        <div style="font-size:13px; font-weight:800; color:#94a3b8; margin-bottom:15px; text-transform:uppercase; letter-spacing:2px;">Brand Tagline</div>
        <h2 style="margin:0; font-size:26px; font-weight:800; line-height:1.5; color:#f8fafc; text-shadow: 0 2px 10px rgba(0,0,0,0.3);">\${insight.tagline}</h2>
        <div style="position:absolute; bottom:-70px; right:-10px; font-size:160px; font-family:serif; opacity:0.05; line-height:1;">"</div>
      </div>
      
      <div class="responsive-grid" style="margin-bottom:30px;">
        <div class="section-card" style="margin-bottom:0;">
          <h3 class="section-title">🎯 핵심 페르소나</h3>
          <ul style="list-style:none; padding:0; margin:0;">\${personasHtml}</ul>
        </div>
        <div style="display:flex; flex-direction:column; gap:15px;">
          <div class="section-card" style="margin-bottom:0; flex:1;">
            <h3 class="section-title">🎨 톤 & 매너 키워드</h3>
            <div class="chip-container">
              \${insight.tone_keywords.map(k => \`<span style="background:linear-gradient(135deg, #fef08a 0%, #fde047 100%); color:#854d0e; padding:8px 16px; border-radius:20px; font-weight:800; font-size:13px; box-shadow:0 4px 10px rgba(253, 224, 71, 0.3);">#\${k}</span>\`).join("")}
            </div>
          </div>
          <div class="section-card" style="margin-bottom:0; flex:1;">
            <h3 class="section-title">📡 추천 플랫폼 믹스</h3>
            \${channelHtml}
          </div>
        </div>
      </div>
      <button class="pulse-btn" onclick="SocialApp.startContent()">
        ✨ 브랜드 맞춤 한 달 치 콘텐츠 생성하기
      </button>
    \`;
`;
js = js.replace(/let personasHtml = insight\.personas[\s\S]*?✨ 콘텐츠 기획 시작<\/button>\n\s+`;/m, newInsight);

// Update renderContent
const newContent = `
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
      
      return \`
        <div class="post-card">
          <div class="post-header">
            <div class="post-avatar" style="background:\${bg}; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">\${shortCh}</div>
            <div class="post-channel-info">
              <span class="post-channel-name">\${c.channel}</span>
              <span class="post-format">\${c.format} · \${dateStr}</span>
            </div>
          </div>
          <div style="padding:20px; flex-grow:1; display:flex; flex-direction:column;">
            <h4 style="margin:0 0 15px 0; font-size:16px; color:#0f172a; line-height:1.5;">\${c.core_message}</h4>
            <div style="background:#f8fafc; padding:15px; border-radius:10px; font-size:13px; line-height:1.6; color:#334155; white-space:pre-wrap; margin-bottom:15px; flex-grow:1; border:1px solid #e2e8f0;">\${c.copy}</div>
            <div style="margin-bottom:15px; display:flex; flex-wrap:wrap; gap:6px;">
              \${(c.hashtags||[]).map(h => \`<span style="color:#0284c7; font-size:13px; font-weight:600; background:#e0f2fe; padding:2px 8px; border-radius:10px;">\${h}</span>\`).join("")}
            </div>
            <div style="font-size:13px; background:#f0fdf4; padding:12px; border-radius:8px; color:#166534; display:flex; gap:10px; align-items:flex-start; border: 1px solid #dcfce7;">
              <span style="font-size:18px;">📸</span>
              <span style="line-height:1.5; font-weight:500;">\${c.image_prompt}</span>
            </div>
          </div>
          <div style="display:flex; border-top:1px solid #e2e8f0; background:#f8fafc;">
            <button style="flex:1; padding:15px; background:none; border:none; border-right:1px solid #e2e8f0; cursor:pointer; color:#475569; font-size:13px; font-weight:700; transition:all 0.2s;" onmouseover="this.style.color=\`var(--primary)\`; this.style.background=\`#f1f5f9\`" onmouseout="this.style.color=\`#475569\`; this.style.background=\`none\`" onclick="SocialApp.regenerateCard('\${c.id}')">🔄 AI 내용 수정</button>
            <button style="padding:15px 20px; background:none; border:none; cursor:pointer; color:#ef4444; font-size:13px; transition:all 0.2s;" onmouseover="this.style.background=\`#fef2f2\`" onmouseout="this.style.background=\`none\`" onclick="SocialApp.deleteCard('\${c.id}')">🗑</button>
          </div>
        </div>
      \`;
    }).join("");
`;
js = js.replace(/grid\.innerHTML = contents\.map[\s\S]*?\}\)\.join\(\'\'\);/m, newContent);

// Update renderSchedule
const newSchedule = `
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
      
      return \`
        <div class="timeline-item">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:15px;">
            <div style="flex:1; min-width:200px;">
              <div style="font-weight:800; font-size:16px; color:#1e293b; margin-bottom:6px;">\${dateStr} <span style="color:#64748b; font-weight:500; margin-left:5px;">\${timeStr}</span></div>
              <div style="font-size:15px; color:#334155; line-height:1.5;">\${c.core_message}</div>
            </div>
            <div style="display:flex; flex-direction:column; align-items:flex-end;">
              <span style="background:\${color}; color:white; font-size:12px; font-weight:800; padding:4px 12px; border-radius:12px; margin-bottom:6px; box-shadow:0 2px 6px rgba(0,0,0,0.2);">\${c.channel}</span>
              <span style="font-size:12px; color:#64748b; font-weight:700; text-transform:uppercase; background:#f1f5f9; padding:2px 8px; border-radius:6px;">\${c.format}</span>
            </div>
          </div>
        </div>
      \`;
    }).join("") + '</div>';
`;
js = js.replace(/const sorted = \[\.\.\.contents\][\s\S]*?\}\)\.join\(\'\'\) \+ \'<\/div>\';/m, newSchedule);

fs.writeFileSync("js/social.js", js);
console.log("Premium UI for social.js updated.");
