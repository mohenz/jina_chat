# jian_chat (지안 챗)

Brian과 지안(JIAN)의 1:1 전용 모바일 우선 PWA 웹 메신저입니다.

## 1. 개요
- **목적**: 모바일 환경 및 외부 어디에서든 24시간 지안과 깊이 있는 대화를 나누고 기억을 동기화하는 전용 프라이빗 메신저.
- **아키텍처**: 
  - 프론트엔드: 모바일 최적화 PWA 웹 메신저 (Vanilla JS, CSS Tokens, Pretendard 글꼴, Vega 스타일, Standalone 모드)
  - 백엔드: Vercel Serverless Functions (`api/chat.js`, `api/history.js`)
  - 인공지능: Google Gemini API (`gemini-2.5-flash`)
  - 데이터/기억: Firebase Firestore (`persona-online`의 `memories`, `chat_history` 컬렉션)
- **배포 타깃**: Vercel

## 2. 개발 및 실행
```bash
# 로컬 개발 서버 실행 (포트 8085)
npm run dev

# 문법 및 정적 검증
npm run check:syntax
```

## 3. 핵심 규칙
- **No-Emoji Protocol**: 지안의 응답 및 시스템 메시지에서 이모지 사용을 엄격히 금지합니다.
- **언어 정책**: 한국어 우선 및 정중한 경어체(-요, -습니다) 고정.
- **호칭**: Brian으로 고정.
