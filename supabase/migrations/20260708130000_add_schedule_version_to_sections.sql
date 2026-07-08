-- Vincula secciones a una versión importada para evitar mezclar datos entre versiones.

alter table public.sections
  add column if not exists schedule_version_id uuid
  references public.schedule_versions(id) on delete cascade;

create index if not exists idx_sections_schedule_version_id
  on public.sections(schedule_version_id);

create unique index if not exists idx_sections_version_course_section_shift
  on public.sections(schedule_version_id, course_id, section_code, coalesce(shift, ''));

comment on column public.sections.schedule_version_id is
  'Versión de horario a la que pertenece la sección. Solo la versión activa se expone en la app.';
