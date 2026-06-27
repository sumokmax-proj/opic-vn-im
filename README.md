# Vietnamese OPIc Study App

베트남어 OPIc 시험 합격을 위한 개인용 학습 앱. 빈출 OPIc 질문 + 모범 답안 문장을 암기하는 방식으로 학습하고, AI로 문장 분석/맞춤화도 가능.

## 배경 / 의도

- 사용자: 본인 전용 (개발자 = 학습자)
- 현재 레벨: NH (Novice High) → 목표 레벨: IM (Intermediate Mid)
- UI는 한국어, 학습 콘텐츠는 베트남어
- 기존 `vnopic` 프로젝트의 v2 — Supabase 백엔드 연동으로 확장

## 현재 상태

🔵 개발 중 — Supabase 연동 작업 진행

## 사용 기술

| 항목 | 선택 |
|------|------|
| Frontend | React (Vite) + Tailwind CSS |
| Backend | Express.js (`server.js`) |
| 데이터 저장 | Supabase |
| AI 분석 | Claude API (claude-haiku, 백엔드 프록시 경유) |
| 배포 | AWS EC2 (port 3200), Vercel |

> Claude API 키는 브라우저에 노출되지 않고 Express 백엔드를 통해서만 호출됨.

## 실행 방법

```bash
npm install
cp .env.example .env   # ANTHROPIC_API_KEY, Supabase URL/key 입력
npm run dev             # 프론트엔드 (Vite)
node server.js          # 백엔드
```

Supabase 테이블 세팅은 `supabase-setup.sql` 참고.

## TODO

- [ ] Supabase 연동 마무리
- [ ] 카드 커스터마이징 기능 안정화
