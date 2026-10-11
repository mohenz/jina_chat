# jian_chat 시스템 설계서

## 1. 프로젝트 목표
모바일 및 외부 환경 어디에서든 Brian과 지안이 24시간 실시간으로 교감하고 대화할 수 있는 독립 PWA 메신저를 제공합니다.

## 2. 기술 스택
- **프론트엔드**: HTML5, Vanilla JavaScript, CSS Design Tokens, Pretendard Variable 글꼴, Vega 스타일 토큰 (Radix 감성), PWA (Service Worker + Web App Manifest)
- **백엔드 API**: Vercel Serverless Functions (`/api/chat`, `/api/history`)
- **인공지능 모델**: Google Gemini 2.5 Flash API
- **데이터 저장소**: Firebase Firestore (`persona-online`)
  - `chat_history`: 턴별 대화 내역 저장
  - `memories`: 주요 기억 및 상태 동기화

## 3. UI/UX 디자인 원칙
- **Bloom UI 표준 준수**: Pretendard Variable 글꼴, 4px 간격 체계, 최소 44px 모바일 터치 타깃, Vega 스타일 토큰.
- **모바일 Safe Area 대응**: iOS 및 Android의 노치, 홈 인디케이터에 맞춘 `env(safe-area-inset-bottom)` 여백 처리.
- **Standalone 모드**: 브라우저 UI 없이 네이티브 앱 형태로 동작.
- **No-Emoji Protocol**: 시스템 및 지안의 모든 텍스트에서 이모지 배제.

## 4. API 인터페이스
- `POST /api/chat`: Brian의 발화를 수신하고 페르소나/기억 컨텍스트를 주입하여 Gemini API 호출 후 답변 반환.
- `GET /api/history`: 최근 대화 내역 조회 및 클라이언트 화면 복원.
