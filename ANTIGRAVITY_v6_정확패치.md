# Antigravity v6 — 정확 패치 (소셜·페르소나 작동 안 되는 진짜 원인 3건)

> 대상: `/Users/park/cost2`
> 작성일: 2026-04-27
> 분량: 의도적으로 짧게. **이 3건만 정확히 고친다.**

---

## ⚠️ 앤비에게

이 패치는 사용자의 단일 호소(소셜 콘텐츠 생성 안 됨, 페르소나 진행 안 됨)에 대한 **정확 진단 결과**다. 새로 만들거나 디자인 바꾸지 말 것. **3건만 잡는다.**

각 BUG의 "정확한 위치"와 "고치기 전 코드" → "고친 후 코드"를 그대로 옮긴다. 임의 해석 금지.

---

# BUG #1 — 페르소나가 1단계에서 더 못 넘어가는 이유

## 정확한 원인

`js/persona.js:133` 의 `nextStep()` 함수가 사용하는 CSS 셀렉터가 **버튼을 절대 찾지 못한다.**

**현재 코드** (`js/persona.js:133-135`):

```js
nextStep(step) {
  document.querySelector(`#tabs-persona button[onclick*="'${step}'"]`)?.click();
}
```

**왜 안 되는가**: `nextStep('world')`를 호출하면 셀렉터가 `[onclick*="'world'"]`이 된다. 즉 onclick 속성에 `'world'`(앞뒤 작은따옴표 포함)라는 substring이 있어야 한다.

그런데 실제 버튼은 다음과 같다 (`index.html:1093`):
```html
<button onclick="switchTab('persona-world', 'persona', this)">2. 세계관</button>
```

onclick 안에 있는 건 `'persona-world'`다. 즉 `world` 앞에는 `-`가 있고 따옴표가 아니다. 결과적으로 `'world'`(따옴표-world-따옴표)는 substring이 아니라서 **셀렉터가 0개를 반환한다**. 클릭이 안 일어나고 사용자는 1단계에 그대로 갇힌다.

이 한 줄 때문에 페르소나 워크플로우 전체가 막혀 있었다.

## 정확한 수정

다행히 같은 버튼들에 이미 `data-tab="persona-world"` 속성이 박혀 있다. 셀렉터만 그걸 쓰게 바꾼다.

**수정 후 코드** (`js/persona.js:133-138`로 교체):

```js
nextStep(step) {
  const fullTab = step.startsWith('persona-') ? step : 'persona-' + step;
  const btn = document.querySelector(`#tabs-persona button[data-tab="${fullTab}"]`);
  if (btn) btn.click();
  else console.warn('[PersonaApp] nextStep: button not found for', fullTab);
}
```

---

# BUG #2 — 페르소나 init 시 TypeError 발생 (renderVariantsGrid·renderContents 미정의)

## 정확한 원인

`js/persona.js:15-51`의 `init()`이 다음 두 함수를 호출하지만, **둘 다 PersonaApp에 정의돼 있지 않다.**

- `js/persona.js:29` `this.renderVariantsGrid()` — 미정의
- `js/persona.js:40` `this.renderContents(this.state.contents)` — 미정의 (이름이 `generateContents`만 있음)

사용자가 한 번이라도 비주얼이나 콘텐츠를 생성한 적 있다면 그 state가 localStorage에 남는다. 그러면 다음 진입 때 init이 미정의 함수 호출 → TypeError → **그 아래 categories 로드 fetch가 실행 안 됨** → 카테고리 카드 그리드가 빈 채로 나옴 → 사용자는 카테고리 자체를 못 누름 → 워크플로우 시작 자체가 막힌다.

## 정확한 수정

두 가지를 한 번에 한다.

### 수정 1) 미정의 함수를 호출하지 않도록 init 안전하게 보호

**현재 코드** (`js/persona.js:15-51`):

```js
async init() {
  if (!this.getApiKey()) {
    const banner = document.getElementById('psn_key_banner');
    if(banner) banner.style.display = 'block';
  }
  
  const saved = STORE.get('persona_state');
  if(saved) {
    this.state = saved;
    if(this.state.persona) {
      this.renderSheetCard(this.state.persona);
      this.nextStep('sheet');
    }
    if(this.state.visuals && this.state.visuals.length > 0) {
      this.renderVariantsGrid();
      const mainVis = this.state.visuals.find(v => v.variant === 'main');
      if(mainVis) {
        const imgEl = document.getElementById('psn_main_img');
        if(imgEl) {
          imgEl.src = mainVis.image_data_url;
          imgEl.style.display = 'block';
        }
      }
    }
    if(this.state.contents && this.state.contents.length > 0) {
      this.renderContents(this.state.contents);
    }
  }

  try {
    const res = await fetch('data/persona-categories.json');
    const data = await res.json();
    this.renderCategories(data.categories);
  } catch(e) {
    console.error(e);
  }
},
```

**수정 후 코드 (전체 init 블록 교체)**:

```js
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
```

### 수정 2) 안전한 데이터 초기화 안내 (선택, 권장)

기존에 깨진 state가 사용자 localStorage에 남아 있을 수 있다. 페르소나 페이지 또는 어디든 좋다, 다음 한 줄짜리 안전 버튼을 한 곳에 추가:

```html
<!-- index.html의 헤더 또는 페르소나 카테고리 탭 상단 어디든 -->
<button class="btn" style="font-size:11px; opacity:0.6;" onclick="if(confirm('저장된 페르소나·소셜 진행 상태를 모두 지웁니다. 계속하시겠습니까?')) { localStorage.removeItem('monq_persona_state'); localStorage.removeItem('social_state'); location.reload(); }">진행 상태 초기화</button>
```

깨진 상태 때문에 안 풀리는 사용자가 직접 리셋할 수 있게.

---

# BUG #3 — 소셜 콘텐츠 생성 시 init이 미정의 renderInsight 호출 (잠재 차단)

## 정확한 원인

`js/social.js:182`의 init이 `this.renderInsight(this.state.insight)`를 호출하지만, **SocialApp에 `renderInsight` 함수가 정의돼 있지 않다.**

```js
init() {
  ...
  if (this.state.insight) {
    this.renderInsight(this.state.insight);  // ← 미정의
  }
  ...
}
```

이건 try/catch로 감싸져 있어서 즉시 사이트 다운은 안 되지만, **이전에 한 번이라도 insight가 저장된 사용자**의 경우 init 처리가 도중에 끊겨서 contents 렌더가 안 된다. 사용자는 "이전에 만든 카드가 안 보이네"가 되거나, 무한 진행 표시 같은 잔존 상태에 시달린다.

## 정확한 수정

`renderInsight` 호출을 안전하게 무시하거나, 더 나아가서 함수가 있는지 체크 후 호출.

**수정 후 코드** (`js/social.js:172-190`의 init 함수 전체 교체):

```js
init() {
  // API 키 복원
  const savedKey = (sessionStorage.getItem('social_api_key') || localStorage.getItem('monq_api_key'));
  const keyEl = document.getElementById('soc_api_key');
  if (savedKey && keyEl) keyEl.value = savedKey;
  
  // 저장 상태 복원 — 안전하게
  try {
    const savedState = localStorage.getItem('social_state');
    if (savedState) {
      const parsed = JSON.parse(savedState);
      // insight는 UI에 안 노출하므로 state에만 보관
      if (parsed && typeof parsed === 'object') {
        this.state = parsed;
      }
      // 콘텐츠와 캘린더는 함수가 있을 때만 렌더
      if (this.state.contents && this.state.contents.length > 0) {
        if (typeof this.renderContent === 'function') {
          this.renderContent(this.state.contents);
        }
        if (typeof this.renderSchedule === 'function') {
          this.renderSchedule(this.state.contents);
        }
      }
    }
  } catch(e) {
    console.warn('[SocialApp] saved state restore failed', e);
  }
},
```

---

# 최종 검증 (3개 시나리오 직접 클릭)

위 3개 수정 후 **앤비가 직접 브라우저에서** 다음을 클릭해보고 결과 보고할 것.

## 시나리오 A: 페르소나 진행

1. 사이트 진입 → "AI 페르소나" 모드 클릭
2. 카테고리 카드 12개가 보이는가? **(BUG #2 수정 검증)**
3. "푸드·미식" 카드 클릭 → 우측 사이드바에 카테고리 표시되는가?
4. 세부 포지셔닝, 차별화 한 줄 입력
5. "다음 단계: 세계관 빌딩" 버튼 클릭
6. 2단계 탭으로 자동 전환되는가? **(BUG #1 수정 검증)**
7. 세계관 폼 입력 → "Gemini로 캐릭터 시트 자동 완성" 클릭
8. 약 10초 후 3단계 탭(캐릭터 시트)으로 자동 전환 + 카드가 보이는가? **(BUG #1 재검증)**
9. "비주얼 생성으로 이동" → 4단계 진입
10. "메인 비주얼 생성" → 이미지 노출
11. "콘텐츠 예시 만들기" → 5단계 진입
12. "첫 주 콘텐츠 일괄 생성" → 5개 카드 노출

## 시나리오 B: 소셜 콘텐츠 생성

1. 사이트 진입 → "소셜 콘텐츠" 모드 클릭
2. 1단계 폼이 빈 채로 정상 노출되는가? (이전 캐시 잔재가 안 보여야 함) **(BUG #3 수정 검증)**
3. 회사명 "유어브랜드", 산업 "F&B", 제품 "수제 맥주", 타깃 "20대 후반 직장인" 입력
4. 톤 "친근함" + "감성" 체크
5. 채널 Instagram, Reels 체크
6. 캠페인 목적 "팬덤 형성" 선택
7. 발행 빈도 "주 3회"
8. AI 모델: Gemini 2.5, 키 입력 (사용자가 발급한 새 키)
9. "키 점검" 클릭 → "✅ OK · gemini-2.5-flash 사용 가능" 노출 확인
10. "콘텐츠 만들기" 클릭
11. progress bar "광고주 분석 중" → "콘텐츠 기획 중" → "완료!" 순으로 변하는가?
12. 약 30초 후 콘텐츠 캔버스 탭으로 자동 전환 + 13개 카드 노출되는가?
13. 카드 1장 클릭 → 카피·해시태그·image_prompt 모두 채워져 있는가?
14. "캘린더" 탭 클릭 → 시간순 리스트 노출 (현재는 진짜 캘린더 그리드 아니지만 이번 패치 범위 밖)

## 시나리오 C: 콘솔 에러 0개

위 두 시나리오 진행 중 브라우저 개발자 도구 콘솔에 에러 0건이어야 한다. 빨간 줄이 하나라도 뜨면 그 메시지를 그대로 보고할 것.

---

# git commit 메시지 (정확히 이걸로)

```
fix(v6): persona nextStep selector + persona/social init type errors

- persona.js nextStep: switch from onclick substring match to data-tab attribute selector
- persona.js init: load categories first, guard renderVariantsGrid/renderContents calls (functions don't exist)
- social.js init: guard renderInsight call (function doesn't exist), wrap in try/catch
```

---

# 절대 하지 말 것

- 디자인 바꾸기 (몽규 디자인은 추후 별도 작업)
- 새 기능 추가
- 새 페이지 생성
- 다른 함수 손대기 (위 3건 외)

이 패치는 **3줄 그룹의 정확한 교체**일 뿐이다. 다른 파일·다른 함수 건드리면 회귀 발생.

작업 완료 후 시나리오 A·B·C 결과를 사용자에게 보고. 끝.
