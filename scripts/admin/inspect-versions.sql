-- Inspección de versiones de horario (ejecutar tal cual en Supabase SQL Editor).

select
  sv.id,
  sv.version,
  sv.is_active,
  sv.import_status,
  sv.source_file_name,
  sv.imported_at,
  (select count(*) from public.sections s where s.schedule_version_id = sv.id) as sections_count,
  (select count(*) from public.sections s
   join public.class_meetings cm on cm.section_id = s.id
   where s.schedule_version_id = sv.id) as meetings_count,
  (select count(*) from public.sections s
   join public.exams e on e.section_id = s.id
   where s.schedule_version_id = sv.id) as exams_count
from public.schedule_versions sv
where sv.academic_period_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'
order by sv.version desc;
