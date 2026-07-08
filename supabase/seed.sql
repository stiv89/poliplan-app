-- Seed mínimo de referencia. Para datos reales usar admin:fresh-start o import:schedule.
-- Periodo ID estable (debe coincidir con la app y el importador).

insert into public.academic_periods (id, name, year, term, starts_at, ends_at, is_active)
values (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  'Primer Periodo 2026',
  2026,
  1,
  '2026-03-01',
  '2026-07-15',
  true
)
on conflict (id) do update set
  name = excluded.name,
  is_active = excluded.is_active;

-- Carreras: ver supabase/seed-careers.sql (14 carreras FPUNA con IDs deterministas).
