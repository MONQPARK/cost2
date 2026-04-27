# Antigravity v7 — HTML 구조 복구 (소셜·페르소나 둘 다 안 보이는 진짜 원인)

> 대상: `/Users/park/cost2/index.html`
> 작성일: 2026-04-27
> 핵심: HTML 컨테이너 구조가 깨져 있다. **이 한 가지만 고치면 둘 다 살아난다.**

---

## ⚠️ 앤비에게 — 진단

`index.html`의 div 구조가 다음처럼 잘못 묶여 있다.

```
<div id="persona-layout" style="display:none">   ← line 1586
  ├─ persona-sidebar
  └─ main content
       ├─ tab-persona-cat              ← 페르소나 1단계 (정상)
       └─ tab-persona-world            ← 페르소나 2단계 (정상)

  </div><!-- 잘못된 위치에서 닫힘, line 1666 -->
  
  <!-- 여기부터는 persona-layout 밖이지만 사실은 닫힘이 어긋나서 안에 갇혀 있음 -->
  <div id="tab-social-input">...</div>   ← line 2832  소셜 9
  <div id="tab-social-insight">...</div> ← line 2980  소셜 10 (hidden)
  <div id="tab-social-content">...</div> ← line 2989  소셜 11
  <div id="tab-social-schedule">...</div>← line 3008  소셜 12
  
  </div></div>  ← line 3044-3045 (페르소나 layout 진짜로 닫힘 위치 추정)

<!-- persona-layout 완전히 밖에 떨어진 페르소나 탭들 -->
<div id="tab-persona-sheet">...</div>     ← line 3055  페르소나 3
<div id="tab-persona-visual">...</div>    ← line 3066  페르소나 4
<div id="tab-persona-content">...</div>   ← line 3091  페르소나 5
```

## 결과 (현재 사용자 증상의 직접 원인)

**소셜 모드 진입**: `switchMode('social')`가 `persona-layout`을 `display:none`으로 둔다. 그런데 소셜 탭 4개가 **persona-layout 안에 갇혀 있어서** 같이 숨겨진다 → "9·10·11 탭 눌러도 아무것도 안떠" ✅

**페르소나 모드 진입**: 1·2단계는 persona-layout 안이라 정상 노출. 3·4·5단계는 persona-layout 밖에 떠 있어서 사이드바 없는 상태로 어딘가 어색한 위치에 표시 → "시트레이아웃이 이상하고" ✅ 그리고 nextStep으로 이동해도 사이드바와 분리돼 진행감이 없음 → "각단계별로 진행도 안돼" ✅

---

# 정확한 수정 절차

## STEP 1 — 페르소나 탭 3·4·5를 persona-layout 안으로 이동

`index.html` 라인 **3053~3119** 사이의 페르소나 탭 3개 블록 전체를 잘라낸다.

잘라낼 범위 (정확히 이 텍스트로 시작·끝):

**시작**: line 3053 부근의 빈 줄 또는 `<!-- Tab 3: Sheet -->` 주석
**끝**: line 3119의 `<script src="js/persona.js?v=8"></script>` **직전**까지

(주석 + Tab 3 + Tab 4 + Tab 5 + 데이터 다운로드 버튼 영역 + persona-prompts 스크립트 태그까지 포함)

확인용: 잘라낸 블록 안에 다음이 모두 있어야 한다.
- `<div id="tab-persona-sheet" class="tab-content">`
- `<div id="tab-persona-visual" class="tab-content">`
- `<div id="tab-persona-content" class="tab-content">`
- `<script src="js/persona-prompts.js?v=8">`
- `<script src="js/persona-image.js?v=8">`
- `<script src="js/persona.js?v=8">`

**스크립트 3개는 따로 빼서 보관해라.** body 닫히기 직전에 다시 박는다.

## STEP 2 — 잘라낸 페르소나 탭 3·4·5를 페르소나 탭 2 바로 다음에 붙여넣기

붙여넣을 위치: line **1665** (현재 `tab-persona-world`의 닫는 `</div>` 바로 뒤). 

붙여넣은 후 구조:

```html
<!-- line 1635 -->
<div id="tab-persona-world" class="tab-content">
  ...
</div><!-- /tab-persona-world ends at line 1665 -->

<!-- ★ 여기에 페르소나 3·4·5 삽입 ★ -->
<div id="tab-persona-sheet" class="tab-content">
  ...
</div>
<div id="tab-persona-visual" class="tab-content">
  ...
</div>
<div id="tab-persona-content" class="tab-content">
  ...
</div>
```

스크립트 3개(persona-prompts, persona-image, persona)는 여기 붙이지 말고 따로.

## STEP 3 — persona-layout 닫는 div 정리

원래 line 1666의 `</div><!-- /app-container -->` 주석은 **잘못된 라벨**이다 (실제로는 persona-layout의 main-content를 닫고 있다). 페르소나 탭 5개가 모두 main-content 안으로 들어왔으니, 다음 두 줄을 line 1665 다음 / 페르소나 탭 5단계 다음에 명시한다.

```html
<!-- 페르소나 탭 5(content) 닫힘 다음에 -->
    </div><!-- /persona-main-content -->
  </div><!-- /persona-layout -->
```

