-- Accounts and lesson progress (spec 2026-11-05-supabase-accounts-design.md).
-- Only nickname, avatar, progress and the child's code are stored (AGENTS.md §3 rule 8).

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  -- Students only: the name typed to log in (a-z, 0-9, _). The coach logs in by e-mail.
  login text unique check (login ~ '^[a-z0-9_]{2,20}$'),
  nickname text not null check (char_length(nickname) between 1 and 24),
  avatar text not null default '🐣' check (char_length(avatar) <= 16),
  role text not null check (role in ('student', 'coach')),
  created_at timestamptz not null default now()
);

create table public.lesson_states (
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id text not null check (char_length(lesson_id) <= 40),
  state jsonb not null check (pg_column_size(state) < 512000),
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

-- security definer: reads profiles without going through its own RLS (no recursion).
create function public.is_coach() returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'coach');
$$;
revoke execute on function public.is_coach() from anon, public;
grant execute on function public.is_coach() to authenticated;

alter table public.profiles enable row level security;
alter table public.lesson_states enable row level security;

-- Profiles are written only by the students Edge Function (service role) and the trigger below.
create policy "read own profile, coach reads all" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_coach()));

create policy "read own progress, coach reads all" on public.lesson_states
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_coach()));
create policy "write own progress" on public.lesson_states
  for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "update own progress" on public.lesson_states
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- The first account made in the Dashboard (not a student) becomes the coach. Later ones get no profile,
-- so they can read nothing. Student accounts get their profile from the students function.
create function public.on_new_user() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.email like '%@hs.pyquest.invalid' then
    return new;
  end if;
  if not exists (select 1 from public.profiles where role = 'coach') then
    insert into public.profiles (id, nickname, avatar, role) values (new.id, 'HLV', '🧑‍🏫', 'coach');
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.on_new_user();
