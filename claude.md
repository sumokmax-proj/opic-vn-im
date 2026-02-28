# Vietnamese OPIc Study App

## Project Overview

A personal study app to pass the Vietnamese OPIc exam.
Core learning method: **memorize frequent OPIc questions + model answer sentences**.
AI-powered sentence analysis and card customization available on demand.

- **User:** Solo (developer only)
- **Current level:** NH (Novice High)
- **Target level:** IM (Intermediate Mid)
- **UI language:** Korean / **Study content:** Vietnamese

---

## Tech Stack

| Item | Choice |
|------|--------|
| Frontend | React (Vite) |
| Styling | Tailwind CSS |
| Backend | Express.js (server.js) |
| Data storage | Local JSON files (src/data/) |
| AI analysis | Claude API — claude-haiku (via backend proxy) |
| Process manager | PM2 |
| Deployment | AWS EC2 (port 3200) |

> API key managed via `.env`. Never commit `.env`.
> All Claude API calls are proxied through the Express backend — the API key is never exposed to the browser.

---

## Running the App

```bash
# Start with PM2
pm2 start server.js --name opic-vn-im

# Restart after build
npm run build && pm2 restart opic-vn-im

# View logs
pm2 logs opic-vn-im --lines 30

# App URL
http://localhost:3200
```

---

## Architecture

```
Browser (React SPA)
    ↓ HTTP fetch
Express server (server.js, port 3200)
    ├── Serves /dist (static React build)
    ├── GET  /api/cards          → src/data/cards.json
    ├── PUT  /api/cards/:id      → update card
    ├── POST /api/cards          → create card
    ├── DELETE /api/cards/:id    → delete card
    ├── POST /api/analyze        → Claude Haiku (with file cache)
    ├── GET  /api/profile        → src/data/profile.json
    ├── POST /api/profile        → save profile
    └── POST /api/customize      → Claude Haiku (with file cache)
```

---

## File Structure

```
/
├── claude.md
├── .env                         ← ANTHROPIC_API_KEY (never commit)
├── server.js                    ← Express backend + API proxy
├── src/
│   ├── components/
│   │   ├── Card.jsx             ← Flashcard (3D flip + swipe/drag gestures)
│   │   ├── Analysis.jsx         ← Analysis result panel (remark-gfm)
│   │   └── Filter.jsx           ← Category filter tabs
│   ├── pages/
│   │   ├── Study.jsx            ← Main study page
│   │   ├── Admin.jsx            ← Admin page (tabs: 카드관리 | 내정보)
│   │   └── Profile.jsx          ← Profile form + AI card customization
│   ├── api/
│   │   ├── claude.js            ← analyzeAnswer() → POST /api/analyze
│   │   └── cards.js             ← CRUD + fetchProfile, saveProfile, customizeCards
│   ├── data/
│   │   ├── cards.json           ← 32 flashcards
│   │   ├── profile.json         ← User profile (10 fields)
│   │   ├── analysis-cache.json  ← Server-side analysis cache (keyed by cardId)
│   │   └── customize-cache.json ← Server-side customization cache (keyed by cardId_profileHash)
│   ├── index.css                ← 3D card flip CSS (position:absolute approach)
│   └── App.jsx
├── dist/                        ← Production build (served by Express)
├── package.json
└── vite.config.js
```

---

## Implemented Features

### Flashcard Study (Study.jsx + Card.jsx)
- 3D flip animation: front = question, back = model answer (Vietnamese + Korean)
- **Dynamic card height**: `useLayoutEffect` + `scrollHeight` measurement — no whitespace gap
- **Swipe gestures (mobile)**: swipe left = next, swipe right = previous
- **Drag gestures (PC)**: drag left = next, drag right = previous
- Gesture threshold: >50px horizontal movement + horizontal > vertical × 1.5 (prevents accidental swipe)
- Tap/click: flips card (not affected by swipe detection)
- `분석하기` button: hidden when showing question face, visible only after flipping to answer
- Progress tracking: seen card IDs stored in `localStorage` with visual progress bar
- Random mode: **default ON** — toggle between random / sequential order

### Category Filter (Filter.jsx)
- Categories: 전체 / 자기소개 / 직장 / 취미 / 거주지 / 여행 / 음식

### AI Sentence Analysis (Analysis.jsx + /api/analyze)
- Calls Claude Haiku with the Vietnamese answer sentence
- **Server-side file cache** (`analysis-cache.json`) — avoids repeat API calls across sessions
- In-memory cache layer on top of file cache for speed
- Analysis rendered with `remark-gfm` (supports markdown tables)
- 분석하기 button disabled while loading

### Admin UI (Admin.jsx)
- Tab navigation: **카드 관리** | **내 정보**
- Card management tab: add / edit / delete flashcards, saved to `cards.json`

