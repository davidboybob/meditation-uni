-- ============================================================
-- 챌린지형 서비스(묵상대학) Supabase 스키마 정본 v1
-- 새 프로젝트에 그대로 실행하면 동일한 백엔드가 완성된다.
-- 구성: 계정/그룹/멤버십 · 출석 기록+감사로그 · 통독(콘텐츠) 일정 · 월 정산
--       + RLS 전체 + 가입 트리거 + 정산/셀프제출 함수
-- 마지막 검증: 2026-07-02 (muksang-univ, advisors 0건)
-- ============================================================

-- 0) 스키마/확장 ------------------------------------------------
create schema if not exists private;
grant usage on schema private to authenticated;

-- 1) 테이블 -----------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  created_at   timestamptz not null default now()
);

create table if not exists public.groups (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  owner_id         uuid references public.profiles(id) on delete set null,
  join_code        text unique not null,
  deadline_default text not null default '06:00',
  fine_per_absence int  not null default 1000,          -- (레거시 필드, 규칙은 아래 파라미터 사용)
  monthly_fee      int     not null default 30000,
  absence_rate     numeric not null default 0.10,
  late_rate        numeric not null default 0.05,
  late_per_absence int     not null default 2,
  absence_limit    int     not null default 4,
  late_cutoff      text,
  created_at       timestamptz not null default now()
);

create table if not exists public.memberships (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.profiles(id) on delete cascade,
  group_id  uuid not null references public.groups(id) on delete cascade,
  role      text not null default 'member' check (role in ('owner','admin','member')),
  active    boolean not null default true,
  joined_at timestamptz not null default now(),
  unique (user_id, group_id)
);

create table if not exists public.attendance_records (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  date       date not null,
  status     text not null check (status in ('present','late','absent','excused')),
  source     text not null default 'manual' check (source in ('manual','self')),
  note       text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (group_id, user_id, date)
);

create table if not exists public.attendance_adjustments (
  id          uuid primary key default gen_random_uuid(),
  record_id   uuid not null references public.attendance_records(id) on delete cascade,
  old_status  text,
  new_status  text not null,
  reason      text not null,
  adjusted_by uuid not null references public.profiles(id),
  created_at  timestamptz not null default now()
);

create table if not exists public.reading_plans (
  id       uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  date     date not null,
  passage  text not null,
  unique (group_id, date)
);

create table if not exists public.settlements (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null references public.groups(id) on delete cascade,
  month        text not null,
  status       text not null default 'draft' check (status in ('draft','confirmed')),
  confirmed_by uuid references public.profiles(id),
  confirmed_at timestamptz,
  created_at   timestamptz not null default now(),
  unique (group_id, month)
);

create table if not exists public.settlement_items (
  id                 uuid primary key default gen_random_uuid(),
  settlement_id      uuid not null references public.settlements(id) on delete cascade,
  user_id            uuid not null references public.profiles(id),
  absences           int not null,
  lates              int not null,
  effective_absences int not null,
  deduction          int not null,
  refund             int not null,
  carryover          boolean not null default false,
  scholarship        boolean not null default false,
  carryover_in       boolean not null default false,
  memo               text,
  unique (settlement_id, user_id)
);

-- 2) RLS 활성화 + 권한 -----------------------------------------
alter table public.profiles               enable row level security;
alter table public.groups                 enable row level security;
alter table public.memberships            enable row level security;
alter table public.attendance_records     enable row level security;
alter table public.attendance_adjustments enable row level security;
alter table public.reading_plans          enable row level security;
alter table public.settlements            enable row level security;
alter table public.settlement_items       enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on
  public.profiles, public.groups, public.memberships,
  public.attendance_records, public.attendance_adjustments,
  public.reading_plans, public.settlements, public.settlement_items
to authenticated;

-- 3) private 헬퍼 (SECURITY DEFINER — API 미노출 스키마) ---------
create or replace function private.user_in_group(gid uuid)
returns boolean language sql security definer set search_path = '' stable as $$
  select exists (select 1 from public.memberships
                 where group_id = gid and user_id = auth.uid());
$$;
revoke execute on function private.user_in_group(uuid) from public;
grant execute on function private.user_in_group(uuid) to authenticated;

create or replace function private.shares_group_with(other uuid)
returns boolean language sql security definer set search_path = '' stable as $$
  select exists (select 1 from public.memberships m1
                 join public.memberships m2 on m1.group_id = m2.group_id
                 where m1.user_id = auth.uid() and m2.user_id = other);
