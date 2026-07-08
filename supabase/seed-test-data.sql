-- DEPRECATED: datos ficticios de prueba. No usar en producción.
-- Para datos reales: scripts/admin/reset-academic-data.sql + npm run admin:fresh-start
--
-- Datos ficticios mínimos para probar lectura real desde Supabase.
-- Ejecutar DESPUÉS de aplicar todas las migraciones.
-- Uso recomendado: pegar en Supabase SQL Editor o usar supabase db seed.

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

-- Docentes ANTES de secciones (FK sections.teacher_id → teachers.id)
-- Si la migración ya creó filas con el mismo email pero otro id, las reemplazamos.
delete from public.teachers
where lower(email) in ('prof1@example.com', 'prof2@example.com', 'prof3@example.com')
  and id not in (
    '11111111-1111-4111-8111-111111111101',
    '11111111-1111-4111-8111-111111111102',
    '11111111-1111-4111-8111-111111111103'
  );

insert into public.teachers (id, name, email, name_normalized) values
  ('11111111-1111-4111-8111-111111111101', 'Prof. Prueba Uno',  'prof1@example.com', 'prueba uno'),
  ('11111111-1111-4111-8111-111111111102', 'Prof. Prueba Dos',  'prof2@example.com', 'prueba dos'),
  ('11111111-1111-4111-8111-111111111103', 'Prof. Prueba Tres', 'prof3@example.com', 'prueba tres')
on conflict (id) do update set
  name = excluded.name,
  email = excluded.email,
  name_normalized = excluded.name_normalized;

insert into public.sections (
  id, academic_period_id, course_id, section_code, shift,
  teacher_name, teacher_email, teacher_id, capacity, schedule_version_id
) values
  (
    'dddddddd-dddd-4ddd-8ddd-ddddddddddd1',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
    'A', 'Mañana', 'Prof. Prueba Uno', 'prof1@example.com',
    '11111111-1111-4111-8111-111111111101', 40,
    '99999999-9999-4999-8999-999999999991'
  ),
  (
    'dddddddd-dddd-4ddd-8ddd-ddddddddddd2',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
    'B', 'Tarde', 'Prof. Prueba Dos', 'prof2@example.com',
    '11111111-1111-4111-8111-111111111102', 35,
    '99999999-9999-4999-8999-999999999991'
  ),
  (
    'dddddddd-dddd-4ddd-8ddd-ddddddddddd3',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    'cccccccc-cccc-4ccc-8ccc-ccccccccccc2',
    'A', 'Noche', 'Prof. Prueba Tres', 'prof3@example.com',
    '11111111-1111-4111-8111-111111111103', 30,
    '99999999-9999-4999-8999-999999999991'
  )
on conflict (id) do update set
  schedule_version_id = excluded.schedule_version_id,
  teacher_id = excluded.teacher_id,
  teacher_name = excluded.teacher_name,
  teacher_email = excluded.teacher_email;

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

update public.sections
set schedule_version_id = '99999999-9999-4999-8999-999999999991'
where academic_period_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'
  and schedule_version_id is null;

update public.sections s
set teacher_id = t.id
from public.teachers t
where s.teacher_id is null
  and s.teacher_email is not null
  and lower(trim(s.teacher_email)) = lower(t.email);
