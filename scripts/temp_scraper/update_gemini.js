const fs = require("fs");
let js = fs.readFileSync("js/social.js", "utf8");

// Add Gemini to SocialAI.call
const geminiCode = `
      else if (provider === "gemini") {
        const geminiModel = model || "gemini-1.5-pro-latest";
        const systemPrompt = messages.find(m => m.role === "system")?.content || "";
        const userPrompt = messages.find(m => m.role === "user")?.content || "";
        
        const reqBody = {
          contents: [{ parts: [{ text: systemPrompt + "\\n\\n" + userPrompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        };
        
        const res = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/\${geminiModel}:generateContent?key=\${apiKey}\`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reqBody)
        });
        const data = await res.json();
        if(!res.ok) throw new Error(data.error?.message || "Gemini API Error");
        return data.candidates[0].content.parts[0].text;
      }
`;

js = js.replace(/else if \(provider === 'anthropic'\) \{[\s\S]*?return data\.content\[0\]\.text;\n      \}/, (match) => match + geminiCode);

// Add fetchTrendKeywords to SocialApp
const trendCode = `
  async fetchTrendKeywords() {
    const config = this.collectInput();
    if (!config) return;
    
    if (config.provider === "demo" || !config.apiKey) {
      alert("트렌드 키워드를 가져오려면 AI 설정(Gemini 등)과 API 키가 필요합니다.");
      return;
    }
    
    const kwInput = document.getElementById("soc_trend_kw");
    kwInput.value = "⏳ 실시간 트렌드 분석 중...";
    
    try {
      const prompt = \`현재 한국 SNS(인스타그램, 유튜브 등)에서 다음 제품/산업군과 관련된 가장 핫한 트렌드 키워드나 밈, 유행어 5개를 쉼표로 구분해서 알려줘. 다른 말은 하지말고 딱 키워드 5개만 출력해.
      회사: \${config.input.company}
      산업군: \${config.input.industry}
      제품: \${config.input.products}\`;
      
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
      
      kwInput.value = result.replace(/[\\[\\]"'\n]/g, "").trim();
    } catch (e) {
      kwInput.value = "";
      alert("키워드 분석 실패: " + e.message);
    }
  },
`;

js = js.replace(/async startInsight\(\) \{/, trendCode + "\n  async startInsight() {");

fs.writeFileSync("js/social.js", js);
console.log("Updated social.js with Gemini and Trend Keywords");
