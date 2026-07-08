-- Activa una versión importada y reemplaza los datos académicos del periodo de forma atómica.
-- Nota: el modelo actual no usa schedule_version_id en sections; por eso se reemplaza por periodo.

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
  delete from public.exams
  where section_id in (
    select id from public.sections where academic_period_id = p_academic_period_id
  );

  delete from public.class_meetings
  where section_id in (
    select id from public.sections where academic_period_id = p_academic_period_id
  );

  delete from public.sections
  where academic_period_id = p_academic_period_id;

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