$$;
revoke execute on function private.shares_group_with(uuid) from public;
grant execute on function private.shares_group_with(uuid) to authenticated;

create or replace function private.is_group_admin(gid uuid)
returns boolean language sql security definer set search_path = '' stable as $$
  select exists (select 1 from public.memberships
                 where group_id = gid and user_id = auth.uid()
                   and role in ('owner','admin'));
$$;
revoke execute on function private.is_group_admin(uuid) from public;
grant execute on function private.is_group_admin(uuid) to authenticated;

create or replace function private.is_group_owner(gid uuid)
returns boolean language sql security definer set search_path = '' stable as $$
  select exists (select 1 from public.memberships
                 where group_id = gid and user_id = auth.uid() and role = 'owner');
$$;
revoke execute on function private.is_group_owner(uuid) from public;
grant execute on function private.is_group_owner(uuid) to authenticated;

-- 4) RLS 정책 ---------------------------------------------------
drop policy if exists "profiles_select"     on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_select" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or private.shares_group_with(id));
create policy "profiles_update_own" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "groups_select"       on public.groups;
drop policy if exists "groups_update_admin" on public.groups;
create policy "groups_select" on public.groups for select to authenticated
  using (private.user_in_group(id));
create policy "groups_update_admin" on public.groups for update to authenticated
  using (private.is_group_admin(id)) with check (private.is_group_admin(id));

drop policy if exists "memberships_select"       on public.memberships;
drop policy if exists "memberships_update_admin" on public.memberships;
create policy "memberships_select" on public.memberships for select to authenticated
  using (private.user_in_group(group_id));
-- owner 보호: admin은 owner 행 접근/owner 승격 불가 (owner만 가능)
create policy "memberships_update_admin" on public.memberships for update to authenticated
  using (private.is_group_admin(group_id)
         and (private.is_group_owner(group_id) or role <> 'owner'))
  with check (private.is_group_admin(group_id)
              and (private.is_group_owner(group_id) or role <> 'owner'));

-- 마지막 owner 강등/삭제 방지
create or replace function private.protect_last_owner()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_owner_cnt int;
begin
  if tg_op = 'UPDATE' and old.role = 'owner' and new.role <> 'owner' then
    select count(*) into v_owner_cnt from public.memberships
    where group_id = old.group_id and role = 'owner';
    if v_owner_cnt <= 1 then
      raise exception '마지막 운영자(소유)는 강등할 수 없습니다. 먼저 다른 owner를 지정하세요.';
    end if;
  elsif tg_op = 'DELETE' and old.role = 'owner' then
    select count(*) into v_owner_cnt from public.memberships
    where group_id = old.group_id and role = 'owner';
    if v_owner_cnt <= 1 then
      raise exception '마지막 운영자(소유)는 삭제할 수 없습니다.';
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke execute on function private.protect_last_owner() from public;

drop trigger if exists trg_protect_last_owner on public.memberships;
create trigger trg_protect_last_owner
  before update or delete on public.memberships
  for each row execute function private.protect_last_owner();

drop policy if exists "att_select"      on public.attendance_records;
drop policy if exists "att_insert"      on public.attendance_records;
drop policy if exists "att_insert_self" on public.attendance_records;
drop policy if exists "att_update"      on public.attendance_records;
drop policy if exists "att_delete"      on public.attendance_records;
create policy "att_select" on public.attendance_records for select to authenticated
  using (private.user_in_group(group_id));
create policy "att_insert" on public.attendance_records for insert to authenticated
  with check (private.is_group_admin(group_id));
create policy "att_insert_self" on public.attendance_records for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and private.user_in_group(group_id)
    and source = 'self'
    and status in ('present','late')
    and date = (now() at time zone 'Asia/Seoul')::date
  );
create policy "att_update" on public.attendance_records for update to authenticated
  using (private.is_group_admin(group_id)) with check (private.is_group_admin(group_id));
create policy "att_delete" on public.attendance_records for delete to authenticated
  using (private.is_group_admin(group_id));

drop policy if exists "adj_select" on public.attendance_adjustments;
drop policy if exists "adj_insert" on public.attendance_adjustments;
create policy "adj_select" on public.attendance_adjustments for select to authenticated
  using (exists (select 1 from public.attendance_records r
                 where r.id = record_id and private.is_group_admin(r.group_id)));
