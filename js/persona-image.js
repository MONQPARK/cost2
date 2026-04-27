const PersonaImage = {
  async generate(prompt, apiKey, count = 1) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`;
    const reqBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ["IMAGE"]
      }
    };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reqBody)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Image gen error");
    const imageParts = data.candidates[0].content.parts.filter(p => p.inlineData);
    return imageParts.map(p => `data:${p.inlineData.mimeType};base64,${p.inlineData.data}`);
  },
  
  // Pollinations.ai 폴백 (무료, 무인증)
  async generateFallback(prompt) {
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true`;
    return [url];
  },
  
  // 스타일 프리셋
  buildPrompt(persona, variant = "main") {
    const base = `${persona.tagline}, ${persona.signature_visual}, ${(persona.concept_keywords || []).join(", ")}`;
    const styleMap = {
      "3D": "Pixar-style 3D character render, soft cinematic lighting, octane render",
      "실사 인간": "Photorealistic portrait, 85mm f/1.4, soft window light, editorial fashion photography",
      "일러스트 캐릭터": "Korean webtoon illustration style, clean line art, vibrant colors",
      "픽셀": "16-bit pixel art character, retro game aesthetic, side view",
      "미니어처": "Tilt-shift miniature photography, diorama style, macro lens"
    };
    const style = styleMap[persona.type] || styleMap["3D"];
    
    const variantMap = {
      "main": "front facing portrait, neutral expression, signature pose",
      "side": "side profile view, looking forward",
      "smile": "warm smile, eye contact",
      "serious": "serious focused expression",
      "signature_pose": "iconic signature pose with key prop",
      "daily": "casual daily moment, behind the scenes",
      "event": "at a glamorous event, full body",
      "content": "filming social content, ring light visible"
    };
    
    return `${base}. ${variantMap[variant]}. ${style}. high detail, character design sheet quality.`;
  }
};
window.PersonaImage = PersonaImage;
