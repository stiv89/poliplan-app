-- Rollback manual de una importación fallida o no deseada.
--
-- IMPORTANTE: no ejecutes este archivo si nunca corriste una importación real.
-- Si solo tenés datos de seed (versión 1 activa), NO necesitás rollback.
--
-- Paso 1: ejecutá scripts/admin/inspect-versions.sql y confirmá qué versiones existen.
-- Paso 2: editá SOLO los dos números de versión abajo y ejecutá este bloque.

do $$
declare
  v_period_id uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
  v_failed_version int := 2;   -- versión importada que querés descartar
  v_rollback_version int := 1; -- versión que querés dejar activa
  v_failed_id uuid;
  v_rollback_id uuid;
begin
  select id
  into v_failed_id
  from public.schedule_versions
  where academic_period_id = v_period_id
    and version = v_failed_version;

  select id
  into v_rollback_id
  from public.schedule_versions
  where academic_period_id = v_period_id
    and version = v_rollback_version;

  if v_failed_id is null then
    raise exception 'No existe la versión % en el periodo %. Ejecutá inspect-versions.sql primero.',
      v_failed_version, v_period_id;
  end if;

  if v_rollback_id is null then
    raise exception 'No existe la versión de rollback % en el periodo %.',
      v_rollback_version, v_period_id;
  end if;

  if v_failed_id = v_rollback_id then
    raise exception 'La versión a descartar y la de rollback no pueden ser la misma.';
  end if;

  update public.schedule_versions
  set is_active = false, import_status = 'failed'
  where id = v_failed_id;

  delete from public.exams
  where section_id in (
    select id from public.sections where schedule_version_id = v_failed_id
  );

  delete from public.class_meetings
  where section_id in (
    select id from public.sections where schedule_version_id = v_failed_id
  );

  delete from public.sections
  where schedule_version_id = v_failed_id;

  delete from public.schedule_versions
  where id = v_failed_id;

  update public.schedule_versions
  set is_active = true, import_status = 'success', error_message = null
  where id = v_rollback_id;

  raise notice 'Rollback OK: descartada versión % (%), activa versión % (%).',
    v_failed_version, v_failed_id, v_rollback_version, v_rollback_id;
end $$;

-- Verificación (opcional, ejecutar después):
-- \i scripts/admin/inspect-versions.sql
