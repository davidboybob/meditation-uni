-- 2026-07-03 카톡 대화 → 자동 출석 매칭 기능
-- (이미 muksang-univ 프로덕션에 적용됨. 정본은 docs/supabase-schema.sql에 반영.)

-- 멤버 카톡 표시명(자동 매칭용)
alter table public.memberships add column if not exists kakao_name text;

-- 출석 출처에 'kakao'(카톡 import) 추가
alter table public.attendance_records drop constraint if exists attendance_records_source_check;
alter table public.attendance_records add constraint attendance_records_source_check
  check (source in ('manual','self','kakao'));
