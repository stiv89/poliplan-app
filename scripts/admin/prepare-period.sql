-- Preparación del periodo académico real antes de la primera importación institucional.
-- Ejecutar en Supabase SQL Editor.

update public.academic_periods
set
  name = 'Primer Cuatrimestre 2026',
  year = 2026,
  term = 1,
  starts_at = '2026-03-01',
  ends_at = '2026-07-15',
  is_active = true,
  updated_at = timezone('utc', now())
where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';

-- Si el periodo no existe, descomentá e insertá:
-- insert into public.academic_periods (id, name, year, term, starts_at, ends_at, is_active)
-- values (
--   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
--   'Primer Cuatrimestre 2026',
--   2026,
--   1,
--   '2026-03-01',
--   '2026-07-15',
--   true
-- )
-- on conflict (id) do nothing;
