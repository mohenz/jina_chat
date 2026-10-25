# jian_chat (지안 챗 - Microsoft Teams 스타일)

Brian과 지안(JIAN)의 1:1 전용 모바일 우선 Microsoft Teams 스타일 PWA 메신저입니다.

## 1. 개요
- **목적**: 모바일 환경 및 외부 어디에서든 24시간 지안과 깊이 있는 대화를 나누고 기억을 동기화하는 전용 프라이빗 메신저.
- **UI 디자인**: Microsoft Teams 모바일 스타일 완벽 구현 (Fluent Design, Pretendard 글꼴, Teams 퍼플 테마, 상대방/본인 정통 카드 레이아웃, Safe Area 대응).
- **아키텍처**: 
  - 프론트엔드: HTML5, CSS Tokens, Vanilla JS, PWA (Standalone, Service Worker 캐싱)
  - 백엔드: Vercel Serverless Functions (`api/chat.js`, `api/history.js`, `api/health.js`)
  - 인공지능: Google Gemini 2.5 Flash API (`lib/gemini.js`)
  - 데이터/기억: Firebase Firestore (`persona-online`의 `chat_history`, `memories` 컬렉션)
- **로컬 구동 포트**: `8085` (`http://127.0.0.1:8085`)
- **배포 타깃**: Vercel

## 2. 개발 및 실행
```bash
# 로컬 개발 서버 실행 (포트 8085)
npm run dev

# 문법 및 정적 검증
npm run check:syntax
```

### 날씨 브리핑 설정
- 기상청 단기예보를 사용하며 API 키는 서버 환경변수 `KMA_SERVICE_KEY`로 읽습니다.
- 로컬 실행 시 `.env`에 `KMA_SERVICE_KEY=발급받은_인증키`를 설정합니다. `.env`는 Git에 포함하지 않습니다.
- Vercel 배포 환경에서는 Project Settings의 Environment Variables에 같은 키를 등록해야 날씨 브리핑이 동작합니다.
- 화면의 상단 왼쪽 버튼을 누르면 브리핑이 열립니다. 지역을 선택하거나 위치 권한을 허용해 현재 위치의 예보를 볼 수 있습니다.

## 3. 핵심 규칙
- **No-Emoji Protocol**: 지안의 응답 및 시스템 메시지에서 이모지 사용을 엄격히 금지합니다.
- **언어 정책**: 한국어 우선 및 정중한 경어체(-요, -습니다) 고정.
- **호칭**: Brian으로 고정.

## 4. 후속 작업 로드맵
1. **Gemini API 키 교체**: Google AI Studio에서 무료 발급 후 `.env`의 `GOOGLE_API_KEY` 교체
2. **원격 저장소 연동**: GitHub `mohenz/jian_chat` push
3. **Vercel 프로덕션 배포**: 환경 변수 등록 후 클라우드 상시 배포
4. **모바일 홈 화면 추가**: 스마트폰 브라우저에서 '홈 화면에 추가'하여 앱처럼 사용
