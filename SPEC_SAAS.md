# 묵상대학 콘솔 SaaS 전환 기획서 (초안 v0.1)

> 작성일: 2026-07-01 · 상태: 기획 확정, Phase 1 설계
> 결정된 방향: **B2C(개인 중심) · 소셜+이메일 인증 · 전부 무료 · MVP는 콘솔 대시보드 우선**
> 확정 스택: **Supabase 풀 전환(Postgres + Auth + RLS)** · 우선 소셜: **구글**

---

## 1. 배경 & 목표

### 현재(As-Is)
- 단일 테넌트 챌린지 트래커. "단일 그룹"을 암묵적으로 가정.
- 계정 개념 없음 — `localStorage`의 이메일 문자열로 사용자 식별 (`meditation_user_email`).
- 묵상 제출 / 이력 / 챌린지 / 벌금 계산 기능 보유. 랜딩 페이지 신규 완성(`/`).

### 목표(To-Be)
- **개인이 가입해 묵상 그룹을 만들고 참여하는 B2C SaaS**로 전환.
- 로그인 후 **개인 콘솔(대시보드)**을 중심으로 한 경험.
- 인증은 **소셜(카카오/구글) + 이메일**. 결제·수익화는 **보류(전부 무료)**.
- "묵상 시작하기" CTA는 단일 앱 직행이 아니라 **로그인 → 콘솔** 흐름으로 진입.

### 비목표(Non-goals, 이번 단계)
- 결제/구독/PG 연동, 벌금 실제 정산.
- 완전한 멀티그룹/워크스페이스 전환(스키마는 대비하되 동작은 Phase 2).
- 조직(교회) 단위 3계층 테넌시.

---

## 2. 타깃 & 핵심 시나리오

한 계정이 **그룹마다 다른 역할**(방장 또는 멤버)을 가질 수 있다.

| 페르소나 | 시나리오 |
|---|---|
| **개인 참여자** | 가입 → (초대코드로) 그룹 참여 → 매일 묵상 제출 → 내 콘솔에서 연속 출석·통계 확인 |
| **방장(그룹 생성자)** | 가입 → 그룹 생성 → 초대코드 공유 → 콘솔에서 멤버 출석/지각/벌금 현황 모니터링·규칙 설정 |

> MVP에서는 "기본 그룹 1개"만 동작 — 가입하면 자동으로 기본 그룹에 소속. 그룹 생성/다중 참여는 Phase 2.

---

## 3. 도메인 모델 (멀티테넌시 대비 설계)

지금 당장 멀티그룹을 켜지 않더라도, **스키마는 처음부터 그룹·계정 기준**으로 잡아 나중에 마이그레이션 비용을 없앤다.

```
User (계정)
  id, email, auth_provider(email|kakao|google), display_name, created_at

Group (모임/워크스페이스)
  id, name, owner_user_id, join_code, deadline_default, fine_per_absence, created_at

Membership (소속·역할)
  id, user_id → User, group_id → Group, role(owner|member), joined_at
  ※ (user_id, group_id) 유니크

Post (묵상)  ← 기존 테이블 확장
  id, group_id → Group, user_id → User,   // 기존 user_email 대체
      content, submitted_date, submission_time, deadline_time, status
```

- **핵심 변경**: 기존 `user_email` 기준 식별 → `user_id`(+`group_id`) FK 기준으로 전환.
- 출석/벌금 계산은 항상 `group_id` 컨텍스트 안에서 수행.
- MVP 마이그레이션: 기존 데이터는 "기본 그룹 + 이메일→임시 계정" 매핑으로 이관.

---

## 4. 인증 설계

- **방식**: 소셜(카카오·구글 OAuth) + 이메일/비밀번호.
- **MVP 우선순위**: 이메일 가입 + 소셜 1종 먼저(나머지 소셜은 빠르게 추가).
- **세션**: 토큰(JWT) 또는 세션 쿠키. 프론트는 인증 상태에 따라 보호 라우트 제어.
- **보호 라우트**: `/console/*`는 비로그인 시 `/login`으로 리다이렉트.

> ⚙️ **핵심 기술 결정 (5절 참고)**: 인증을 직접 구현할지, Supabase 같은 BaaS로 갈지에 따라 백엔드 작업량이 크게 갈린다.

---

## 5. 기술 방향 — 인증/DB 구현 선택지

