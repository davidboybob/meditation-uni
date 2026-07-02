# 묵상대학 (Meditation University)

소규모 그룹이 매일 묵상 기록을 제출하고 출석/지각/결석을 관리하며, 벌금을 자동 계산하는 챌린지 관리 서비스.

## 기술 스택

- **홈페이지** (`frontend/`): React 19 + TypeScript 5.9 + Vite 7 + Tailwind CSS 3 (포트 5173) — 정적 소개 사이트, home.qtuniv.com
- **운영자 콘솔** (`console/`): React 19 + TS + Vite + Tailwind + supabase-js (포트 5174) — muksang-console.vercel.app
- **DB(콘솔)**: Supabase `muksang-univ` (ref `csqcnvckyuaknjcrwlrl`, 서울) — Postgres + Auth + RLS
- **백엔드** (`backend/`): FastAPI + SQLite — **동결(레거시)**, 콘솔은 사용하지 않음
- **구조**: 모노레포 (`frontend/` + `console/` + `backend/`)
- **배포 주의**: Vercel git 자동배포 아님 — 각 디렉터리에서 `vercel --prod --yes` 수동 실행

## 개발 커맨드

### 백엔드

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000   # 개발 서버
pytest -v                                    # 전체 테스트 (25개)
pytest tests/test_posts.py                   # 묵상 제출 테스트
pytest tests/test_fines.py                   # 벌금 계산 테스트
pytest tests/test_edge_cases.py              # 엣지케이스 테스트
```

### 프론트엔드 (홈페이지)

```bash
cd frontend
npm run dev       # 개발 서버 (포트 5173)
npm run build     # tsc -b && vite build
npm run lint      # ESLint 검사
```

### 운영자 콘솔

```bash
cd console
npm run dev       # 개발 서버 (포트 5174)
npm run build     # tsc && vite build (strict 타입체크 포함)
```

## 필수 사전 커밋 체크

```bash
cd backend && source venv/bin/activate && pytest
cd frontend && npm run lint && npm run build
```

## 아키텍처

### 백엔드

```
API Layer (app/api/) → Pydantic Schemas (app/models/schemas.py) → SQLAlchemy Models (app/models/db_models.py) → Database (app/database.py)
```

### 프론트엔드

```
Pages (src/pages/) → API Client (src/api/client.ts) → Backend API
```

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | /api/posts | 묵상 제출 (하루 1회 제한) |
| GET | /api/posts?user_email= | 제출 이력 조회 |
| GET | /api/posts/today?user_email= | 오늘 제출 상태 |
| GET | /api/posts/summary?user_email= | 출석 통계 |
| POST | /api/fines/calculate | 벌금 계산 |
| GET | /api/health | 서버 상태 확인 |

## 코딩 규칙

### Python (백엔드)

- 모든 파일 상단: `from __future__ import annotations`
- Python 3.9 호환 타입: `Optional[X]`, `List[X]` 사용 (`X | Y` 금지)
- venv 활성화 필수: `source backend/venv/bin/activate`
- 시각 포맷: HH:MM 문자열 (schemas.py의 `_validate_time`으로 검증)
- 비동기 DB 세션: `Depends(get_db)` 의존성 주입 패턴 사용
- 테스트: 인메모리 SQLite, autouse fixture로 DB 초기화

### TypeScript (프론트엔드)

- strict 모드 필수
- `any` 타입 사용 금지
- API 호출: `src/api/client.ts`의 함수만 사용 (직접 fetch 금지)
- 환경변수: `VITE_API_URL` (기본값 `http://localhost:8000`)
- 스타일: Tailwind 유틸리티 클래스 우선

### 테마 색상

- 배경: `#1a3a2a`
- 텍스트: `#f5f0e8`
- 액센트: `#2d6a4f`
- 하이라이트: `#74c69d`

## 공통 함정

1. `meditation.db`는 .gitignore에 포함 — 커밋되지 않음
2. CORS가 `localhost:5173`만 허용 — 다른 포트에서 프론트엔드 실행 시 오류
3. 하루 1회 제출 제한은 `user_email` + `submitted_date` 조합 기준
4. `RequestValidationError`를 400으로 변환하는 커스텀 핸들러 존재 (`main.py`)
5. 사용자 이메일은 localStorage에 저장 (`meditation_user_email` 키)

## 참고 문서

- `SPEC.md` — 전체 기능 명세서 (Phase 1-4 계획)
- `README.md` — 빠른 시작 가이드
