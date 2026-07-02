# 구글 로그인 켜기 — 5분 가이드 (묵상대학 콘솔)

> 현재 상태: Supabase에 구글 제공자가 꺼져 있어(`google: false`) 버튼을 눌러도 동작하지 않습니다.
> 코드는 이미 준비 완료(킷 `@kit/auth-supabase` 사용, `/auth/callback` 라우트 있음). **아래 두 곳에 값만 넣으면 즉시 켜집니다.**
> 프로젝트: `muksang-univ` (ref `csqcnvckyuaknjcrwlrl`)

## 미리 복사해 둘 값 (그대로 붙여넣기)

| 붙여넣을 곳 | 값 |
|---|---|
| GCP "승인된 리디렉션 URI" | `https://csqcnvckyuaknjcrwlrl.supabase.co/auth/v1/callback` |
| GCP "승인된 JavaScript 원본" | `https://muksang-console.vercel.app` |
| Supabase "Redirect URLs"에 추가 | `https://muksang-console.vercel.app/auth/callback` |
| (로컬 개발도 쓸 경우) | `http://localhost:5174/auth/callback` |

---

## 1단계 — Google Cloud에서 OAuth 클라이언트 만들기 (약 3분)

1. https://console.cloud.google.com → 상단에서 프로젝트 선택(없으면 "새 프로젝트" → 이름 `muksang` → 만들기)
2. 왼쪽 메뉴 **API 및 서비스 → OAuth 동의 화면**
   - User Type: **외부** → 만들기
   - 앱 이름 `묵상대학`, 지원 이메일/개발자 이메일에 본인 Gmail 입력 → 저장 후 계속(범위·테스트 사용자는 그냥 계속)
   - (게시 상태가 "테스트"면 본인 계정만 로그인됨 → 나중에 "앱 게시"로 전환하면 전체 공개)
3. **API 및 서비스 → 사용자 인증 정보 → + 사용자 인증 정보 만들기 → OAuth 클라이언트 ID**
   - 애플리케이션 유형: **웹 애플리케이션**
   - **승인된 JavaScript 원본**: `https://muksang-console.vercel.app`
   - **승인된 리디렉션 URI**: `https://csqcnvckyuaknjcrwlrl.supabase.co/auth/v1/callback`
   - 만들기 → 팝업에 뜨는 **클라이언트 ID**와 **클라이언트 보안 비밀번호** 복사(둘 다 필요)

## 2단계 — Supabase에 붙여넣기 (약 1분)

1. https://supabase.com/dashboard/project/csqcnvckyuaknjcrwlrl/auth/providers 접속
2. 목록에서 **Google** 클릭 → 토글 **Enable** 켜기
3. **Client ID** / **Client Secret**에 1단계에서 복사한 값 붙여넣기 → **Save**
4. 좌측 **Authentication → URL Configuration → Redirect URLs**에서 **Add URL**로 아래 추가 → Save
   - `https://muksang-console.vercel.app/auth/callback`
   - (로컬도 쓰면) `http://localhost:5174/auth/callback`

## 3단계 — 확인

- 콘솔 로그인 화면(https://muksang-console.vercel.app/login)에서 **"Google로 계속하기"** → 구글 계정 선택 → 자동으로 콘솔 진입되면 성공.
- 처음 로그인하는 계정은 가입 트리거가 자동으로 그룹 멤버로 편입합니다(운영자 이메일이면 owner).
- 안 되면: 버튼 클릭 시 "구글 로그인이 아직 준비되지 않았어요" 토스트가 뜨면 2단계 Enable/Save가 안 된 것, 구글 화면에서 `redirect_uri_mismatch`가 뜨면 1단계 리디렉션 URI 오타입니다(위 표 값과 정확히 일치해야 함).

---

## 자동 상태 점검

가이드대로 켠 뒤 아래로 즉시 확인할 수 있습니다(제공자 on/off만 공개 노출):

```bash
node console/scripts/check-google.mjs
# ✅ google: enabled  또는  ⏳ google: disabled (아직 미설정)
```