### Personal Profile + Card Customization (Profile.jsx + /api/customize)
- 10 profile fields: 닉네임, 나이, 직업, 거주지, 가족, 취미, 여행, 음식, 건강, OPIc 동기
- AI customizes selected card categories to match user's personal context
- Before/after preview with per-card diff view
- **"1장만 테스트" toggle**: customize only 1 card to save API tokens
- **Server-side cache** (`customize-cache.json`): keyed by `${cardId}_${profileHash}` (SHA256 of profile fields, first 8 hex chars)
- Different profile = different cache key → re-customization always available
- Error display: failed cards shown with orange warning box

---

## Data Structures

### Card (cards.json)
```json
{
  "id": "001",
  "category": "자기소개",
  "question": { "vi": "...", "ko": "..." },
  "answer": { "vi": "...", "ko": "..." }
}
```

### Profile (profile.json)
```json
{
  "nickname": "Sumok",
  "age": "36",
  "job": "IT Project Manager",
  "location": "Hanoi",
  "family": "...",
  "hobbies": "코딩, 독서",
  "travel": "Danang, Hoi An",
  "food": "분짜",
  "health": "주 2회 달리기",
  "motivation": "업무상 서울로 출장을 자주 갑니다"
}
```

---

## Key Technical Details

### 3D Card Flip (index.css)
Both faces use `position: absolute` — NOT CSS Grid.
Card container height is set dynamically via JS to match the visible face.
```css
.card-inner {
  position: relative;
  transition: transform 0.6s, height 0.35s ease;
  transform-style: preserve-3d;
}
.card-face {
  position: absolute;
  top: 0; left: 0; right: 0;
  backface-visibility: hidden;
}
.card-back { transform: rotateY(180deg); }
.card-inner.flipped { transform: rotateY(180deg); }
```

### Dynamic Card Height (Card.jsx)
```jsx
useLayoutEffect(() => {
  if (frontRef.current) setHeight(frontRef.current.scrollHeight)
}, []) // runs once per card (key={card.id} causes remount on navigation)
```

### Swipe/Drag Detection (Card.jsx)
```js
const onDragEnd = (x, y) => {
  const dx = x - drag.current.startX
  const dy = y - drag.current.startY
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
    if (dx < 0) onSwipeLeft?.()   // next card
    else onSwipeRight?.()          // prev card
  }
}
```
Click handler checks `drag.current.wasSwiped` to prevent accidental flip after swipe.

### Profile Hashing (server.js)
```js
import { createHash } from 'crypto'
const profileHash = createHash('sha256')
  .update(profileLines.join('\n'))
  .digest('hex')
  .slice(0, 8)
const cacheKey = `${cardId}_${profileHash}`
```

