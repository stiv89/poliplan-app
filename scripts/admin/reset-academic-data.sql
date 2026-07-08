-- Limpieza completa de datos académicos en Supabase.
-- Ejecutar en SQL Editor ANTES de una importación limpia.
--
-- Conserva: usuarios auth, perfiles (career_id se anula).
-- Elimina: horarios, materias, carreras, docentes, reseñas, importaciones.

begin;

update public.profiles
set career_id = null
where career_id is not null;

delete from public.teacher_review_reports;
delete from public.teacher_reviews;
delete from public.user_schedule_sections;
delete from public.user_schedules;
delete from public.exams;
delete from public.class_meetings;
delete from public.sections;
delete from public.schedule_versions;
delete from public.schedule_imports;
delete from public.courses;
delete from public.teachers;
delete from public.careers;
delete from public.academic_periods;

-- Periodos académicos (IDs estables usados por la app y el importador)
insert into public.academic_periods (id, name, year, term, starts_at, ends_at, is_active)
values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    'Primer Periodo 2026',
    2026,
    1,
    '2026-03-01',
    '2026-07-31',
    true
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    'Primer Periodo Académico 2025 – Carreras de Grado',
    2025,
    1,
    '2025-03-01',
    '2025-07-31',
    false
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
    'Segundo Periodo Académico 2025 – Carreras de Grado',
    2025,
    2,
    '2025-08-01',
    '2025-12-31',
    false
  );

-- Carreras FPUNA (IDs deterministas, coinciden con el importador)
insert into public.careers (id, code, name, faculty, campus) values
  ('ff0eda67-c62a-4c79-4a94-ead9ae9d7735', 'IAE', 'Ingeniería Aeronáutica', 'Facultad Politécnica', 'San Lorenzo'),
  ('2e412812-06eb-4e7e-f68f-d001c1abb3f6', 'ICM', 'Ingeniería Civil Mención Construcciones', 'Facultad Politécnica', 'San Lorenzo'),
  ('b1cd460a-4f9c-4b63-0ab4-408e051f3394', 'IEK', 'Ingeniería Eléctrica Mención Electrónica', 'Facultad Politécnica', 'San Lorenzo'),
  ('1254efce-9564-4dd2-5d5a-434193acfee8', 'IEL', 'Ingeniería Eléctrica Mención Electricidad', 'Facultad Politécnica', 'San Lorenzo'),
  ('e8165b66-895d-42fb-ce33-b488dc80d10c', 'IEN', 'Ingeniería Electrónica', 'Facultad Politécnica', 'San Lorenzo'),
  ('5a3e3a44-e677-45e4-80d1-adc10f8c0286', 'IIN', 'Ingeniería Informática', 'Facultad Politécnica', 'San Lorenzo'),
  ('ad30532c-68d3-4ed5-508c-a01345a2b8d2', 'IMK', 'Ingeniería Mecánica', 'Facultad Politécnica', 'San Lorenzo'),
  ('a825efde-9f3a-4318-9cf0-c6fd39db0bb8', 'ISP', 'Ingeniería en Sistemas de Producción', 'Facultad Politécnica', 'San Lorenzo'),
  ('f331ae09-4f1a-4c3e-d47a-6aaedcc8dcc5', 'LCA', 'Licenciatura en Ciencias Ambientales', 'Facultad Politécnica', 'San Lorenzo'),
  ('18bbd5da-3769-4890-c46d-78bb8b243d0c', 'LCI', 'Licenciatura en Comercio Internacional', 'Facultad Politécnica', 'San Lorenzo'),
  ('b8e9840e-15ff-4d7f-4794-8b0768845d16', 'LEL', 'Licenciatura en Electrónica', 'Facultad Politécnica', 'San Lorenzo'),
  ('c37828e4-e125-4676-14bd-45023bf3021e', 'LGH', 'Licenciatura en Gestión Hotelera', 'Facultad Politécnica', 'San Lorenzo'),
  ('235effe1-b7dd-4c4a-95fa-3730a2bc66f2', 'TSE', 'Tecnicatura en Sistemas Eléctricos', 'Facultad Politécnica', 'San Lorenzo')
on conflict (code) do update set
  name = excluded.name,
  faculty = excluded.faculty,
  campus = excluded.campus;

commit;

-- Verificación rápida (debe devolver 1 periodo, 0 secciones):
-- select (select count(*) from public.academic_periods) as periods,
--        (select count(*) from public.sections) as sections,
--        (select count(*) from public.careers) as careers;
