-- Datos ficticios mínimos para probar lectura real desde Supabase.
-- Ejecutar DESPUÉS de aplicar la migración inicial.
-- Uso recomendado: supabase db push + este seed, o pegar en SQL Editor.

insert into public.academic_periods (id, name, year, term, starts_at, ends_at, is_active)
values (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  'Primer Cuatrimestre 2026 (prueba)',
  2026,
  1,
  '2026-03-01',
  '2026-07-15',
  true
)
on conflict (id) do nothing;

insert into public.careers (id, code, name, faculty, campus)
values (
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
  'INF',
  'Ingeniería Informática (prueba)',
  'Facultad Politécnica',
  'San Lorenzo'
)
on conflict (id) do nothing;

insert into public.courses (id, code, name, career_id, level, semester) values
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc1', 'INF101', 'Programación I (prueba)', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', 1, 1),
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc2', 'INF102', 'Matemática Discreta (prueba)', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', 1, 1)
on conflict (id) do nothing;

insert into public.sections (id, academic_period_id, course_id, section_code, shift, teacher_name, teacher_email, capacity) values
  ('dddddddd-dddd-4ddd-8ddd-ddddddddddd1', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1', 'A', 'Mañana', 'Prof. Prueba Uno', 'prof1@example.com', 40),
  ('dddddddd-dddd-4ddd-8ddd-ddddddddddd2', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1', 'B', 'Tarde', 'Prof. Prueba Dos', 'prof2@example.com', 35),
  ('dddddddd-dddd-4ddd-8ddd-ddddddddddd3', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc2', 'A', 'Noche', 'Prof. Prueba Tres', 'prof3@example.com', 30)
on conflict (id) do nothing;

insert into public.class_meetings (id, section_id, day_of_week, start_time, end_time, classroom) values
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1', 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1', 1, '08:00', '10:00', 'Aula 101'),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2', 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1', 3, '08:00', '10:00', 'Lab 2'),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee3', 'dddddddd-dddd-4ddd-8ddd-ddddddddddd2', 2, '14:00', '16:00', 'Aula 205'),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee4', 'dddddddd-dddd-4ddd-8ddd-ddddddddddd3', 1, '17:00', '19:00', 'Aula 310'),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee5', 'dddddddd-dddd-4ddd-8ddd-ddddddddddd3', 4, '19:00', '21:00', 'Lab 5')
on conflict (id) do nothing;

insert into public.exams (id, section_id, exam_type, exam_date, start_time, end_time, classroom) values
  ('ffffffff-ffff-4fff-8fff-fffffffffff1', 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1', 'Parcial 1', '2026-04-15', '08:00', '10:00', 'Aula 101'),
  ('ffffffff-ffff-4fff-8fff-fffffffffff2', 'dddddddd-dddd-4ddd-8ddd-ddddddddddd3', 'Parcial 1', '2026-04-18', '17:00', '19:00', 'Aula 310')
on conflict (id) do nothing;

insert into public.schedule_versions (
  id, academic_period_id, version, source_file_name, source_checksum, imported_at, is_active, import_status
) values (
  '99999999-9999-4999-8999-999999999991',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  1,
  'seed-test-data.sql',
  'seed-test-v1',
  timezone('utc', now()),
  true,
  'success'
)
on conflict (id) do nothing;
