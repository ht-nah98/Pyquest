-- Security advisor (05/11): helper functions must not be callable through the REST API.
-- The trigger function runs as a trigger only; is_coach moves to a schema PostgREST does not expose.

revoke execute on function public.on_new_user() from anon, authenticated, public;

create schema if not exists private;
grant usage on schema private to authenticated;

create function private.is_coach() returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'coach');
$$;
revoke execute on function private.is_coach() from anon, public;
grant execute on function private.is_coach() to authenticated;

drop policy "read own profile, coach reads all" on public.profiles;
create policy "read own profile, coach reads all" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select private.is_coach()));

drop policy "read own progress, coach reads all" on public.lesson_states;
create policy "read own progress, coach reads all" on public.lesson_states
  for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_coach()));

drop function public.is_coach();
