-- Las electivas/optativas comparten course_id + section_code + shift, y se
-- distinguen por specific_elective_name (ej. Electiva 1 / Big Data vs Blockchain).
drop index if exists public.idx_sections_version_course_section_shift;

create unique index idx_sections_version_course_section_shift
  on public.sections (
    schedule_version_id,
    course_id,
    section_code,
    coalesce(shift, ''),
    coalesce(specific_elective_name, '')
  );