### JSON Parsing Robustness (server.js)
Claude sometimes wraps JSON in markdown code fences. Strip before parsing:
```js
const cleaned = raw
  .replace(/^```(?:json)?\s*/i, '')
  .replace(/\s*```\s*$/i, '')
const parsed = JSON.parse(cleaned)
```

---

## UI Design

- **Design language:** Notion/Linear inspired — clean, minimal, warm
- **Color palette:**
  - Background: `#FAFAF8` (warm off-white)
  - Card surface: `#FFFFFF` / `#F5F3EF` (answer side)
  - Primary accent: `#7C6F5B` (warm brown)
  - Border: `#E8E4DF`
  - Muted text: `#8C8480`
- **Font:** System default (no external fonts)
- **Mobile-first:** Responsive, tested on 375px viewport

---

## Development History

| Phase | Feature | Status |
|-------|---------|--------|
| Phase 1 | Flashcard UI, navigation, seed data, category filter | ✅ Done |
| Phase 2 | Claude API analysis, server-side caching | ✅ Done |
| Phase 3 | Admin UI (card CRUD), progress tracking | ✅ Done |
| Phase 3+ | Personal profile + AI card customization | ✅ Done |
| Extra | 3D flip with dynamic height (no whitespace) | ✅ Done |
| Extra | Swipe/drag gesture navigation + slide animation | ✅ Done |
| Extra | Random mode default ON | ✅ Done |
| Extra | 분석하기 button hidden on question face | ✅ Done |
| Extra | Token-saving: customization cache + 1장 테스트 | ✅ Done |
| Extra | Analysis code block overflow fix (pre wrap) | ✅ Done |
| **Phase 4** | **App restructure + Exam mode** | 🔲 Planned |

---

## Phase 4 — App Restructure + Exam Mode

### 4-1. App Navigation Restructure

**현재 구조 문제점**: 공부 페이지와 관리 버튼이 혼재, 시험 기능 추가 시 내비게이션 복잡도 증가

**새 구조**:
```
앱 진입
  └── 홈 화면 (메인 메뉴)
        ├── 공부하기  → 기존 Study 페이지 (변경 없음)
        ├── 시험보기  → 새 Exam 페이지
        └── 설정      → 기존 Admin 페이지 (관리 버튼 이동)
```

- 헤더의 "관리" 버튼 제거 → 홈 메뉴의 "설정" 항목으로 대체
- 공부 완료 후 "시험 보러 가기" 버튼으로 자연스러운 흐름 연결
- 각 페이지에서 홈으로 돌아가는 뒤로가기 버튼 추가

**영향 파일**:
- `src/App.jsx` — 라우팅 구조 변경 (view state: `'home' | 'study' | 'exam' | 'admin'`)
- `src/pages/Home.jsx` — 신규: 메인 메뉴 페이지
- `src/pages/Study.jsx` — 헤더에서 관리 버튼 제거, 홈 버튼 추가
- `src/pages/Admin.jsx` — 홈 버튼 추가

---

### 4-2. Exam Mode — 객관식 빈칸 채우기

#### 기본 흐름
```
시험보기 선택
  → 카테고리 선택 (공부와 동일한 Filter 컴포넌트 재사용)
  → 문제 풀기 (한 문제씩)
  → 결과 화면 (점수 + 오답 목록)
  → 오답 다시 풀기 (선택)
```

#### 문제 화면 구성
- 답변 문장에서 **핵심 단어 1개**를 빈칸(`___`)으로 가림
- 보기 4개 (정답 1 + 오답 3) 를 랜덤 순서로 표시
- 선택 즉시 정답/오답 피드백 (초록/빨강 하이라이트)
- 오답 선택 시 정답도 함께 표시
- "다음 문제" 버튼으로 진행

#### 빈칸 단어 선택 기준
답변 문장에서 아래 우선순위로 핵심 단어 선택:
1. 베트남어 특유 표현 (성조가 의미를 바꾸는 단어)
2. 문장의 핵심 동사 또는 명사
3. OPIc 빈출 어휘

#### 오답 생성 방법 — **카드풀 추출 방식 (Method B)**
API 비용 없이 카드 데이터에서 오답 추출:

1. **성조 변형 오답**: 정답 단어의 성조 기호만 바꾼 변형 생성
   - 예) `khỏe` (건강한) → `khoe` (자랑하다), `khọe` 등
   - 베트남어 6성조: 기본(없음) / sắc(´) / huyền(`) / hỏi(ả) / ngã(ã) / nặng(.)
2. **카드풀 동일 품사 오답**: 전체 카드 답변에서 같은 품사 단어 추출
3. **혼합**: 성조 변형 1~2개 + 카드풀 추출 1~2개

오답 데이터는 `src/data/quiz-cache.json`에 저장 (카드 ID 키)

#### 결과 화면
- 총 점수: N / 전체 문제 수
- 카테고리별 정답률 (해당 카테고리 시험 시)
- 오답 카드 목록 표시

---

### 4-3. 오답노트 (Wrong Answer Review)

- 오답 카드 ID를 `localStorage`에 누적 저장 (`opic_wrong`)
- 홈 화면 또는 결과 화면에서 "오답노트 보기" 진입
- 오답 카드만 필터링해서 공부 모드로 재학습
- 오답 해결 시 오답노트에서 제거 (정답 맞히면 삭제)

---

### 4-4. 신규 파일 구조 (Phase 4 이후)

```
src/
├── pages/
│   ├── Home.jsx       ← 신규: 메인 메뉴 (공부하기 / 시험보기 / 설정)
│   ├── Study.jsx      ← 기존 유지 (관리 버튼 제거)
│   ├── Exam.jsx       ← 신규: 시험 페이지 (카테고리 선택 + 문제 풀기 + 결과)
│   ├── Admin.jsx      ← 기존 유지 (홈 버튼 추가)
│   └── Profile.jsx    ← 기존 유지
├── components/
│   ├── Card.jsx       ← 기존 유지
│   ├── Analysis.jsx   ← 기존 유지
│   ├── Filter.jsx     ← 기존 유지 (Exam에서도 재사용)
│   └── QuizCard.jsx   ← 신규: 객관식 문제 카드 컴포넌트
├── data/
│   └── quiz-cache.json ← 신규: 오답 세트 캐시
└── utils/
    └── quiz.js        ← 신규: 빈칸/오답 생성 로직
```

---

### 4-5. 개발 순서

1. `Home.jsx` 생성 + `App.jsx` 라우팅 구조 변경
2. `Study.jsx` / `Admin.jsx` 헤더 수정 (관리→설정 이동, 홈 버튼)
3. `utils/quiz.js` — 빈칸 선택 + 오답 생성 로직
4. `QuizCard.jsx` — 문제 UI 컴포넌트
5. `Exam.jsx` — 카테고리 선택 → 문제 흐름 → 결과 화면
6. 오답노트 localStorage 연동
7. 빌드 + 전체 플로우 테스트

---

*Last updated: 2026-02-28*
*Developer: Sumok*
