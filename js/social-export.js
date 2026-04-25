const SocialExport = {
  exportJson() {
    const state = SocialApp.state;
    if(!state || !state.contents || state.contents.length === 0) {
      alert('내보낼 데이터가 없습니다.');
      return;
    }
    
    // Add meta
    const finalData = {
      meta: {
        version: "1.0",
        created_at: new Date().toISOString(),
        tool: "MONQ VISION · Social Content Generator",
        advertiser: state.input.company
      },
      ...state
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(finalData, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    
    const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
    dlAnchorElem.setAttribute("download", `social_brief_${dateStr}.json`);
    dlAnchorElem.click();
  },

  async exportXlsx() {
    const state = SocialApp.state;
    if(!state || !state.contents || state.contents.length === 0) {
      alert('내보낼 데이터가 없습니다.');
      return;
    }
    
    // Check if ExcelJS is loaded
    if (!window.ExcelJS) {
      try {
        const btn = document.querySelector('button[onclick="SocialExport.exportXlsx()"]');
        if(btn) btn.innerText = "⏳ 엑셀 로딩 중...";
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.3.0/exceljs.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
        if(btn) btn.innerText = "📊 엑셀로 (.xlsx)";
      } catch(e) {
        alert('엑셀 라이브러리를 불러오는데 실패했습니다.');
        return;
      }
    }
    
    const wb = new ExcelJS.Workbook();
    
    // Sheet 1: Summary
    const ws1 = wb.addWorksheet('요약(Summary)');
    ws1.columns = [{ header: '항목', key: 'k', width: 20 }, { header: '내용', key: 'v', width: 50 }];
    ws1.addRow({ k: '광고주', v: state.input.company });
    ws1.addRow({ k: '브랜드 한 줄', v: state.insight.tagline });
    ws1.addRow({ k: '캠페인 목적', v: state.input.goal });
    ws1.addRow({ k: '톤 키워드', v: state.insight.tone_keywords.join(', ') });
    ws1.addRow({ k: '총 콘텐츠 수', v: state.contents.length + '편' });
    
    // Sheet 2: Contents
    const ws2 = wb.addWorksheet('콘텐츠 기획안');
    ws2.columns = [
      { header: '발행일시', key: 'date', width: 20 },
      { header: '채널', key: 'channel', width: 15 },
      { header: '포맷', key: 'format', width: 15 },
      { header: '핵심 메시지', key: 'msg', width: 25 },
      { header: '본문 카피', key: 'copy', width: 50 },
      { header: '해시태그', key: 'hash', width: 20 },
      { header: '이미지/영상 제안', key: 'img', width: 40 }
    ];
    
    const sorted = [...state.contents].sort((a,b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
    sorted.forEach(c => {
      ws2.addRow({
        date: new Date(c.scheduled_at).toLocaleString('ko-KR'),
        channel: c.channel,
        format: c.format,
        msg: c.core_message,
        copy: c.copy,
        hash: (c.hashtags||[]).join(' '),
        img: c.image_prompt
      });
    });
    
    // Style headers
    [ws1, ws2].forEach(ws => {
      ws.getRow(1).font = { bold: true };
      ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    });
    ws2.getColumn('copy').alignment = { wrapText: true, vertical: 'top' };
    
    const buffer = await wb.xlsx.writeBuffer();
    const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
    saveAs(new Blob([buffer]), `social_brief_${state.input.company}_${dateStr}.xlsx`);
  },

  importJson(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = JSON.parse(e.target.result);
        if(!data.contents) throw new Error('잘못된 파일 형식입니다.');
        
        SocialApp.state = data;
        SocialApp.saveState();
        
        // UI Update
        if(data.input.company) document.getElementById('soc_company').value = data.input.company;
        
        SocialApp.renderInsight(data.insight);
        SocialApp.renderContent(data.contents);
        SocialApp.renderSchedule(data.contents);
        
        alert('성공적으로 불러왔습니다!');
      } catch (err) {
        alert('파일을 불러오는데 실패했습니다: ' + err.message);
      }
    };
    reader.readAsText(file);
    // reset input
    event.target.value = '';
  },
  
  sendToQuote() {
    const state = SocialApp.state;
    if(!state || !state.contents || state.contents.length === 0) {
      alert('보낼 데이터가 없습니다.');
      return;
    }
    
    const counts = {};
    state.contents.forEach(c => {
      counts[c.channel] = (counts[c.channel] || 0) + 1;
    });
    
    // Add custom items to Quote mode under the 'social' category if it exists, or 'video'
    let targetCat = QUOTE_DATA['social'] ? 'social' : 'video';
    
    if(!window.quoteStates) window.quoteStates = {};
    if(!window.quoteStates[targetCat]) {
      window.quoteStates[targetCat] = JSON.parse(JSON.stringify(QUOTE_DATA[targetCat].sections));
    }
    
    Object.entries(counts).forEach(([channel, count]) => {
      window.quoteStates[targetCat][0].items.push({
        name: `${channel} 콘텐츠 제작 (${count}편)`,
        unit: '식', count: 1, cost: 500000,
        custom: true
      });
    });
    
    alert(`견적서 항목에 ${Object.keys(counts).length}개의 소셜 콘텐츠 항목이 추가되었습니다!\n견적서 모드에서 확인하세요.`);
  }
};

window.SocialExport = SocialExport;
