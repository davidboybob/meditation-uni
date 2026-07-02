# ☀️ 아침 브리핑 — 야간 자율 업그레이드 결과 (2026-07-02 밤 ~ 07-03)

> 요청: "지속 업그레이드 + 킷에 재사용 기능 축적 + 아이디어만 바꿔 바로 배포 가능하게"
> 결과: **6 이터레이션, 콘솔 신기능 8종 + 킷 패키지 3종 + 스타터 가이드** — 전부 배포·검증 완료.

## 🔗 바로 확인

| 무엇 | 어디서 |
|---|---|
| 홈페이지 | https://home.qtuniv.com (PWA 설치 가능, OG 미리보기 적용) |
| 콘솔 (운영자) | https://muksang-console.vercel.app — `test-operator@qtuniv.com` / `MuksangTest!2026` |
| 콘솔 (멤버 체험) | 같은 주소 — `test-member1@qtuniv.com` / 동일 비번 → "내 묵상" 화면 |
| 공유 킷 | `~/source/00-shared-kit` (신규 패키지 3종 + 스타터) |
| 상세 로그 | [UPGRADE_LOG.md](./UPGRADE_LOG.md) · 커밋 히스토리 main `05bf5ae…c54f5fc`+ |

## 🌙 밤새 추가된 것

**콘솔 신기능**
1. **나눔 피드**(/feed) — 서로의 묵상 읽고 답글(규칙의 '나눔하기' 콘솔화), 본인/운영자 삭제
2. **오늘 목표 체크리스트**(내 묵상) — 제출 ✅ + 답글 1회 ✅, 달성 시 🎉
3. **대시보드**: 이번 달 리더보드(🥇🥈🥉, 스트릭) · 나눔 참여 현황 · 미기록 전원 출석 버튼 · 주간 리포트 복사
4. **통독 일정 자동 생성기** — 책+장 범위+시작일 → 하루 1장 자동 배정(주일 제외 옵션)
5. **출석부 정정 이력** 모달(감사 로그 열람) · **다크모드**(🌓 토글, 시스템 감지)
6. PWA(홈·콘솔 설치형) · ErrorBoundary · e2e 스모크 스크립트(`console/scripts/smoke.mjs`)

**공유 킷 (아이디어→배포의 핵심)**
- `@kit/challenge` — 정산 엔진·스트릭·출석 통계·랭킹 순수함수 (+ **Supabase 스키마 템플릿** 동봉)
- `@kit/kakao` — 카카오 공유 SDK 로더 · `@kit/utils` — CSV/클립보드
- **`docs/CHALLENGE_STARTER.md`** — 새 챌린지 서비스 "아이디어→배포 45분" 체크리스트 (Supabase 10분 → 스캐폴드 20분 → 킷 연결 2분 → 배포 5분 → 스모크 10분). 운동/독서/기상 챌린지 변형 예시 포함
- 콘솔이 킷을 실소비 중(중복 코드 제거) = 킷 실전 검증 완료

## ⚙️ 운영 메모
- 배포 방식: 콘솔은 **로컬 프리빌드**(`cd console && npm run build && vercel --prod --yes`, ~5초). 홈은 루트에서 `vercel --prod --yes`
- 스모크: `MUKSANG_TEST_PW='<비번>' node console/scripts/smoke.mjs`
- Supabase 어드바이저 잔여 1건(WARN): 대시보드 → Auth → "Leaked password protection" 토글만 켜면 끝

## 🙋 아침에 결정해 주시면 좋은 것
1. **테스트 데이터 정리 시점** — 실운영 시작 전 테스트 계정 3개 + 시드 출석/정산 삭제(말씀만 주시면 일괄 정리)
2. **카카오 공유 활성화** — JS 키 발급하면 버튼 자동 등장(절차: `docs/KAKAO_INTEGRATION.md`)
3. **구글 로그인** — Supabase에 GCP 키 등록 여부
4. **console.qtuniv.com** — DNS CNAME 추가 여부(현재 muksang-console.vercel.app)
