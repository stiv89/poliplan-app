-- Preferencias de correo y destinatarios para avisos de horario actualizado.

alter table public.profiles
  add column if not exists notify_schedule_updates boolean not null default true;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.get_schedule_update_recipients(p_period_id uuid)
returns table (
  user_id uuid,
  email text,
  schedule_names text[]
)
language sql
security definer
set search_path = public, auth
as $$
  select
    us.user_id,
    au.email::text,
    array_agg(distinct us.name order by us.name) as schedule_names
  from public.user_schedules us
  join auth.users au on au.id = us.user_id
  left join public.profiles p on p.id = us.user_id
  where us.academic_period_id = p_period_id
    and au.email is not null
    and length(trim(au.email)) > 0
    and coalesce(p.notify_schedule_updates, true) = true
  group by us.user_id, au.email;
$$;

revoke all on function public.get_schedule_update_recipients(uuid) from public;
grant execute on function public.get_schedule_update_recipients(uuid) to service_role;
