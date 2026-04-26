const SocialPrompts = {
  INSIGHT_SYSTEM: `당신은 한국 시장에서 활동하는 시니어 소셜 미디어 전략가입니다.
산업·타깃·톤을 받아 브랜드 인사이트와 페르소나를 만듭니다.
출력은 반드시 아래 JSON 스키마를 정확히 따릅니다.`,

  INSIGHT_USER: (input) => `회사명: ${input.company}
산업: ${input.industry}
제품/서비스: ${input.products}
타깃: ${input.target}
톤: ${input.tone.join(', ')}
경쟁사: ${input.competitors}
캠페인 목적: ${input.goal}
주력 채널: ${input.channels.join(', ')}
트렌드 키워드: ${input.trend_keywords.join(', ')}

다음 JSON 스키마로 응답하세요(키 이름과 타입 그대로):
{
  "tagline": "string (한 줄, 30자 이내)",
  "personas": [
    {"id":"p1","name":"한국 이름","age":number,"job":"string","interests":["string"],"sns_behavior":"string","motivation":"string"}
  ] (3개),
  "tone_keywords": ["string"] (3개),
  "channel_mix": { "<채널명>": number } (합계 100, 입력 채널만)
}`,

    CONTENT_SYSTEM: `당신은 최고 수준의 소셜 미디어 마케터이자 카피라이터입니다.\n단순하고 뻔한 광고 카피가 아닌, 실제 유저들의 스크롤을 멈추게 하는 강력한 후킹(Hooking)과 공감대 형성, 그리고 실질적인 세일즈 포인트(또는 전환 유도)가 완벽하게 결합된 콘텐츠를 기획해야 합니다.\n사용자의 트렌드 키워드나 밈이 제공되면, 이를 억지스럽지 않고 재치있게 녹여내세요.\n출력은 반드시 요구된 JSON 배열 형태만 반환해야 합니다.`,

  CONTENT_USER: (insight, input, freq, days, startDate) => `브랜드 한 줄: ${insight.tagline}
페르소나 요약: ${insight.personas.map(p => p.name).join(', ')}
톤 키워드: ${insight.tone_keywords.join(', ')}
채널 분배: ${JSON.stringify(insight.channel_mix)}
발행 빈도: ${freq}
한 달 일수: ${days}
시작 날짜: ${startDate}

다음 스키마의 배열을 생성하세요(N = 발행 빈도에 맞는 콘텐츠 개수):
[
  {
    "channel": "Instagram | Reels | TikTok | Threads | X | YouTube Shorts | Naver Blog | LinkedIn",
    "format": "Single | Carousel | Reels | Short | Thread | Article",
    "scheduled_at": "YYYY-MM-DDTHH:mm:00+09:00",
    "core_message": "string (15자 이내)",
    "copy": "string",
    "hashtags": ["#string"] (5~8개, 한국어 우선),
    "image_prompt": "string (영문 또는 한글, 60자 이내)"
  }
]

규칙:
- 같은 핵심 메시지 반복 금지.
- 일주일에 1번은 페르소나 직접 언급.
- 캠페인 목적이 "팬덤"이면 30%는 인터랙션 유도(질문/투표).`,

  REGEN_USER: (cardJson, feedback) => `기존 카드: ${JSON.stringify(cardJson)}
사용자 피드백: ${feedback}

위 카드를 같은 채널·날짜로 유지한 채, 사용자 피드백을 반영해 재생성하세요.
출력은 동일한 스키마의 단일 JSON 객체입니다.`
};

window.SocialPrompts = SocialPrompts;
