# 묵상대학 (Meditation University)

1일 1묵상으로 4년 성경통독을 함께 완주하는 챌린지 서비스.

| 앱 | 위치 | 라이브 |
|---|---|---|
| 홈페이지(정적 소개) | `frontend/` | https://home.qtuniv.com |
| 콘솔(운영자+멤버) | `console/` | https://muksang-console.vercel.app |
| ~~레거시 백엔드~~ | `backend/` | 동결 — 콘솔은 Supabase 사용 |

## 기술 스택

- **프론트**: React 19 + TypeScript + Vite + Tailwind (홈·콘솔 공통)
- **백엔드**: Supabase `muksang-univ` — Postgres + Auth + RLS (별도 서버 없음)
- **공유 킷**: `~/source/00-shared-kit` — `@kit/challenge`(정산·스트릭)·`@kit/kakao`·`@kit/utils`를 `file:` 프로토콜로 소비

## 로컬 실행

```bash
# 홈페이지
cd frontend && npm install && npm run dev     # http://localhost:5173

# 콘솔 (킷 심볼릭 설치 포함)
cd console && npm install --install-links && npm run dev   # http://localhost:5174
```

## 배포 (Vercel — git 자동배포 아님, CLI 수동)

```bash
# 홈페이지: 레포 루트에서
vercel --prod --yes

# 콘솔: 로컬 프리빌드 방식 (Vercel은 dist만 서빙)
cd console && npm run build && vercel --prod --yes
```

## 검증

```bash
cd frontend && npm run lint && npm run build          # 홈
cd console && npm run build                            # 콘솔(strict tsc 포함)
MUKSANG_TEST_PW='<테스트 비번>' node console/scripts/smoke.mjs   # e2e 스모크(정산·RLS)
```

## 규칙(정산) 요약

회비 30,000원 기준 — 결석 1회 −10% · 지각 1회 −5% · 지각 2회 = 결석 1회 환산 · 환산결석 4회 초과 시 전액 차감 · 100% 달성 시 전액 환급 + 다음 달 이월 + 장학. 계산은 DB 함수 `calculate_settlement`가 수행하며 그룹 설정에서 파라미터 조정 가능.

## 주요 문서

- [MORNING_BRIEF.md](./MORNING_BRIEF.md) — 최신 기능 현황 요약
- [UPGRADE_LOG.md](./UPGRADE_LOG.md) — 업그레이드 백로그·이력
- [SPEC_ADMIN_DASHBOARD.md](./SPEC_ADMIN_DASHBOARD.md) — 콘솔 기획서
- [docs/supabase-schema.sql](./docs/supabase-schema.sql) — DB 스키마 정본(1회 실행 재현)
- [docs/KAKAO_INTEGRATION.md](./docs/KAKAO_INTEGRATION.md) — 카카오톡 연동 로드맵
- 새 챌린지 서비스 스캐폴드: `~/source/00-shared-kit/docs/CHALLENGE_STARTER.md`