| 항목 | (A) 직접 구현 (현행 FastAPI+SQLite 유지) | (B) Supabase 도입 (추천) |
|---|---|---|
| 소셜 로그인 | OAuth 콜백 직접 구현(카카오/구글 각각) | 기본 제공(구글/카카오 등 토글) |
| 이메일/비번 | 해시·검증·재설정 메일 직접 | 기본 제공 |
| DB | SQLite 유지(멀티테넌시·동시성 한계) | Postgres + RLS로 테넌시 격리 |
| 무료 | 호스팅만 부담 | 무료 tier 충분 |
| 작업량 | 큼(인증 보일러플레이트 많음) | 작음(핵심 로직에 집중) |
| 비고 | 기존 코드 연속성 | 현 세션에 Supabase MCP/스킬 사용 가능 |

> **추천: (B) Supabase.** "무료 + 소셜+이메일 + B2C 멀티테넌시"라는 요구에 가장 잘 맞고, 인증 보일러플레이트를 줄여 콘솔 UX에 집중할 수 있다. 단, 기존 FastAPI/SQLite 자산을 어디까지 유지할지는 확정 필요(아래 열린 질문).

---

## 6. 화면 / 콘솔 구조

| 구분 | 경로 | 설명 | 상태 |
|---|---|---|---|
| 공개 | `/` | 랜딩 페이지 | ✅ 완성 |
| 인증 | `/login`, `/signup` | 소셜 버튼 + 이메일 폼 | 신규 |
| 콘솔 | `/console` | 대시보드: 오늘 상태·연속 출석·그룹 요약·제출 진입 | 신규 |
| 콘솔 | `/console/submit` | 묵상 제출 (기존 HomeScreen 재활용) | 이관 |
| 콘솔 | `/console/history` | 제출 이력 | 이관 |
| 콘솔 | `/console/group` | 그룹: 멤버 출석/지각/벌금 표 (방장=관리, 멤버=보기) | 신규+이관 |
| 콘솔 | `/console/settings` | 프로필 | 신규 |

- **레이아웃**: 콘솔은 좌측/상단 네비를 가진 대시보드 셸. 기존 모바일 하단 탭은 콘솔 셸로 흡수.
- **"묵상 시작하기" CTA**: 로그인 상태면 `/console`, 비로그인이면 `/login`(가입 유도). ← 요청하신 버튼 동작 수정 지점.

---

## 7. MVP 범위 (Phase 1) — "콘솔 대시보드 우선"

1. 인증 도입(이메일 + 소셜 1종) 및 로그인/가입 화면.
2. 계정 기반 데이터 전환(이메일 → user_id), "기본 그룹" 단일 테넌시로 동작.
3. 콘솔 대시보드 신설 + 기존 기능(제출/이력/챌린지/벌금)을 `/console/*`로 재배치.
4. 랜딩 CTA 라우팅을 로그인/콘솔 흐름으로 수정.

**Phase 1에서 제외**: 그룹 생성·다중 참여, 결제, 알림.

---

## 8. 이후 단계 (Phase 2+)

- 멀티그룹/워크스페이스: 그룹 생성, 초대코드 참여, 그룹 전환 UI.
- 역할·권한 정교화(방장 위임, 멤버 강퇴 등).
- 리마인더 알림(마감 전 푸시/메일), 통계 고도화(리더보드).
- (보류) 수익화/결제 — 필요 시 벌금 정산 또는 프리미엄.

---

## 9. 리스크 & 영향

- **데이터 마이그레이션**: 기존 이메일 기반 Post → 계정·그룹 기준. 일회성 스크립트 필요.
- **백엔드 인증 컨텍스트**: 모든 API에 인증 미들웨어 + `current_user`/`group_id` 주입.
- **CORS·배포**: Vercel 프론트 + 백엔드/BaaS, OAuth 리다이렉트 URL 등록.
- **DB 선택**: SQLite 유지 시 동시성·테넌시 한계 → Postgres(Supabase) 전환 검토.

---

## 10. 결정 사항 (확정)

1. ✅ **인증/DB 스택**: **Supabase 풀 전환** — Postgres + Auth + RLS. 기존 FastAPI/SQLite는 축소·폐기.
2. ✅ **우선 소셜**: **구글 먼저** (카카오는 Phase 1.5에서 토글 추가).
3. ✅ **기존 백엔드 유지 범위**: 도메인 로직(묵상/벌금)을 **Supabase(Postgres 제약·뷰·함수)로 이전**. FastAPI는 유지하지 않음. (단, 벌금 계산 등 검증된 파이썬 로직은 SQL/Edge Function으로 포팅 시 기존 테스트를 참조 기준으로 활용.)

→ 아래 11절에서 Phase 1 상세 설계.

---

## 11. Phase 1 상세 설계 (Supabase 기준)

### 11.1 아키텍처 개요
```
[React + Vite + Tailwind]
   └─ @supabase/supabase-js
        ├─ Auth (Google OAuth + Email/Password)
        └─ PostgREST (DB 직접 쿼리, RLS로 보호)
   ※ 별도 백엔드 서버 없음. 복잡 로직은 Postgres 함수/뷰 또는 Edge Function.
```