## STEP 4 — 소셜 탭 4개를 persona-layout 밖 형제로 정리

현재 line 2828~3045의 소셜 4개 탭은 그대로 두면 된다. **단** persona-layout 닫는 `</div>` 가 그 앞에 와야 한다 (STEP 3에서 만든 `/persona-layout` 위치).

확인 후 구조:

```html
<div id="persona-layout">
  <div id="persona-sidebar">...</div>
  <div class="main-content">
    <div id="tab-persona-cat">...</div>
    <div id="tab-persona-world">...</div>
    <div id="tab-persona-sheet">...</div>
    <div id="tab-persona-visual">...</div>
    <div id="tab-persona-content">...</div>
  </div>
</div>

<!-- 여기부터는 persona-layout 밖, 형제 -->
<!-- ==================== SOCIAL MODE ==================== -->
<div id="tab-social-input">...</div>
<div id="tab-social-insight">...</div>
<div id="tab-social-content">...</div>
<div id="tab-social-schedule">...</div>
```

## STEP 5 — 스크립트 태그 위치 확정

STEP 1에서 빼둔 3개 스크립트 태그(`persona-prompts.js`, `persona-image.js`, `persona.js`)를 **`</body>` 닫기 직전**에 박는다. 이미 같은 위치에 있는 social 스크립트들 옆에:

```html
<script src="./js/social-prompts.js?v=8"></script>
<script src="./js/social-export.js?v=8"></script>
<script src="./js/social.js?v=8"></script>
<script src="js/persona-prompts.js?v=8"></script>
<script src="js/persona-image.js?v=8"></script>
<script src="js/persona.js?v=8"></script>
</body>
```

## STEP 6 — div 균형 검증

수정 후 다음 명령으로 div 카운트 일치 확인:

```bash
echo "Open: $(grep -o '<div' index.html | wc -l)"
echo "Close: $(grep -o '</div>' index.html | wc -l)"
```

두 값이 **정확히 일치**해야 한다. 차이 1 이상이면 어딘가 unclosed/extra div가 있다는 뜻.

---

# 검증 시나리오

수정 후 직접 클릭 확인.

## 시나리오 A: 소셜 모드 살아남

1. 사이트 로드
2. "🚀 소셜 콘텐츠" 모드 클릭
3. **9번 탭 (광고주 입력) 콘텐츠가 보여야 한다.** ← 이게 핵심
4. 탭 9 → 10 (콘텐츠 캔버스) 클릭 → 콘텐츠 그리드 영역 노출
5. 탭 10 → 11 (캘린더) 클릭 → 캘린더 영역 노출

## 시나리오 B: 페르소나 5단계 흐름

1. "🎭 AI 페르소나" 모드 클릭
2. 좌측 사이드바 + 우측 카테고리 카드 12개가 같이 보임 (지금은 사이드바만 따로 떠 있을 수 있음)
3. 카테고리 클릭 → 사이드바 갱신
4. 세부 포지셔닝 + 차별화 입력 → "다음 단계" 클릭
5. **2단계로 전환되면서 사이드바는 그대로 유지** (이게 핵심 — 지금은 깨졌다)
6. 세계관 입력 → "Gemini로 캐릭터 시트 자동 완성" 클릭
7. 약 10초 후 3단계 자동 전환 → 캐릭터 시트 카드 노출 (사이드바와 함께)
8. "비주얼 생성으로" → 4단계 → "메인 비주얼 생성"
9. "콘텐츠 예시 만들기" → 5단계 → 첫 주 콘텐츠

## 시나리오 C: 콘솔 에러 0개

DevTools Console 탭에 빨간 줄 0개. 노란 경고는 무시해도 되지만 빨간 에러는 모두 보고.

---

# git commit 메시지

```
fix(v7): repair broken HTML container structure

- persona-layout was incorrectly wrapping social mode tabs (lines 1586-3044)
- persona tabs 3,4,5 were stranded outside persona-layout (lines 3055+)
- moved persona tabs 3-5 into persona-layout main content
- moved social tabs out as siblings of persona-layout
- restructured persona scripts to body bottom alongside social scripts
```

---

# 절대 하지 말 것

- 새 컴포넌트·새 디자인 변경 금지
- JS 파일(`js/*.js`) 손대지 마라 — 이 패치는 **HTML 구조만** 손본다
- 탭 콘텐츠 안의 내용물(폼·버튼·모달 등) 손대지 마라 — 통째로 옮기기만

JS는 v6에서 이미 올바르게 동작한다 (nextStep, init 등 다 고쳐짐). 단지 HTML 구조 때문에 화면이 안 보였던 것뿐. 구조만 고치면 살아난다.

---

# 만약 이 패치 후에도 안 되면 (가능성 낮음)

브라우저 캐시 가능성. 사용자에게:
1. Cmd+Shift+R (또는 Ctrl+Shift+R)로 hard reload
2. 또는 DevTools → Application → Storage → Clear site data → 새로고침

`vercel.json`에 cache-busting이 들어 있어서 보통 자동으로 처리되지만, 변경 직후 한 번은 hard reload가 안전하다.

끝.