create policy "adj_insert" on public.attendance_adjustments for insert to authenticated
  with check (adjusted_by = (select auth.uid())
              and exists (select 1 from public.attendance_records r
                          where r.id = record_id and private.is_group_admin(r.group_id)));

drop policy if exists "plan_select" on public.reading_plans;
drop policy if exists "plan_write"  on public.reading_plans;
drop policy if exists "plan_update" on public.reading_plans;
drop policy if exists "plan_delete" on public.reading_plans;
create policy "plan_select" on public.reading_plans for select to authenticated
  using (private.user_in_group(group_id));
create policy "plan_write" on public.reading_plans for insert to authenticated
  with check (private.is_group_admin(group_id));
create policy "plan_update" on public.reading_plans for update to authenticated
  using (private.is_group_admin(group_id)) with check (private.is_group_admin(group_id));
create policy "plan_delete" on public.reading_plans for delete to authenticated
  using (private.is_group_admin(group_id));

drop policy if exists "stl_select" on public.settlements;
drop policy if exists "stl_insert" on public.settlements;
drop policy if exists "stl_update" on public.settlements;
drop policy if exists "stl_delete" on public.settlements;
create policy "stl_select" on public.settlements for select to authenticated
  using (private.user_in_group(group_id));
create policy "stl_insert" on public.settlements for insert to authenticated
  with check (private.is_group_admin(group_id));
create policy "stl_update" on public.settlements for update to authenticated
  using (private.is_group_admin(group_id)) with check (private.is_group_admin(group_id));
create policy "stl_delete" on public.settlements for delete to authenticated
  using (private.is_group_admin(group_id));

drop policy if exists "stli_select" on public.settlement_items;
drop policy if exists "stli_insert" on public.settlement_items;
drop policy if exists "stli_update" on public.settlement_items;
drop policy if exists "stli_delete" on public.settlement_items;
create policy "stli_select" on public.settlement_items for select to authenticated
  using (user_id = (select auth.uid())
         or exists (select 1 from public.settlements s
                    where s.id = settlement_id and private.is_group_admin(s.group_id)));
create policy "stli_insert" on public.settlement_items for insert to authenticated
  with check (exists (select 1 from public.settlements s
                      where s.id = settlement_id and private.is_group_admin(s.group_id)));
create policy "stli_update" on public.settlement_items for update to authenticated
  using (exists (select 1 from public.settlements s
                 where s.id = settlement_id and private.is_group_admin(s.group_id)))
  with check (exists (select 1 from public.settlements s
                      where s.id = settlement_id and private.is_group_admin(s.group_id)));
create policy "stli_delete" on public.settlement_items for delete to authenticated
  using (exists (select 1 from public.settlements s
                 where s.id = settlement_id and private.is_group_admin(s.group_id)));

-- 5) 가입 트리거: 프로필 생성 + 기본 그룹 자동 편입 --------------
--    ⚠️ 운영자 이메일을 서비스에 맞게 바꿀 것
create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  default_group_id uuid;
  v_role text;
begin
  insert into public.profiles (id, display_name)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'name',
                   new.raw_user_meta_data->>'full_name',
                   split_part(new.email, '@', 1)))
  on conflict (id) do nothing;

  select id into default_group_id from public.groups order by created_at limit 1;
  if default_group_id is not null then
    v_role := case when new.email in ('davidboy7780@gmail.com') then 'owner' else 'member' end;
    insert into public.memberships (user_id, group_id, role)
    values (new.id, default_group_id, v_role)
    on conflict (user_id, group_id) do nothing;
  end if;
  return new;
end;
$$;
revoke execute on function private.handle_new_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- 6) 정산 계산 함수 (INVOKER — RLS가 관리자만 허용) --------------
create or replace function public.calculate_settlement(p_group_id uuid, p_month text)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  v_id uuid;
  v_fee int; v_ar numeric; v_lr numeric; v_lpa int; v_limit int;
  v_prev_month text;
  r record;
  v_abs int; v_late int; v_eff int; v_ded int; v_ref int; v_perfect boolean; v_ci boolean;