### 11.2 DB 스키마 (Postgres DDL 초안)
```sql
-- 계정 프로필 (auth.users 1:1 확장)
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  created_at  timestamptz not null default now()
);

-- 모임/워크스페이스
create table public.groups (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  owner_id      uuid not null references public.profiles(id),
  join_code     text unique not null,            -- 초대코드 (Phase 2 본격 사용)
  deadline_default text not null default '06:00', -- HH:MM
  fine_per_absence int not null default 1000,
  created_at    timestamptz not null default now()
);

-- 소속·역할
create table public.memberships (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.profiles(id) on delete cascade,
  group_id  uuid not null references public.groups(id) on delete cascade,
  role      text not null default 'member' check (role in ('owner','member')),
  joined_at timestamptz not null default now(),
  unique (user_id, group_id)
);

-- 묵상 (기존 posts 확장: user_email → user_id, +group_id)
create table public.posts (
  id             uuid primary key default gen_random_uuid(),
  group_id       uuid not null references public.groups(id) on delete cascade,
  user_id        uuid not null references public.profiles(id) on delete cascade,
  content        text not null,
  submitted_date date not null,
  submission_time text not null,                 -- HH:MM
  deadline_time   text not null,                 -- HH:MM
  status         text not null check (status in ('present','late','absent')),
  created_at     timestamptz not null default now(),
  unique (user_id, group_id, submitted_date)     -- 하루 1회 제한
);
```

### 11.3 RLS 정책 개요
- `profiles`: 본인 행만 select/update. insert는 가입 트리거로 자동.
- `memberships`: 본인 소속만 select. 같은 그룹 멤버 목록은 "그룹 공통 멤버" 뷰/정책으로 허용.
- `groups`: 소속 멤버만 select. update/delete는 `role='owner'`만.
- `posts`: 같은 그룹 멤버는 select(서로의 출석 현황 열람), insert/update는 본인 행만.
- 신규 가입 시 트리거: `auth.users` insert → `profiles` 생성 + 기본 그룹 membership 부여(MVP 단일 그룹).

### 11.4 인증 흐름
- 구글: `supabase.auth.signInWithOAuth({ provider: 'google' })` → 리다이렉트 콜백.
- 이메일: `signUp` / `signInWithPassword`, 비번 재설정은 Supabase 메일 템플릿 사용.
- 세션: `supabase.auth.onAuthStateChange`로 전역 상태 관리(Context).
- 보호 라우트: 세션 없으면 `/login`으로 리다이렉트하는 `<RequireAuth>` 래퍼.

### 11.5 프론트 라우팅 변경
```
/                     랜딩 (완성)
/login, /signup       인증 (신규)
/auth/callback        OAuth 콜백 처리 (신규)
/console              대시보드 (신규)
/console/submit       묵상 제출  (기존 HomeScreen 이관)
/console/history      이력      (기존 HistoryScreen 이관)
/console/group        그룹 현황 (기존 Challenge/Admin 통합·이관)
/console/settings     프로필    (신규)
```
- 기존 `/app/*`는 `/console/*`로 대체. 랜딩 CTA "묵상 시작하기" → 세션 있으면 `/console`, 없으면 `/login`.
- API 클라이언트: 기존 `src/api/client.ts`(fetch→FastAPI)를 `supabase-js` 쿼리로 교체.

### 11.6 데이터 마이그레이션
- 기존 `meditation.db`(SQLite)의 posts를 추출 → 이메일별 임시 계정/프로필 생성 → 기본 그룹 매핑 → `public.posts`로 적재하는 일회성 스크립트.
- 또는 기존 데이터가 테스트용이면 폐기하고 신규 시작(상황 확인 필요).

### 11.7 Phase 1 작업 체크리스트
1. Supabase 프로젝트 생성 + 구글 OAuth/이메일 설정.
2. 위 스키마 + RLS + 가입 트리거 마이그레이션 적용.
3. 프론트에 `supabase-js` 도입, Auth Context·보호 라우트.
4. `/login`·`/signup`·`/auth/callback` 화면.
5. 콘솔 셸 레이아웃 + `/console` 대시보드.
6. 기존 화면을 `/console/*`로 이관 + `client.ts`를 supabase 쿼리로 교체.
7. 랜딩 CTA 라우팅 수정.
8. (선택) 기존 데이터 마이그레이션 스크립트.

### 11.8 다음 확인 필요
- Supabase 프로젝트: 신규 생성 진행할지(현 세션 Supabase 연동 사용).
- 기존 `meditation.db` 데이터: 이관 vs 신규 시작.
- 콘솔 레이아웃 스타일: 랜딩의 인디고→바이올렛 톤 유지로 통일.
