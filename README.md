# 묵상대학 (Meditation University)

매일 묵상을 기록하고 출석을 관리하는 챌린지 서비스.

## 기술 스택
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS
- Backend: FastAPI + Python

## 실행 방법

### 백엔드
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 프론트엔드
```bash
cd frontend
npm install
npm run dev
```

## API 명세
- POST /api/posts — 묵상 제출 + 출석/지각 판별
- POST /api/fines/calculate — 벌금 계산
- GET /api/health — 서버 상태 확인

## 벌금 기준
- 지각 1회 = 결석 0.5회 환산
- 환산 결석 4회 미만: 회당 3,000원
- 환산 결석 4회 이상: 30,000원 (상한)