begin
  select monthly_fee, absence_rate, late_rate, late_per_absence, absence_limit
    into v_fee, v_ar, v_lr, v_lpa, v_limit
  from public.groups where id = p_group_id;
  if v_fee is null then raise exception 'group not found or no access'; end if;

  v_prev_month := to_char((p_month || '-01')::date - interval '1 month', 'YYYY-MM');

  insert into public.settlements (group_id, month)
  values (p_group_id, p_month)
  on conflict (group_id, month) do update set month = excluded.month
  returning id into v_id;

  if exists (select 1 from public.settlements where id = v_id and status = 'confirmed') then
    raise exception 'settlement already confirmed';
  end if;

  delete from public.settlement_items where settlement_id = v_id;

  for r in select m.user_id from public.memberships m
           where m.group_id = p_group_id and m.active
  loop
    select count(*) filter (where a.status = 'absent'),
           count(*) filter (where a.status = 'late')
      into v_abs, v_late
    from public.attendance_records a
    where a.group_id = p_group_id and a.user_id = r.user_id
      and to_char(a.date, 'YYYY-MM') = p_month;

    v_eff := v_abs + floor(v_late::numeric / v_lpa)::int;
    if v_eff > v_limit then v_ded := v_fee;
    else v_ded := least(v_fee, round(v_abs * v_ar * v_fee + v_late * v_lr * v_fee)::int);
    end if;
    v_ref := v_fee - v_ded;
    v_perfect := (v_abs = 0 and v_late = 0);

    select exists (select 1 from public.settlements s
                   join public.settlement_items i on i.settlement_id = s.id
                   where s.group_id = p_group_id and s.month = v_prev_month
                     and i.user_id = r.user_id and i.carryover)
      into v_ci;

    insert into public.settlement_items
      (settlement_id, user_id, absences, lates, effective_absences,
       deduction, refund, carryover, scholarship, carryover_in)
    values (v_id, r.user_id, v_abs, v_late, v_eff, v_ded, v_ref, v_perfect, v_perfect, v_ci);
  end loop;

  return v_id;
end;
$$;
revoke execute on function public.calculate_settlement(uuid, text) from public;
revoke execute on function public.calculate_settlement(uuid, text) from anon;
grant execute on function public.calculate_settlement(uuid, text) to authenticated;

-- 7) 멤버 셀프 제출 함수 (INVOKER — att_insert_self 정책이 강제) --
create or replace function public.submit_meditation(p_group_id uuid, p_note text)
returns public.attendance_records language plpgsql security invoker set search_path = '' as $$
declare
  v_date date := (now() at time zone 'Asia/Seoul')::date;
  v_time text := to_char(now() at time zone 'Asia/Seoul', 'HH24:MI');
  v_cutoff text;
  v_status text;
  v_rec public.attendance_records;
begin
  select late_cutoff into v_cutoff from public.groups where id = p_group_id;
  v_status := case when v_cutoff is not null and v_time > v_cutoff then 'late' else 'present' end;

  insert into public.attendance_records (group_id, user_id, date, status, source, note, created_by)
  values (p_group_id, (select auth.uid()), v_date, v_status, 'self', nullif(trim(p_note), ''), (select auth.uid()))
  returning * into v_rec;
  return v_rec;
exception when unique_violation then
  raise exception '이미 오늘 묵상을 제출했습니다.';
end;
$$;
revoke execute on function public.submit_meditation(uuid, text) from public;
revoke execute on function public.submit_meditation(uuid, text) from anon;
grant execute on function public.submit_meditation(uuid, text) to authenticated;

-- 8) 나눔 피드 답글 ---------------------------------------------
create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  record_id  uuid not null references public.attendance_records(id) on delete cascade,
  group_id   uuid not null references public.groups(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  content    text not null check (length(trim(content)) > 0),
  created_at timestamptz not null default now()
);
alter table public.comments enable row level security;
grant select, insert, delete on public.comments to authenticated;

drop policy if exists "cmt_select" on public.comments;
drop policy if exists "cmt_insert" on public.comments;
drop policy if exists "cmt_delete" on public.comments;
create policy "cmt_select" on public.comments for select to authenticated
  using (private.user_in_group(group_id));
create policy "cmt_insert" on public.comments for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and private.user_in_group(group_id)
    and exists (select 1 from public.attendance_records r
                where r.id = record_id and r.group_id = comments.group_id)
  );
create policy "cmt_delete" on public.comments for delete to authenticated
  using (user_id = (select auth.uid()) or private.is_group_admin(group_id));

-- 9) 기본 그룹 시드 (이름·규칙은 서비스에 맞게 수정) --------------
insert into public.groups (name, join_code, deadline_default)
values ('묵상대학 기본 그룹', 'DEFAULT', '06:00')
on conflict (join_code) do nothing;
