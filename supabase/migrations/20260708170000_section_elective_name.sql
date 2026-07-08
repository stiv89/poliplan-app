-- Nombre específico de la electiva/optativa por sección (ej. "Big Data" dentro de "Electiva 1").
alter table public.sections
  add column if not exists specific_elective_name text;
