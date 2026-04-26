const fs = require('fs');

// Fix social.js
let social = fs.readFileSync('js/social.js', 'utf8');

// Sync API Key
social = social.replace(/const apiKey = document\.getElementById\('soc_api_key'\)\.value;/, `let apiKey = document.getElementById('soc_api_key').value;
    if (!apiKey) apiKey = sessionStorage.getItem('social_api_key');
    if (apiKey) {
      document.getElementById('soc_api_key').value = apiKey;
      sessionStorage.setItem('social_api_key', apiKey);
    }
`);

// Same for generate
social = social.replace(/if \(config\.provider === "demo" \|\| !config\.apiKey\) \{/, `
    if (!config.apiKey && sessionStorage.getItem('social_api_key')) {
      config.apiKey = sessionStorage.getItem('social_api_key');
    }
    if (config.provider === "demo" || !config.apiKey) {`);

// Make JSON robust
social = social.replace(/JSON\.parse\(insightRes\)/, `(function(str){ try{ return JSON.parse(str); } catch(e){ const m=str.match(/\\{.*\\}|\\[.*\\]/s); if(m) return JSON.parse(m[0]); throw e; } })(insightRes)`);
social = social.replace(/JSON\.parse\(contentRes\)/, `(function(str){ try{ return JSON.parse(str); } catch(e){ const m=str.match(/\\{.*\\}|\\[.*\\]/s); if(m) return JSON.parse(m[0]); throw e; } })(contentRes)`);
social = social.replace(/JSON\.parse\(regenRes\)/, `(function(str){ try{ return JSON.parse(str); } catch(e){ const m=str.match(/\\{.*\\}|\\[.*\\]/s); if(m) return JSON.parse(m[0]); throw e; } })(regenRes)`);

fs.writeFileSync('js/social.js', social);

// Fix persona.js
let persona = fs.readFileSync('js/persona.js', 'utf8');

persona = persona.replace(/getApiKey\(\) \{[\s\S]*?\},/, `getApiKey() {
    let k = sessionStorage.getItem('social_api_key');
    if (document.getElementById('soc_api_key') && document.getElementById('soc_api_key').value) k = document.getElementById('soc_api_key').value;
    if (document.getElementById('psn_api_key_input') && document.getElementById('psn_api_key_input').value) k = document.getElementById('psn_api_key_input').value;
    
    if (k) {
      sessionStorage.setItem('social_api_key', k);
      return k;
    }
    alert("Gemini API 키가 필요합니다. 카테고리 탭이나 소셜콘텐츠 탭에서 입력해주세요.");
    return null;
  },`);

persona = persona.replace(/JSON\.parse\(res\)/g, `(function(str){ try{ return JSON.parse(str); } catch(e){ const m=str.match(/\\{.*\\}|\\[.*\\]/s); if(m) return JSON.parse(m[0]); throw e; } })(res)`);

fs.writeFileSync('js/persona.js', persona);

console.log("Safe API key sync and robust parse applied.");
