# 묵상대학 (Meditation University)

매일 묵상을 기록하고 출석을 관리하는 챌린지 서비스.

## 기술 스택
- Frontend: React 19 + TypeScript + Vite + Tailwind CSS
- Backend: FastAPI + Python (SQLite/PostgreSQL)

## 로컬 실행

### 백엔드
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # 필요 시 값 수정
uvicorn app.main:app --reload --port 8000
```

### 프론트엔드
```bash
cd frontend
npm install
cp .env.example .env.local   # VITE_API_URL 설정
npm run dev
```

## 웹앱 배포

### 프론트엔드 — Vercel
1. GitHub 리포지토리를 [Vercel](https://vercel.com/new)에서 가져오기
2. 루트 `vercel.json` 설정이 자동 적용됨 (`frontend/` 빌드)
3. 환경 변수 추가: `VITE_API_URL=https://<백엔드_도메인>`

### 백엔드 — Render / Railway / Fly.io
컨테이너 기반 PaaS에 `backend/Dockerfile`로 배포할 수 있습니다.

**Render 예시**
1. New → Web Service → 리포지토리 선택
2. Root Directory: `backend`
3. Runtime: Docker
4. 환경 변수 설정:
   - `ADMIN_PIN` — 관리자 비밀번호
   - `CORS_ORIGINS` — 프론트엔드 도메인 (예: `https://meditation-uni.vercel.app`)
   - `DATABASE_URL` — (선택) Postgres 사용 시 `postgresql+asyncpg://...`
5. SQLite를 계속 쓰려면 Disk를 `/data`에 마운트 (Dockerfile이 해당 경로 사용)

### 환경 변수 요약

| 위치 | 변수 | 설명 |
|-----|------|------|
| 백엔드 | `ADMIN_PIN` | 관리자 PIN (기본 `1234`) |
| 백엔드 | `CORS_ORIGINS` | 허용 출처 콤마 구분 |
| 백엔드 | `DATABASE_URL` | DB 연결 문자열 |
| 프론트엔드 | `VITE_API_URL` | 백엔드 API base URL |

## API 명세
- POST `/api/posts` — 묵상 제출 (출석/지각 자동 판별)
- GET `/api/posts?user_email=` — 제출 이력
- GET `/api/posts/today?user_email=` — 오늘 상태
- GET `/api/posts/summary?user_email=` — 출석 통계
- POST `/api/fines/calculate` — 벌금 계산
- GET/POST `/api/challenges` — 챌린지 CRUD
- GET `/api/admin/challenges/{id}/attendance` — 관리자 대시보드 (PIN 헤더 필요)
- GET `/api/health` — 헬스체크

## 벌금 기준
- 지각 1회 = 결석 0.5회 환산
- 환산 결석 4회 미만: 회당 3,000원
- 환산 결석 4회 이상: 30,000원 (상한)

## 테스트

```bash
cd backend && source venv/bin/activate && pytest -v   # 51개 테스트
cd frontend && npm run lint && npm run build
```
