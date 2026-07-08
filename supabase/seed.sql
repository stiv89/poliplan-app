-- Seed mínimo de referencia. Para datos reales usar admin:fresh-start o import:schedule.
-- Periodo ID estable (debe coincidir con la app y el importador).

insert into public.academic_periods (id, name, year, term, starts_at, ends_at, is_active)
values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    'Primer Periodo 2026',
    2026,
    1,
    '2026-03-01',
    '2026-07-15',
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
  )
on conflict (id) do update set
  name = excluded.name,
  year = excluded.year,
  term = excluded.term,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  is_active = excluded.is_active;

-- Carreras: ver supabase/seed-careers.sql (14 carreras FPUNA con IDs deterministas).
