-- Seed opcional para entornos de desarrollo administrativos.
-- No incluye datos reales de la facultad.

insert into public.academic_periods (id, name, year, term, starts_at, ends_at, is_active)
values
  ('11111111-1111-4111-8111-111111111101', 'Primer Cuatrimestre 2026', 2026, 1, '2026-03-01', '2026-07-15', true)
on conflict (id) do nothing;

insert into public.careers (id, code, name, faculty, campus)
values
  ('22222222-2222-4222-8222-222222222201', 'INF', 'Ingeniería Informática', 'Facultad Politécnica', 'San Lorenzo')
on conflict (id) do nothing;
