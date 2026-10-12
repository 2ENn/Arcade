-- ============================================================
--  Taoob Arcade : ฐานข้อมูลบัญชีผู้เล่น + อันดับ
--  วิธีใช้: Supabase Dashboard -> SQL Editor -> วางทั้งไฟล์นี้ -> Run
--  (รันซ้ำได้ ไม่ทำให้ข้อมูลเดิมหาย)
-- ============================================================

-- 1) โปรไฟล์ผู้เล่น (ชื่อผู้ใช้) ผูกกับบัญชีของ Supabase Auth
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text not null unique check (username ~ '^[a-z0-9_]{3,16}$'),
  created_at  timestamptz not null default now()
);

-- 2) สถิติต่อผู้เล่น ต่อเกม ต่อหมวด (เช่น sudoku/easy, amath/online)
create table if not exists public.player_stats (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  game        text not null check (game in ('amath','sudoku','game24','chess','checkers')),
  cat         text not null check (cat ~ '^[a-z0-9_]{1,20}$'),
  plays       int  not null default 0,
  wins        int  not null default 0,
  best_time   numeric,          -- วินาที ยิ่งน้อยยิ่งดี (ถ้าเกมนั้นมี)
  best_score  numeric,          -- คะแนนสูงสุด (A-Math)
  points      int  not null default 0,
  updated_at  timestamptz not null default now(),
  primary key (user_id, game, cat)
);

-- (สำหรับผู้ที่เคยรันสคริปต์นี้มาก่อนที่จะมีหมากรุก/หมากฮอส: อัปเดตรายชื่อเกมที่อนุญาต รันซ้ำได้ไม่เสียหาย)
alter table public.player_stats drop constraint if exists player_stats_game_check;
alter table public.player_stats add constraint player_stats_game_check
  check (game in ('amath','sudoku','game24','chess','checkers'));

-- 3) สิทธิ์: ทุกคนอ่านได้ แต่ "เขียนตรงๆ ไม่ได้" ต้องผ่านฟังก์ชันด้านล่างเท่านั้น
alter table public.profiles     enable row level security;
alter table public.player_stats enable row level security;

drop policy if exists "profiles readable" on public.profiles;
create policy "profiles readable" on public.profiles for select using (true);
drop policy if exists "stats readable" on public.player_stats;
create policy "stats readable" on public.player_stats for select using (true);

revoke insert, update, delete on public.profiles     from anon, authenticated;
revoke insert, update, delete on public.player_stats from anon, authenticated;

-- 4) สมัครสมาชิกแล้วสร้างโปรไฟล์ให้อัตโนมัติ (อ่านชื่อจาก metadata ตอนสมัคร)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username)
  values (new.id, lower(new.raw_user_meta_data ->> 'username'));
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5) ส่งผลเกม: เกมเรียกฟังก์ชันนี้ตอนจบเกม (ต้องล็อกอิน)
--    คะแนนต่อครั้งถูกจำกัดไม่เกิน 20 กันกรอกเกินจริงแบบหยาบๆ
create or replace function public.report_result(
  p_game text, p_cat text, p_won boolean,
  p_time numeric default null, p_score numeric default null, p_points int default 0)
returns void language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  pts int  := least(greatest(coalesce(p_points, 0), 0), 20);
begin
  if uid is null then raise exception 'not signed in'; end if;
  if p_time is not null and (p_time < 0 or p_time > 86400) then p_time := null; end if;

  insert into public.player_stats (user_id, game, cat, plays, wins, best_time, best_score, points)
  values (uid, p_game, p_cat, 1,
          case when p_won then 1 else 0 end,
          case when p_won then p_time end,
          case when p_won then p_score end,
          case when p_won then pts else 0 end)
  on conflict (user_id, game, cat) do update set
    plays      = player_stats.plays + 1,
    wins       = player_stats.wins + case when p_won then 1 else 0 end,
    best_time  = case when p_won and p_time  is not null
                      then least(coalesce(player_stats.best_time,  p_time),  p_time)
                      else player_stats.best_time end,
    best_score = case when p_won and p_score is not null
                      then greatest(coalesce(player_stats.best_score, p_score), p_score)
                      else player_stats.best_score end,
    points     = player_stats.points + case when p_won then pts else 0 end,
    updated_at = now();
end $$;

revoke all on function public.report_result(text, text, boolean, numeric, numeric, int) from public, anon;
grant execute on function public.report_result(text, text, boolean, numeric, numeric, int) to authenticated;

-- 6) มุมมองสำหรับหน้าอันดับ
create or replace view public.leaderboard_game with (security_invoker = true) as
  select p.username, s.game, s.cat, s.plays, s.wins, s.best_time, s.best_score, s.points
  from public.player_stats s join public.profiles p on p.id = s.user_id;

create or replace view public.leaderboard_overall with (security_invoker = true) as
  select p.username,
         coalesce(sum(s.points), 0)::int as points,
         coalesce(sum(s.wins), 0)::int   as wins,
         coalesce(sum(s.plays), 0)::int  as plays
  from public.profiles p left join public.player_stats s on s.user_id = p.id
  group by p.id, p.username;

grant select on public.leaderboard_game, public.leaderboard_overall to anon, authenticated;

-- 7) รีเซตรหัสผ่าน: ใส่ชื่อผู้ใช้ให้ตรง + ตั้งรหัสผ่านใหม่ (ไม่ต้องล็อกอิน ไม่ใช้อีเมล)
--    หมายเหตุ: ใครรู้ชื่อผู้ใช้ก็รีเซตรหัสของชื่อนั้นได้ เหมาะกับกลุ่มเพื่อนเล่นกันเอง
create extension if not exists pgcrypto with schema extensions;

-- (ลบของรุ่นรหัสกู้คืนที่เคยรันไว้ ถ้ามี)
drop function if exists public.reset_password(text, text, text);
drop function if exists public.set_recovery(text);
drop table    if exists public.recovery;

create or replace function public.reset_password(p_username text, p_new_pw text)
returns boolean language plpgsql security definer set search_path = public, extensions, auth as $$
declare uid uuid;
begin
  if p_new_pw is null or length(p_new_pw) < 20 then return false; end if;
  select id into uid from public.profiles where username = lower(coalesce(p_username, ''));
  if uid is null then return false; end if;
  update auth.users set encrypted_password = crypt(p_new_pw, gen_salt('bf')), updated_at = now() where id = uid;
  return true;
end $$;

revoke all on function public.reset_password(text, text) from public;
grant execute on function public.reset_password(text, text) to anon, authenticated;
