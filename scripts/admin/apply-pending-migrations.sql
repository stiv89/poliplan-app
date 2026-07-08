-- Ejecutar en Supabase SQL Editor antes de la primera importación real.

alter table public.sections
  add column if not exists schedule_version_id uuid
  references public.schedule_versions(id) on delete cascade;

create index if not exists idx_sections_schedule_version_id
  on public.sections(schedule_version_id);

create unique index if not exists idx_sections_version_course_section_shift
  on public.sections(schedule_version_id, course_id, section_code, coalesce(shift, ''));

create or replace function public.poliplan_activate_schedule_version(
  p_academic_period_id uuid,
  p_version_id uuid,
  p_import_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.schedule_versions
    where id = p_version_id
      and academic_period_id = p_academic_period_id
  ) then
    raise exception 'Versión % no pertenece al periodo %', p_version_id, p_academic_period_id;
  end if;

  delete from public.exams
  where section_id in (
    select id
    from public.sections
    where academic_period_id = p_academic_period_id
      and schedule_version_id is distinct from p_version_id
  );

  delete from public.class_meetings
  where section_id in (
    select id
    from public.sections
    where academic_period_id = p_academic_period_id
      and schedule_version_id is distinct from p_version_id
  );

  delete from public.sections
  where academic_period_id = p_academic_period_id
    and schedule_version_id is distinct from p_version_id;

  update public.schedule_versions
  set is_active = false
  where academic_period_id = p_academic_period_id
    and id <> p_version_id;

  update public.schedule_versions
  set
    is_active = true,
    import_status = 'success',
    error_message = null
  where id = p_version_id;

  update public.schedule_imports
  set
    status = 'completed',
    finished_at = timezone('utc', now())
  where id = p_import_id;
end;
$$;

revoke all on function public.poliplan_activate_schedule_version(uuid, uuid, uuid) from public;
grant execute on function public.poliplan_activate_schedule_version(uuid, uuid, uuid) to service_role;

update public.academic_periods
set
  name = 'Primer Cuatrimestre 2026',
  year = 2026,
  term = 1,
  starts_at = '2026-03-01',
  ends_at = '2026-07-15',
  is_active = true,
  updated_at = timezone('utc', now())
where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
